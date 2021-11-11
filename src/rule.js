// @ts-check

/**
 * @typedef {import('./declaration').Declaration} Declaration
 */

export class Rule {
  /**
   * @param {string} selector
   */
  constructor(selector) {
    /** @type {String} */
    this.selector = selector;
    /** @type {Map<string, Declaration>} */
    this.declarations = new Map();
  }

  /** @param {Declaration} declaration */
  addDeclaration(declaration) {
    let name = declaration.propertyName;
    this.declarations.set(name, declaration);
  }
}