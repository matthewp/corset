// @ts-check
import { Bindings } from './bindings.js';
import { renderRoot, unmountRoot } from './render.js';
import { Changeset } from './changeset.js';

/**
 * @typedef {import('./rule').Rule} Rule
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
    /** @type {Map<Element, Bindings>} */
    this.bindingMap = new Map();
  }
  /**
   * @param {any[]} values
   */
  update(values) {
    let invalid = true;
    while(invalid) {
      let changeset = new Changeset(values);
      this.collect(changeset);
      invalid = renderRoot(this.bindingMap, changeset);
    }
  }
  /**
   * 
   * @param {Changeset} changeset 
   */
  collect(changeset) {
    let rootElement = this.rootElement;
    for(let rule of this.rules) {
      for(let el of rootElement.querySelectorAll(rule.selector)) {
        /** @type {Bindings} */
        let bindings;
        if(this.bindingMap.has(el)) {
          bindings = /** @type {Bindings} */(this.bindingMap.get(el));
        } else {
          bindings = new Bindings(rootElement, el);
          this.bindingMap.set(el, bindings);
        }
        for(let declaration of rule.declarations) {
          bindings.add(declaration);
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
      root = /** @type {Root} */(this.roots.get(rootElement));
    } else {
      root = new Root(rootElement, this.sheet);
      this.roots.set(rootElement, root);
    }
    return root.update(this.values);
  }
  /**
   * 
   * @param {Element} rootElement 
   */
  unmount(rootElement) {
    if(this.roots.has(rootElement)) {
      let root = /** @type {Root} */(this.roots.get(rootElement));
      root.unmount();
    }
  }
}