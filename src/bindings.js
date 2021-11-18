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
  eachScope: 1 << 5,
  eachIndex: 1 << 6,
  eachKey: 1 << 7,
  prop: 1 << 8,
  attr: 1 << 9,
  attrToggle: 1 << 10,
  data: 1 << 11,
  attach: 1 << 12,
  attachTemplate: 1 << 13
};

/**
 * @typedef {(rootElement: Element, element: Element, args: Value[], values: any[]) => any} ReadElementValue
 * 
 * @typedef {object} PropertyOptions
 * @property {string} prop
 * @property {number} flag
 * @property {ReadElementValue} read
 * @property {boolean} [multiValue]
 * @property {boolean} [multiBindings]
 */

const readNull = () => null;

/** @type {Record<string, PropertyOptions>} */
const properties = {
  text: { prop: 'text', flag: flags.text, read: (_,el) => el.textContent },
  'class-toggle': { prop: 'classToggle', flag: flags.classToggle, multiValue: true,
    multiBindings: true, read: (root, el, args, values) => {
    let name = args[0].get(root, el, values);
    return [name, el.classList.contains(name)];
   } },
  event: { prop: 'event', flag: flags.event, multiValue: true, multiBindings: true,
     read: (root, el, args, values) => (
      el['on' + args[0].get(root, el, values)] || null
    ) },
  'each-items': { prop: 'eachItems', flag: flags.each, read: readNull },
  'each-template': { prop: 'eachTemplate', flag: flags.each, read: readNull },
  'each-scope': { prop: 'eachScope', flag: flags.eachScope, read: readNull },
  'each-index': { prop: 'eachIndex', flag: flags.eachIndex, read: readNull },
  'each-key': { prop: 'eachKey', flag: flags.eachKey, read: readNull },
  prop: { prop: 'prop', flag: flags.prop, multiValue: true, read: (root, el, args, values) => el[args[0].get(root, el, values)]},
  attr: { prop: 'attr', flag: flags.attr, multiValue: true, read: (root, el, args, values) => el.getAttribute(args[0].get(root, el, values))},
  'attr-toggle': { prop: 'attrToggle', flag: flags.attrToggle, multiValue: true, read: (root, el, args, values) => el.getAttribute(args[0].get(root, el, values))},
  data: { prop: 'data', flag: flags.data, multiValue: true,
    /** @param {any} el */
    read: (root, el, args, values) => el.dataset[args[0].get(root, el, values)]
  },
  'attach-template': { prop: 'attachTemplate', flag: flags.attach | flags.attachTemplate, read: (_root, el) => Array.from(el.childNodes) }
};

/**
 * @typedef {Map<Declaration, ComputedValue>} MultiBindingMap
 */

/**
 * 
 * @param {Bindings} bindings 
 * @param {Declaration} declaration
 * @param {ReadElementValue} read
 * @param {boolean} multiValue
 * @param {any[]} values
 * @returns {ComputedValue}
 */
function createCompute(bindings, declaration, read, multiValue, values) {
  return new ComputedValue(bindings.rootElement, bindings.element,
    read(bindings.rootElement, bindings.element, declaration.args, values), multiValue || false
  );
}

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
    /** @type {MultiBindingMap} */
    this.classToggle = null;
    /** @type {MultiBindingMap} */
    this.event = null;
    /** @type {ComputedValue} */
    this.eachItems = null;
    /** @type {ComputedValue} */
    this.eachTemplate = null;
    /** @type {ComputedValue} */
    this.eachScope = null;
    /** @type {ComputedValue} */
    this.eachIndex = null;
    /** @type {ComputedValue} */
    this.eachKey = null;
    /** @type {ComputedValue} */
    this.prop = null;
    /** @type {ComputedValue} */
    this.attr = null;
    /** @type {ComputedValue} */
    this.attrToggle = null;
    /** @type {ComputedValue} */
    this.data = null;
    /** @type {ComputedValue} */
    this.attachTemplate = null;

    /** @type {null | Map<string, ComputedValue>} */
    this.custom = null;
  }
  /**
   * Add a declaration for these bindings
   * @param {Declaration} declaration 
   * @param {any[]} values
   */
  add(declaration, values) {
    let propertyName = declaration.propertyName;
    if(propertyName in properties) {
      let { prop, flag, multiValue, multiBindings, read } = properties[propertyName];
      if(this[prop] === null) {
        this.flags |= flag;
        let compute = createCompute(this, declaration, read, multiValue, values);
        if(multiBindings) {
          this[prop]  = new Map();
          this[prop].set(declaration, compute);
        } else
          this[prop] = compute;
      }
      if(multiBindings) {
        /** @type {ComputedValue} */
        let compute;
        if(this[prop].has(declaration))
          compute = this[prop].get(declaration);
        else {
          compute = createCompute(this, declaration, read, multiValue, values);
          this[prop].set(declaration, compute);
        }
        compute.addDeclaration(declaration);
      }
      else
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