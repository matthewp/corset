// @ts-check
import { Bindings } from './bindings.js';
import { renderRoot, unmountRoot } from './render.js';
import { Changeset } from './changeset.js';
import { Mountpoint } from './mount.js';

/**
 * @typedef {import('./types').HostElement} HostElement
 * @typedef {import('./types').RootElement} RootElement
 */

/**
 * 
 * @param {Function} a 
 * @returns {Function}
 */
const identity = (a) => a;

/**
 * @typedef {import('./rule').Rule} Rule
 */

export class Root {
  /**
   * @param {RootElement | Mountpoint} rootElement 
   * @param {BindingSheet} sheet 
   */
  constructor(rootElement, sheet) {
    /** @type {Mountpoint | null} */
    this.mount = (rootElement instanceof Mountpoint) ? rootElement : null;
    /** @type {RootElement} */
    this.rootElement = this.mount ? this.mount.rootElement :
      /** @type {HTMLElement} */(rootElement);
    /** @type {Rule[]} */
    this.rules = sheet.rules;
    /** @type {Map<HostElement, Bindings>} */
    this.bindingMap = new Map();
    /** @type {(a: () => any) => any} */
    this.getCallback = this.mount ? this.mount.getCallback.bind(this.mount) : identity;
    /** @type {any[]} */
    this.values = /** @type {any[]} */(/** @type {unknown} */(null));
    /** @type {number} */
    this.queue = 0;
  }
  /**
   * @param {any[]} values
   * @returns {boolean}
   */
  update(values = this.values) {
    this.values = values;
    this.queue++;
    if(this.queue > 1) return false;
    let invalid = true;
    let changed = false;
    while(invalid) {
      let changeset = new Changeset(values);
      this.collect();
      invalid = renderRoot(this.bindingMap, this, changeset);
      if(invalid) changed = true;
    }
    if(changed) {
      this.mount?.parent?.update();
    }
    this.queue = 0;
    return changed;
  }
  /**
   * Collect all of the bindings
   */
  collect() {
    let rootElement = this.rootElement;
    for(let rule of this.rules) {
      for(let el of rule.querySelectorAll(rootElement)) {
        /** @type {Bindings} */
        let bindings;
        if(this.bindingMap.has(el)) {
          bindings = /** @type {Bindings} */(this.bindingMap.get(el));
        } else {
          bindings = new Bindings(this, el);
          this.bindingMap.set(el, bindings);
        }
        for(let declaration of rule.declarations) {
          bindings.add(declaration);
        }
      }
    }
  }
  unmount() {
    unmountRoot(this.bindingMap, this);
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
    /** @type {WeakMap<Element | Mountpoint, Root>} */
    this.roots = new WeakMap();
    this.sheet = sheet;
    this.values = values;
  }

  /**
   * @param {HTMLElement | Mountpoint} rootElement
   * @returns {boolean}
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
   * @param {Element | Mountpoint} rootElement 
   */
  unmount(rootElement) {
    if(this.roots.has(rootElement)) {
      let root = /** @type {Root} */(this.roots.get(rootElement));
      root.unmount();
    }
  }
}