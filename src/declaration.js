/** @typedef {import('./rule').Rule} Rule */
/** @typedef {import('./property').Property} Property */
/** @typedef {import('./value').Value} Value */

export class Declaration {
  /**
   * @param {Rule} rule
   * @param {Property} property
   * @param {Value[]} args
   */
  constructor(rule, property, ...args) {
    /** @type {Rule} */
    this.rule = rule;
    /** @type {Property} */
    this.property = property;
    /** @type {Value[]} */
    this.args = args;
  }
}