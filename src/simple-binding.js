// @ts-check

import { Binding } from './binding.js';
import { properties } from './property.js';

/**
 * @typedef {import('./property').PropertyDefinition} PropertyDefinition
 * @typedef {import('./property').SimplePropertyDefinition} SimplePropertyDefinition
 * @typedef {import('./sheet').Root} Root
 */

export class SimpleBinding extends Binding {
  /**
   * 
   * @param {SimplePropertyDefinition} defn
   * @param {string} propName 
   * @param {[Root, Element | ShadowRoot | Document]} args 
   */
  constructor(defn, propName, ...args) {
    super(propName, ...args);

    /** @type {SimplePropertyDefinition} */
    this.defn = defn;

    /** @type {any} */
    this.initial = this.defn.read(this.element);
  }
}