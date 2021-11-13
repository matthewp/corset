// @ts-check

/**
 * @typedef {object} FragData
 * @property {any} item
 * @property {number} index
 * 
 * @typedef {DocumentFragment & { nodes?: Array<ChildNode>; data?: FragData }} EachFragment
 */

/**
 * 
 * @param {string} varName 
 */
function varToDataProp(varName) {
  let prop = varName.substr(2);
  // TODO make this work
  let dataProp = 'dslProp' + prop[0].toUpperCase() + prop.substr(1);
  return dataProp;
}

export class EachInstance {
  /**
   * @param {Element} host 
   * @param {HTMLTemplateElement} template
   * @param {string} key
   * @param {string} scopeName
   * @param {string} indexName
   */
  constructor(host, template, key, scopeName, indexName) {
    /** @type {Element} */
    this.host = host;
    /** @type {HTMLTemplateElement} */
    this.template = template;
    /** @type {string} */
    this.key = key;
    /** @type {string} */
    this.scopeName = scopeName;
    /** @type {string} */
    this.indexName = indexName;
    /** @type {(item: any, index: number) => any} */
    this.keyFn = null;
  }
  /**
   * 
   * @param {any[]} values
   */
  set(values) {
    if(!this.start) {
      let doc = this.host.ownerDocument;
      this.keyFn = this.key ? this.keyKeyed : this.keyNonKeyed;
      this.start = doc.createComment(`each(items)`);
      this.end = doc.createComment(`end each(items)`);
      //this.node.replaceWith(this.start);
      this.host.append(this.start);
      this.start.after(this.end);
      /** @type {EachFragment[]} */
      this.frags = [];
      /** @type {any[]} */
      this.keys = [];
      /** @type {Map<any, EachFragment>} */
      this.keyMap = new Map();
    }
    return this.updateValues(values);
  }
  /**
   * 
   * @param {EachFragment} frag 
   * @param {*} value 
   * @param {*} index 
   */
  setData(frag, value, index) {
    let scopeProp = varToDataProp(this.scopeName);
    let indexProp = varToDataProp(this.indexName);
    for(let element of frag.nodes) {
      if('dataset' in element) {
        /** @type {HTMLElement} */
        (element).dataset[scopeProp] = '';
        element[Symbol.for(this.scopeName)] = value;
         /** @type {HTMLElement} */
        (element).dataset[indexProp] = '';
        element[Symbol.for(this.indexName)] = index;
      }

    }
  }
  render(index, value) {
    /** @type {EachFragment} */
    let frag = this.host.ownerDocument.importNode(this.template.content, true);
    frag.nodes = Array.from(frag.childNodes);
    frag.data = { item: value, index };
    this.setData(frag, value, index);
    return frag;
  }
  /**
   * 
   * @param {any} _ 
   * @param {number} index 
   * @returns {any}
   */
  keyNonKeyed(_, index) {
    return index;
  }
  keyKeyed(value) {
    return value[this.key];
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
  /**
   * 
   * @param {EachFragment} frag 
   * @param {number} index 
   * @param {any} value 
   * @returns 
   */
  updateFrag(frag, index, value) {
    if(frag.data.item !== value || frag.data.index !== index) {
      this.setData(frag, value, index);
    }
    return frag;
  }
  /**
   * 
   * @param {any[]} values
   */
  updateValues(values = []) {
    let invalid = false,
      /** @type {EachFragment[]} */
      oldFrags = this.frags,
      /** @type {EachFragment[]} */
      newFrags = [],
      oldKeys = this.keys;

    let expectedMap = new Map();
    /** @type {any[]} */
    let newKeys = [];
    for(let i = 0, len = values.length; i < len; i++) {
      let key = this.keyFn(values[i], i);
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
          let frag = this.keyMap.get(this.keyFn(value, newHead));
          if(frag === undefined) {
            frag = this.render(newHead, value);
            this.keyMap.set(this.keyFn(value, newHead), frag);
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
      this.keyMap.set(this.keyFn(frag.data.item, newHead), frag);
      this.append(frag, newFrags[newHead - 1]);
      newFrags[newHead++] = frag;
      invalid = true;
    }

    while(oldHead <= oldTail) {
      let frag = oldFrags[oldHead];
      this.keyMap.delete(this.keyFn(frag.data.item, oldHead));
      oldHead++;
      this.remove(frag);
      invalid = true;
    }

    this.keys = newKeys;
    this.frags = newFrags;
    return invalid;
  }
}