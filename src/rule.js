// @ts-check

/**
 * @typedef {import('./declaration').Declaration} Declaration
 */

export class Rule {
  /**
   * @param {string} selector
   * @param {number} index
   */
  constructor(selector, index) {
    /** @type {string} */
    this.selector = selector;
    /** @type {number} */
    this.index = index;
    /** @type {number} */
    this.specificity = 0;
    /** @type {Array<Declaration>} */
    this.declarations = [];
  }

  /** @param {Declaration} declaration */
  addDeclaration(declaration) {
    this.declarations.push(declaration);
  }
}