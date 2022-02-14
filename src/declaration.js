import { properties } from './property.js';

/** @typedef {import('./rule').Rule} Rule */
/** @typedef {import('./property').PropertyDefinition} PropertyDefinition */ 
/** @typedef {import('./value').Value} Value */
/** @typedef {import('./template').ValueTemplate} ValueTemplate */

export class Declaration {
  /** @type {ValueTemplate} */
  template;
  /**
   * 
   * @param {Rule} rule 
   * @param {string} propertyName 
   * @param {number} sourceOrder
   */
  constructor(rule, propertyName, sourceOrder) {
    /** @type {Rule} */
    this.rule = rule;
    /** @type {string} */
    this.propertyName = propertyName;
    /** @type {string | null} */
    this.key = null;
    /** @type {ValueTemplate | null} */
    this.keyTemplate = null;
    /** @type {number} */
    this.sourceOrder = sourceOrder;
    /** @type {number} */
    this.flags = 0;
  }

  init() {
    /** @type {PropertyDefinition | undefined} */
    let defn = properties[this.propertyName];
    if(defn) {
      if(defn.multi) {
        this.flags |= flags.multi;
      }
      if(this.key !== null) {
        this.flags |= flags.keyed;
      }
      if(defn.shorthand) {
        this.flags |= flags.longhand;
      } else if(defn.longhand) {
        this.flags |= flags.shorthand;
      }
    }
  }
}

export const flags = {
  shorthand: 1 << 0,
  longhand: 1 << 1,
  keyed: 1 << 2,
  multi: 1 << 3
};