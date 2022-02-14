// @ts-check

import { NO_VALUE } from './value.js';

export class SparseArray extends Array {
  /**
   * 
   * @param {number} len 
   */
  constructor(len) {
    super(len);
    this.fill(NO_VALUE);
    this.numberOfValues = 0;
  }
  /**
   * 
   * @param {number} index 
   * @returns 
   */
  empty(index) {
    return this[index] === NO_VALUE;
  }
  /**
   * @returns {boolean}
   */
  full() {
    return this.numberOfValues === this.length;
  }
  /**
   * 
   * @param {number} index 
   * @param {any} item 
   */
  set(index, item) {
    this[index] = item;
    this.numberOfValues++;
  }
}