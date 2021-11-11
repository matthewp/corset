/** @typedef {import('./rule').Rule} Rule */
/** @typedef {import('./property').Property} Property */
/** @typedef {import('./value').Value} Value */

export class Declaration {
  /**
   * @param {Rule} rule
   * @param {Property} property
   * @param {string} propertyName
   * @param {Value[]} args
   */
  constructor(rule, propertyName, ...args) {
    /** @type {Rule} */
    this.rule = rule;
    /** @type {string} */
    this.propertyName = propertyName;
    /** @type {Value[]} */
    this.args = args;
  }
}