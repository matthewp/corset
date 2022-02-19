// @ts-check

import { Binding } from './binding.js';
import { MultiBinding } from './multi-binding.js';
import { SimpleBinding } from './simple-binding.js';
import { flags, properties } from './property.js';

/**
 * @typedef {import('./types').MountedBehaviorType} MountedBehaviorType
 * @typedef {import('./declaration').Declaration} Declaration
 * @typedef {import('./property').KeyedMultiPropertyDefinition} KeyedMultiPropertyDefinition
 * @typedef {import('./property').PropertyDefinition} PropertyDefinition
 * @typedef {import('./property').SimplePropertyDefinition} SimplePropertyDefinition
 * @typedef {import('./property').ShorthandPropertyDefinition} ShorthandPropertyDefinition
 * @typedef {import('./property').BehaviorMultiPropertyDefinition} BehaviorMultiPropertyDefinition
 * @typedef {import('./property').LonghandPropertyDefinition} LonghandPropertyDefinition
 */


export class Bindings {
  /**
   * Create bindings for a specific element.
   * @param {Element} rootElement 
   * @param {Element} element 
   */
  constructor(rootElement, element) {
    /** @type {Element} */
    this.rootElement = rootElement;
    /** @type {Element} */
    this.element = element;
    /** @type {WeakSet<Declaration>} */
    this.seen = new WeakSet();

    /** @type {Binding | null} */
    this.attachTemplate = null;
    /** @type {MultiBinding<MountedBehaviorType> | null} */
    this.behavior = null;
    /** @type {Binding | null} */
    this.text = null;
    /** @type {MultiBinding<string> | null} */
    this.data = null;
    /** @type {MultiBinding<any[]> | null} */
    this.each = null;
    /** @type {MultiBinding<string> | null} */
    this.event = null;
    /** @type {MultiBinding<string> | null} */
    this.attr = null;
    /** @type {MultiBinding<string> | null} */
    this.classToggle = null;
    /** @type {Binding | null} */
    this.mount = null;
    /** @type {MultiBinding<string> | null} */
    this.prop = null;

    /** @type {Map<string, Binding>} */
    this.custom = new Map();
    /** @type {number} */
    this.flags = 0;
  }

  /**
   * Add a declaration to the binding map
   * @param {Declaration} declaration 
   * @returns 
   */
  add(declaration) {
    if(this.seen.has(declaration)) return;
    this.seen.add(declaration);
    let propName = declaration.propertyName;

    if(propName in properties) {
      /** @type {PropertyDefinition} */
      let defn = properties[propName];

      this.flags |= defn.flag;

      /** @type {KeyedMultiPropertyDefinition | ShorthandPropertyDefinition | BehaviorMultiPropertyDefinition | undefined} */
      let multiDef = undefined;
      if('multi' in defn || 'longhand' in defn) multiDef = defn;
      else if('shorthand' in defn)
        multiDef = /** @type {KeyedMultiPropertyDefinition | ShorthandPropertyDefinition} */(properties[defn.shorthand]);
      if(multiDef) {
        if(!this[multiDef.prop]) {
          this[multiDef.prop] = /** @type {MultiBinding<string> & MultiBinding<any[]> & MultiBinding<MountedBehaviorType>} */
          (new MultiBinding(multiDef, propName, this.rootElement, this.element));
        }

        let kb = /** @type {MultiBinding<any>} */(this[multiDef.prop]);
        kb.add(declaration);
      } else {
        let binding = this.#getOrAddBinding(
          propName,
          /** @type {SimplePropertyDefinition} */(defn)
        );
        binding.push(declaration);
        binding.add(declaration);
      }
    } else if(propName.startsWith('--')) {
      /** @type {Binding} */
      let binding = this.#getOrAddBinding(propName, null);
      binding.push(declaration);
      binding.add(declaration);
      this.flags |= flags.custom;
      this.custom.set(propName, binding);
    }
  }

  /**
   * 
   * @param {string} propertyName
   * @param {SimplePropertyDefinition | null} defn
   * @returns {Binding}
   */
  #getOrAddBinding(propertyName, defn) {
    let bindingProp = defn ? defn.prop : propertyName;
    if(!defn) {
      if(!this.custom.has(propertyName)) {
        let binding = new Binding(propertyName, this.rootElement, this.element);
        this.custom.set(propertyName, binding);
      }
      return /** @type {Binding} */(this.custom.get(propertyName));
    } else if(! /** @type {any} */(this)[bindingProp]) {
      let binding = new SimpleBinding(defn, propertyName, this.rootElement, this.element);
      /** @type {any} */(this)[bindingProp] = binding;
    }
    return /** @type {any} */(this)[bindingProp];
  }
}