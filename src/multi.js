// @ts-check

import { getKey } from './value.js';
import { createCompute } from './compute.js';
import { properties } from './property2.js';

/**
 * @typedef {import('./bindings').Bindings} Bindings
 * @typedef {import('./compute').ComputedValue} ComputedValue
 * @typedef {import('./declaration').Declaration} Declaration
 * @typedef {import('./bindings').PropertyOptions} PropertyOptions
 * @typedef {import('./bindings').ReadElementValue} ReadElementValue
 * @typedef {import('./value').Value} Value
 * 
 * @typedef {import('./property2').PropertyDescriptor} PropertyDescriptor
 */

const readArg = /** @type {ReadElementValue} */ (root, el, key, args, values) => args[0].get(root, el, values);

export class MultiBinding {
  /**
   * 
   * @param {Bindings} bindings 
   * @param {PropertyDescriptor} desc
   */
  constructor(bindings, desc) {
    /** @type {Bindings} */
    this.bindings = bindings;
    /** @type {PropertyDescriptor} */
    this.desc = desc;
    /** @type {Map<string | number | null, ComputedValue>} */
    this.map = new Map();
  }

    /**
   * Add a declaration
   * @param {Declaration} declaration
   * @param {any[]} values
   * @param {Declaration | null} parent
   */
  add(declaration, values, parent) {
    let key = getKey(declaration.key);

    if(parent) {
      for(let [localKey, compute] of this.map) {
        // I'm not sure that this part is right.
        if(localKey === key) {
          compute.addDeclaration(declaration);
          return;
        } else {
          // Adding the parent makes it so that this compute will reset itself.
          compute.addDeclaration(parent);
        }
      }
    }

    let bindings = this.bindings;

    let read = properties.get(declaration.propertyName).read;
    let keyCompute = createCompute(bindings, [declaration.key], readArg, false, null, values);
    let compute = createCompute(bindings, declaration.args, read, false, keyCompute, values);
    compute.addDeclaration(declaration);
    this.map.set(key, compute);
  }

  /**
   * Add a declaration
   * @param {Declaration} declaration
   * @param {any[]} values
   * @param {Declaration | null} parent
   */
  _add(declaration, values, parent) {
    /** @type {Map<string | number, Declaration>} */
    let local = new Map();
    for(let d of declaration.each()) {
      let key = getKey(d.key);
      local.set(key, d);
    }
    for(let [key, compute] of this.map) {
      // I'm not sure that this part is right.
      if(local.has(key)) {
        compute.addDeclaration(local.get(key));
        local.delete(key);
      } else {
        compute.addDeclaration(declaration);
      }
    }
    let bindings = this.bindings;
    for(let [key, d] of local) {
      let read = properties.get(d.propertyName).read;
      let keyCompute = createCompute(bindings, [d.key], readArg, false, null, values);
      let compute = createCompute(bindings, d.args, read, false, keyCompute, values);
      compute.addDeclaration(declaration);
      compute.addDeclaration(d);
      this.map.set(key, compute);
    }
  }

  /**
   * 
   * @param {any[]} values 
   */
  *changes(values) {
    for(let [, compute] of this.map) {
      if(compute.dirty(values)) {
        yield compute;
      }
    }
  }

  /**
   * Get the compute of a key
   * @param {string} key 
   * @returns {ComputedValue}
   */
  get(key) {
    return this.map.get(key);
  }
}