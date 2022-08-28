// @ts-check
export const getKeySymbol = Symbol.for('corset.getKey');

/**
 * @typedef {import('./sheet').Root} Root
 */

export class Store extends Map {
  /** @type {() => any} */
  #update;
  /**
   * 
   * @param {Root} root 
   */
  constructor(root, updateMount = true) {
    super();
    /** @type {Root} */
    this.root = root;
    /** @type {() => any} */
    this.#update = updateMount ?
      this.root.mount ?
      this.root.mount.update.bind(this.root.mount) :
      /** @type {() => void} */(Function.prototype) :
      this.root.update.bind(this.root)
  }
  /**
   * 
   * @param {any} key
   * @returns {any}
   */
  [getKeySymbol](key) {
    return this.get(key);
  }
  /**
   * 
   * @param {string} k 
   * @param {any} v 
   * @returns 
   */
  set(k, v) {
    super.set(k, v);
    this.#update();
    return this;
  }
}

/**
 * 
 * @param {string} storeName 
 * @returns {string}
 */
export const storePropName = storeName => `corset.store.${storeName}`;
/**
 * 
 * @param {string} storeName 
 * @returns {string}
 */
export const storeDataSelector = storeName => `[data-corset-stores~=${storeName}]`;