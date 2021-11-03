// @ts-check
import { Binding } from './binding.js';

/**
 * @typedef {import('./rule').Rule} Rule
 * @typedef {Map<string, Binding>} PropertyBindingMap
 */

class Root {
  /**
   * @param {HTMLElement} rootElement 
   * @param {BindingSheet} sheet 
   */
  constructor(rootElement, sheet) {
    /** @type {HTMLElement} */
    this.rootElement = rootElement;
    /** @type {Rule[]} */
    this.rules = sheet.rules;
    /** @type {Map<Element, PropertyBindingMap>} */
    this.bindingMap = new Map();
  }
  /**
   * @param {any[]} values
   */
  update(values) {
    let invalid = true;
    while(invalid) {
      this.collectBindings();
      invalid = this.updateBindings(values);
    }
  }
  collectBindings() {
    let rootElement = this.rootElement;
    for(let rule of this.rules) {
      for(let el of rootElement.querySelectorAll(rule.selector)) {
        /** @type {PropertyBindingMap} */
        let map;
        if(this.bindingMap.has(el)) {
          map = this.bindingMap.get(el);
        } else {
          map = new Map();
          this.bindingMap.set(el, map);
        }

        for(let [propertyName, declaration] of rule.declarations) {
          /** @type {Binding} */
          let binding;
          if(map.has(propertyName)) {
            binding = map.get(propertyName);
          } else {
            binding = new Binding(el);
            map.set(propertyName, binding);
          }
          binding.addDeclaration(declaration);
        }
      }
    }
  }
  /**
   * @param {any[]} values
   * @returns {Boolean}
   */
  updateBindings(values) {
    for(let [, propertyBindingMap] of this.bindingMap) {
      for(let [,binding] of propertyBindingMap) {
        binding.set(values);
      }
    }
    return false; // TODO change this
  }
}

export class BindingSheet {
  constructor() {
    /** @type {Rule[]} */
    this.rules = [];
  }
  /**
   * Add a rule to this sheet
   * @param {Rule} rule 
   */
  addRule(rule) {
    this.rules.push(rule);
  }
}

export class SheetWithValues {
  /**
   * @param {BindingSheet} sheet
   * @param {any[]} values
   */
  constructor(sheet, values) {
    this.roots = new WeakMap();
    this.sheet = sheet;
    this.values = values;
  }

  /**
   * @param {HTMLElement} rootElement
   */
  update(rootElement) {
    let root;
    if(this.roots.has(rootElement)) {
      root = this.roots.get(rootElement);
    } else {
      root = new Root(rootElement, this.sheet);
      this.roots.set(rootElement, root);
    }
    return root.update(this.values);
  }
}