// @ts-check
import { properties, features } from './property.js';

/** @typedef {import('./rule').Rule} Rule */
/** @typedef {import('./property').PropertyDefinition} PropertyDefinition */ 
/** @typedef {import('./value').Value} Value */
/** @typedef {import('./template').ValueTemplate} ValueTemplate */

export class Declaration {
  /**
   * 
   * @param {Rule} rule 
   * @param {string} propertyName 
   * @param {number} sourceOrder
   * @param {ValueTemplate} template
   */
  constructor(rule, propertyName, sourceOrder, template) {
    /** @type {Rule} */
    this.rule = rule;
    /** @type {string} */
    this.propertyName = propertyName;
    /** @type {ValueTemplate | null} */
    this.keyTemplate = null;
    /** @type {number} */
    this.sourceOrder = sourceOrder;
    /** @type {ValueTemplate} */
    this.template = template;
    /** @type {number} */
    this.flags = 0;
  }

  init() {
    /** @type {PropertyDefinition | undefined} */
    let defn = properties[this.propertyName];
    if(defn) {
      if(defn.feat & features.multi) {
        this.flags |= flags.multi;
      }
      if(defn.feat & features.labeled) {
        this.flags |= flags.label;
      }
      if(defn.feat & features.longhand) {
        this.flags |= flags.longhand;
      } else if(defn.feat & features.shorthand) {
        this.flags |= flags.shorthand;
      } else if(defn.feat & features.behavior) {
        this.flags |= flags.behavior;
      }
    }
  }
}

export const flags = {
  shorthand: 1 << 0,
  longhand: 1 << 1,
  multi: 1 << 2,
  behavior: 1 << 3,
  label: 1 << 4,
};