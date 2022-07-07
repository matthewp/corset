// @ts-check
import { datasetKey } from './custom-prop.js';

/**
 * @typedef {object} FragData
 * @property {any} item
 * @property {number} index
 * 
 * @typedef {DocumentFragment & { nodes: Array<ChildNode>; data: FragData }} EachFragment
 * @typedef {import('./types').HostElement} HostElement
 */

export class EachInstance {
  /** @type {Map<any, EachFragment>} */
  keyMap = new Map();
  /**
   * @param {HostElement} host 
   * @param {HTMLTemplateElement} template
   * @param {string} key
   */
  constructor(host, template, key) {
    /** @type {HostElement} */
    this.host = host;
    /** @type {HTMLTemplateElement} */
    this.template = template;
    /** @type {string} */
    this.key = key;
    /** @type {(item: any, index: number) => any} */
    this.keyFn = this.key ? this.keyKeyed : this.keyNonKeyed;

    let doc = this.host.ownerDocument ?? document;

    /** @type {Comment} */
    this.start = doc.createComment(`each(items)`)
    /** @type {Comment} */
    this.end = doc.createComment(`end each(items)`);

    this.host.append(this.start);
    this.start.after(this.end);

    /** @type {EachFragment[]} */
    this.frags = [];
    /** @type {any[]} */
    this.keys = [];
  }
  /**
   * 
   * @param {any[]} values
   */
  set(values) {
    return this.updateValues(values);
  }
  /**
   * 
   * @param {EachFragment} frag 
   * @param {*} value 
   * @param {*} index 
   */
  setData(frag, value, index) {
    let itemProp = datasetKey('Item');
    let indexProp = datasetKey('Index');
    for(let element of frag.nodes) {
      if('dataset' in element) {
        /** @type {HTMLElement} */
        (element).dataset[itemProp] = '';
        /** @type {any} */
        (element)[Symbol.for(itemProp)] = value;
         /** @type {HTMLElement} */
        (element).dataset[indexProp] = '';
        /** @type {any} */
        (element)[Symbol.for(indexProp)] = index;
      }

    }
  }
  /**
   * 
   * @param {number} index 
   * @param {any} value 
   * @returns 
   */
  render(index, value) {
    let doc = this.host.ownerDocument || document;
    /** @type {EachFragment} */
    let frag = /** @type {EachFragment} */(doc.importNode(this.template.content, true));
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
  /**
   * 
   * @param {any} value 
   * @returns 
   */
  keyKeyed(value) {
    return value[this.key];
  }
  /**
   * 
   * @param {EachFragment} frag 
   * @returns 
   */
  refrag(frag) {
    if(!frag.firstChild && frag.nodes)
      frag.append(...frag.nodes);
    return frag;
  }
  /**
   * @param {EachFragment} frag
   * @param {EachFragment} ref
   */
  append(frag, ref) {
    let sibling = ref ? ref.nodes[ref.nodes.length - 1] : this.start;
    sibling.after(this.refrag(frag));
  }
  /**
   * 
   * @param {EachFragment} frag 
   * @param {EachFragment} ref 
   */
  before(frag, ref) {
    let sibling = ref ? ref.nodes[0] : this.end;
    sibling.before(this.refrag(frag));
  }
  /**
   * 
   * @param {EachFragment} frag 
   */
  remove(frag) {
    let lastNode = frag.nodes[frag.nodes.length - 1];
    this.clear(frag.nodes[0], /** @type {Comment} */(lastNode.nextSibling));
  }
  clear(startNode = this.start.nextSibling, end = this.end) {
    /** @type {ChildNode | null} */
    let node = /** @type {ChildNode} */(startNode);
    /** @type {ChildNode | null} */
    let next;
    while(node !== end) {
      next = /** @type {ChildNode} */(node).nextSibling;
      /** @type {ChildNode} */(node).remove();
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
            // @ts-ignore
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