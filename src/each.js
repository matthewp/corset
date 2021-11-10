/** @typedef {import('./binding').Binding} Binding */
/** @typedef {import('./property').Property} Property */

class EachInstance {
  /**
   * @param {Element} host 
   * @param {HTMLTemplateElement} template
   * @param {string} key
   * @param {string} scopeName
   */
  constructor(host, template, key, scopeName) {
    /** @type {Element} */
    this.host = host;
    /** @type {HTMLTemplateElement} */
    this.template = template;
    /** @type {string} */
    this.key = key;
    /** @type {string} */
    this.scopeName = scopeName;
  }
  /**
   * 
   * @param {any[]} values
   */
  set(values) {
    if(!this.start) {
      let doc = this.host.ownerDocument;
      this.key = this.key ? this.keyKeyed : this.keyNonKeyed;
      this.start = doc.createComment(`each(${this.prop})`);
      this.end = doc.createComment(`end each(${this.prop})`);
      //this.node.replaceWith(this.start);
      this.host.append(this.start);
      this.start.after(this.end);
      this.frags = [];
      this.keys = [];
      this.keyMap = new Map();
    }
    return this.updateValues(values);
  }
  setData(frag, value) {
    let prop = this.scopeName.substr(2);
    let dataProp = 'dslProp' + prop[0].toUpperCase() + prop.substr(1);
    for(let element of frag.children) {
      element.dataset[dataProp] = '';
      element[Symbol.for(this.scopeName)] = value;
    }
  }
  render(index, value) {
    let frag = this.host.ownerDocument.importNode(this.template.content, true);
    frag.nodes = Array.from(frag.childNodes);
    frag.item = value;
    this.setData(frag, value);
    return frag;
  }
  keyNonKeyed(_, index) {
    return index;
  }
  keyKeyed(value) {
    return value[this.args.key];
  }
  refrag(frag) {
    if(!frag.firstChild && frag.nodes)
      frag.append(...frag.nodes);
    return frag;
  }
  append(frag, ref) {
    let sibling = ref ? ref.nodes[ref.nodes.length - 1] : this.start;
    sibling.after(this.refrag(frag));
  }
  before(frag, ref) {
    let sibling = ref ? ref.nodes[0] : this.end;
    sibling.before(this.refrag(frag));
  }
  remove(frag) {
    this.clear(frag.nodes[0], frag.nodes[frag.nodes.length - 1].nextSibling);
  }
  clear(startNode = this.start.nextSibling, end = this.end) {
    let node = startNode;
    let next;
    while(node !== end) {
      next = node.nextSibling;
      node.remove();
      node = next;
    }
  }
  updateFrag(frag, index, value) {
    if(frag.item !== value) {
      this.setData(frag, value);
    }
    return frag;
  }
  /**
   * 
   * @param {any[]} values
   */
  updateValues(values = []) {
    let invalid = false;
    let oldFrags = this.frags,
    newFrags = [],
    oldKeys = this.keys;

    let expectedMap = new Map();
    let newKeys = [];
    for(let i = 0, len = values.length; i < len; i++) {
      let key = this.key(values[i], i);
      expectedMap.set(key, values[i]);
      newKeys[i] = key;
    }

    let newHead = 0,
      newTail = values.length - 1,
      oldHead = 0,
      oldTail = oldFrags.length - 1;
    
    while(oldHead <= oldTail && newHead <= newTail) {
      if (oldFrags[oldHead] === null) {
        oldHead++;
      } else if (oldFrags[oldTail] === null) {
        oldTail--;
      } else if(oldKeys[oldHead] === newKeys[newHead]) {
        newFrags[newHead] =
          this.updateFrag(oldFrags[oldHead], newHead, values[newHead]);
        oldHead++;
        newHead++;
      } else if(oldKeys[oldTail] === newKeys[newTail]) {
        newFrags[newTail] =
          this.updateFrag(oldFrags[oldTail], newHead, values[newTail]);
        oldTail--;
        newTail--;
      } else if(oldKeys[oldHead] === newKeys[newTail]) {
        newFrags[newTail] =
          this.updateFrag(oldFrags[oldHead], newHead, values[newTail]);
        this.before(oldFrags[oldHead], newFrags[newTail + 1]);
        oldHead++;
        newTail--;
      } else if(oldKeys[oldTail] === newKeys[newHead]) {
        newFrags[newHead] =
          this.updateFrag(oldFrags[oldTail], newHead, values[newHead]);
        this.before(oldFrags[oldTail], oldFrags[oldHead]);
        oldTail--;
        newHead++;
      } else {
        if(!expectedMap.has(oldKeys[oldHead])) {
          this.remove(oldFrags[oldHead]);
          oldHead++;
        } else if(!expectedMap.has(oldKeys[oldTail])) {
          this.remove(oldFrags[oldTail]);
          oldTail--;
        } else {
          let value = values[newHead];
          let frag = this.keyMap.get(this.key(value, newHead));
          if(frag === undefined) {
            frag = this.render(newHead, value);
            this.keyMap.set(this.key(value, newHead), frag);
          } else {
            frag = this.updateFrag(frag, newHead, value);
            oldFrags[oldFrags.indexOf(frag)] = null;
          }
          newFrags[newHead] = frag;
          this.append(frag, oldFrags[newHead - 1]);
          newHead++;
        }
      }
    }

    while(newHead <= newTail) {
      let frag = this.render(newHead, values[newHead]);
      this.keyMap.set(this.key(frag.item, newHead), frag);
      this.append(frag, newFrags[newHead - 1]);
      newFrags[newHead++] = frag;
      invalid = true;
    }

    while(oldHead <= oldTail) {
      let frag = oldFrags[oldHead];
      this.keyMap.delete(this.key(frag.item, oldHead));
      oldHead++;
      this.remove(frag);
      invalid = true;
    }

    this.keys = newKeys;
    this.frags = newFrags;
    return invalid;
  }
}

/** @type {Map<Element, EachInstance>} */
const instances = new WeakMap();

/**
 * @typedef {Object} EachDeps
 * @property {any[]} items
 * @property {HTMLTemplateElement} template
 * @property {string} scopeName
 */

/** @type {Property} */
export const EachProperty = {
  name: 'each',
  invalidates: false,
  needsUpdate: true,
  read() {
    return null;
  },
  /**
   * 
   * @param {Binding} binding 
   * @param {any[]} values 
   * @param {Value[]} args 
   * @returns {EachDeps}
   */
  getValue(binding, values, args) {
    return {
      items: args[0].get(binding, values),
      template: args[1].get(binding, values),
      scopeName: args[2].get(binding, values)
    };
  },
  /**
   * @param {Binding} binding 
   * @param {EachDeps} deps
   * @returns {boolean}
   */
  set(binding, {items, template, scopeName}) {
    /** @type {EachInstance} */
    let inst;
    if(instances.has(binding.element)) {
      inst = instances.get(binding.element);
    }
    
    if(!inst || inst.template !== template || inst.scopeName !== scopeName) {
      inst = new EachInstance(binding.element, template, '', scopeName);
      instances.set(binding.element, inst);
    }
    return inst.set(items);
  }
};