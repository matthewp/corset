// @ts-check
import { pascalCase } from './custom-prop.js';

/**
 * @typedef {import('./sheet').Root} Root
 */

export class Store extends Map {
  /**
   * 
   * @param {Root} root 
   */
  constructor(root) {
    super();
    /** @type {Root} */
    this.root = root;
  }
  rebind() {
    this.root.mount?.update();
  }
  /**
   * 
   * @param {string} k 
   * @param {any} v 
   * @returns 
   */
  set(k, v) {
    super.set(k, v);
    this.rebind();
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
export const storeDataName = storeName => `data-corset-store-${storeName}`;
/**
 * 
 * @param {string} storeName 
 * @returns {string}
 */
export const storeDataPropName = storeName => 'corsetStore' + pascalCase('-' + storeName);