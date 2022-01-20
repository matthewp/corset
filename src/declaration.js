import { AnyValue } from './value.js';

/** @typedef {import('./rule').Rule} Rule */
/** @typedef {import('./property').Property} Property */
/** @typedef {import('./value').Value} Value */

export class Declaration {
  /**
   * @param {Rule} rule
   * @param {Property} property
   * @param {string} propertyName
   * @param {number} index
   * @param {Value | null} key
   * @param {Value[][] | Value[]} args
   */
  constructor(rule, propertyName, index, key, ...args) {
    /** @type {Rule} */
    this.rule = rule;
    /** @type {string} */
    this.propertyName = propertyName;
    /** @type {number} */
    this.index = index;
    /** @type {Value} */
    this.key = key;
    /** @type {boolean} */
    this.multi = false;
    /** @type {Value[]} */
    this.args = args;
    /** @type {Declaration[] | null} */
    this.sub = null;
  }

  /**
   * 
   * @returns {Generator<Declaration, void, unknown>}
   */
  * each() {
    if(this.sub === null) {
      yield this;
      return;
    }
    for(let decl of this.sub) {
      yield * decl.each();
    }
  }
}

export class MultiDeclaration extends Declaration {
  constructor(rule, propertyName, index, _, ...args) {
    super(rule, propertyName, index, null, ...args);
    /** @type {boolean} */
    this.multi = true;

    /** @type {Declaration[]} */
    this.sub = [];
    let c = 0;
    for(let _args of args) {
      /** @type {Value} */
      let key = _args[0] || new AnyValue(c++);
      this.sub.push(new Declaration(rule, propertyName, ++index, key, ..._args.slice(1)));
    }
  }

  /**
   * 
   * @param {Declaration} declaration 
   */
  add(declaration) {
    this.sub.push(declaration);
  }
}