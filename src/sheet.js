// @ts-check
import { Bindings } from './bindings.js';
import { renderRoot, unmountRoot } from './render.js';

/**
 * @typedef {import('./rule').Rule} Rule
 * @typedef {Root} SheetRoot
 */

class Root {
  /**
   * @param {HTMLElement} rootElement 
   * @param {BindingSheet} sheet 
   * @param {any[]} values
   */
  constructor(rootElement, sheet, values) {
    /** @type {HTMLElement} */
    this.rootElement = rootElement;
    /** @type {Rule[]} */
    this.rules = sheet.rules;
    /** @type {any[]} */
    this.values = values;
    /** @type {Map<Element, Bindings>} */
    this.bindingMap = new Map();
  }
  /**
   * @param {any[]} values
   */
  update(values) {
    this.values = values;
    let invalid = true;
    while(invalid) {
      this.collect(values);
      invalid = renderRoot(this.bindingMap, values);
    }
  }
  /**
   * 
   * @param {any[]} values 
   */
  collect(values) {
    let rootElement = this.rootElement;
    for(let rule of this.rules) {
      for(let el of rootElement.querySelectorAll(rule.selector)) {
        /** @type {Bindings} */
        let bindings;
        if(this.bindingMap.has(el)) {
          bindings = this.bindingMap.get(el);
        } else {
          bindings = new Bindings(this, el);
          this.bindingMap.set(el, bindings);
        }
        for(let declaration of rule.declarations) {
          bindings.add(declaration, values);
        }
      }
    }
  }
  unmount() {
    unmountRoot(this.bindingMap);
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
    /** @type {WeakMap<Element, Root>} */
    this.roots = new WeakMap();
    this.sheet = sheet;
    this.values = values;
  }

  /**
   * @param {HTMLElement} rootElement
   */
  update(rootElement) {
    /** @type {Root} */
    let root;
    if(this.roots.has(rootElement)) {
      root = this.roots.get(rootElement);
    } else {
      root = new Root(rootElement, this.sheet, this.values);
      this.roots.set(rootElement, root);
    }
    return root.update(this.values);
  }
  unmount(rootElement) {
    if(this.roots.has(rootElement)) {
      this.roots.get(rootElement).unmount();
    }
  }
}