// @ts-check

export class Changeset {
  /**
   * 
   * @param {any[]} values 
   */
  constructor(values) {
    /** @type {any[]} */
    this.values = values;
    /** @type {boolean} */
    this.selectors = true;
    /** @type {number} */
    this.flags = 0;
  }
}