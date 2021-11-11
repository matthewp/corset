// @ts-check

import { ComputedValue } from './compute.js';

/**
 * @typedef {import('./declaration').Declaration} Declaration
 * @typedef {import('./value').Value} Value
 */


export const flags = {
  text: 1 << 0,
  classToggle: 1 << 1,
  event: 1 << 2,
  custom: 1 << 3,
  each: 1 << 4,
  prop: 1 << 5
};

/**
 * @typedef {object} PropertyOptions
 * @property {string} prop
 * @property {number} flag
 * @property {(rootElement: Element, element: Element, args: Value[], values: any[]) => any} read
 * @property {boolean} [multi]
 */

const readNull = () => null;

/** @type {Record<string, PropertyOptions>} */
const properties = {
  text: { prop: 'text', flag: flags.text, read: (_,el) => el.textContent },
  'class-toggle': { prop: 'classToggle', flag: flags.classToggle, multi: true, read: (root, el, args, values) => {
    let name = args[0].get(root, el, values);
    return [name, el.classList.contains(name)];
   } },
  event: { prop: 'event', flag: flags.event, multi: true, read: (root, el, args, values) => (
    el['on' + args[0].get(root, el, values)] || null
   ) },
  'each-items': { prop: 'eachItems', flag: flags.each, read: readNull },
  'each-template': { prop: 'eachTemplate', flag: flags.each, read: readNull },
  'each-scope': { prop: 'eachScope', flag: flags.each, read: readNull },
  prop: { prop: 'prop', flag: flags.prop, multi: true, read: (root, el, args, values) => el[args[0].get(root, el, values)]}
};

export class Bindings {
  /**
   * Create a new map of bindings
   * @param {Element} rootElement
   * @param {Element} element 
   */
  constructor(rootElement, element) {
    /** @type {rootElement} */
    this.rootElement = rootElement;
    /** @type {Element} */
    this.element = element;

    this.flags = 0;

    /** @type {ComputedValue} */
    this.text = null;
    /** @type {ComputedValue} */
    this.classToggle = null;
    /** @type {ComputedValue} */
    this.event = null;
    /** @type {ComputedValue} */
    this.eachItems = null;
    /** @type {ComputedValue} */
    this.eachTemplate = null;
    /** @type {ComputedValue} */
    this.eachScope = null;
    /** @type {ComputedValue} */
    this.prop = null;

    /** @type {null | Map<string, ComputedValue>} */
    this.custom = null;
  }
  /**
   * Add a declaration for these bindings
   * @param {string} propertyName 
   * @param {Declaration} declaration 
   * @param {any[]} values
   */
  add(propertyName, declaration, values) {
    if(propertyName in properties) {
      let { prop, flag, multi, read } = properties[propertyName];
      if(this[prop] === null) {
        this.flags |= flag;
        this[prop] = new ComputedValue(this.rootElement, this.element,
          read(this.rootElement, this.element, declaration.args, values), multi || false
        );
      }
      this[prop].addDeclaration(declaration);
    } else if(propertyName.startsWith('--')) { // Temporary, remove!
      if(this.custom === null) {
        this.flags |= flags.custom;
        this.custom = new Map();
      }
      if(!this.custom.has(propertyName)) {
        let compute = new ComputedValue(this.rootElement, this.element, null, false);
        this.custom.set(propertyName, compute);
      }
      this.custom.get(propertyName).addDeclaration(declaration);
    } else {
      throw new Error('Unknown property ' + propertyName);
    }
  }
}