// @ts-check

/**
 * @typedef {import('./declaration').Declaration} Declaration
 * @typedef {import('./types').RootElement} RootElement
 */

const rootSelect = (/** @type {RootElement} */ el) => [el];
/**
 * @param {RootElement} el
 * @this {Rule}
 * @returns {NodeListOf<Element>}
 */
function querySelect(el) {
  return el.querySelectorAll(this.selector);
}

export class Rule {
  /**
   * @param {string} selector
   */
  constructor(selector) {
    /** @type {String} */
    this.selector = selector;
    /** @type {Array<Declaration>} */
    this.declarations = [];
    /** @type {number} */
    this.specificity = 0;
    /** @type {(el: RootElement) => Iterable<Element | ShadowRoot | Document>} */
    this.querySelectorAll = selector === ':root' || selector === ':scope' ? rootSelect : querySelect;
  }

  /** @param {Declaration} declaration */
  addDeclaration(declaration) {
    this.declarations.push(declaration);
  }
}