// @ts-check

import { ComputedValue, createCompute } from './compute.js';
import { Declaration } from './declaration.js';
import { MultiBinding } from './multi.js';
import { AnyValue } from './value.js';

import { properties as propertyDescriptors } from './property2.js';

/**
 * @typedef {import('./value').Value} Value
 */

export const flags = {
  text: 1 << 0,
  classToggle: 1 << 1,
  event: 1 << 2,
  custom: 1 << 3,
  each: 1 << 4,
  eachKey: 1 << 5,
  prop: 1 << 6,
  attr: 1 << 7,
  attrToggle: 1 << 8,
  data: 1 << 9,
  attach: 1 << 10,
  attachTemplate: 1 << 11,
  mount: 1 << 12,
};

/**
 * @typedef {(rootElement: Element, element: Element, key: ComputedValue, args: Value[] | Value[], values: any[]) => any} ReadElementValue
 * 
 * @typedef {object} LonghandProperty
 * @property {string} name
 * @property {any} default
 * 
 * @typedef {object} PropertyOptions
 * @property {string} prop
 * @property {number} flag
 * @property {ReadElementValue} read
 * @property {boolean} [multiValue]
 * @property {boolean} [multiBindings]
 * @property {LonghandProperty[]} [long]
 */

const readNull = () => null;

/** @type {Record<string, PropertyOptions>} */
const properties = {
  text: { prop: 'text', flag: flags.text, read: (_,el) => el.textContent },
  'class-toggle': { prop: 'classToggle', flag: flags.classToggle, multiValue: false,
    multiBindings: true, read: (root, el, args, values) => {
    let name = args[0].get(root, el, values);
    return  el.classList.contains(name);// [name, el.classList.contains(name)];
   } },
  event: { prop: 'event', flag: flags.event, multiValue: true, multiBindings: true,
     read: (root, el, args, values) => (
      el['on' + args[0].get(root, el, values)] || null
    ) },
  'each-items': { prop: 'eachItems', flag: flags.each, read: readNull },
  'each-template': { prop: 'eachTemplate', flag: flags.each, read: readNull },
  'each-key': { prop: 'eachKey', flag: flags.eachKey, read: readNull },
  prop: { prop: 'prop', flag: flags.prop, multiValue: true, multiBindings: true, read: (root, el, args, values) => el[args[0].get(root, el, values)]},
  attr: {
    prop: 'attr',
    flag: flags.attr,
    multiValue: true,
    multiBindings: true,
    read: (root, el, args, values) => el.getAttribute(args[0].get(root, el, values)),
    long: [{ name: 'attr-value', default: '' }, { name: 'attr-toggle', default: true }]
  },
  'attr-value': { prop: 'attrValue', flag: flags.attr, multiValue: false, multiBindings: true, read: readNull },
  'attr-toggle': { prop: 'attrToggle', flag: flags.attrToggle, multiValue: true, multiBindings: true, read: (root, el, args, values) => el.getAttribute(args[0].get(root, el, values))},
  data: { prop: 'data', flag: flags.data, multiValue: true, multiBindings: true,
    /** @param {any} el */
    read: (root, el, args, values) => el.dataset[args[0].get(root, el, values)]
  },
  'attach-template': { prop: 'attachTemplate', flag: flags.attach | flags.attachTemplate, read: (_root, el) => {
    let tmpl = el.ownerDocument.createElement('template');
    tmpl.content.append(...Array.from(el.childNodes));
    return tmpl;
  } },
  mount: { prop: 'mount', flag: flags.mount, read: readNull },
};

/**
 * @typedef {Map<Declaration, ComputedValue>} MultiBindingMap
 */

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
    /** @type {MultiBinding} */
    this.classToggle = null;
    /** @type {MultiBindingMap} */
    this.event = null;
    /** @type {ComputedValue} */
    this.eachItems = null;
    /** @type {ComputedValue} */
    this.eachTemplate = null;
    /** @type {ComputedValue} */
    this.eachKey = null;
    /** @type {MultiBindingMap} */
    this.prop = null;
    /** @type {MultiBinding} */
    this.attr = null;
    /** @type {MultiBinding} */
    this.attrValue = null;
    /** @type {MultiBinding} */
    this.attrToggle = null;
    /** @type {MultiBindingMap} */
    this.data = null;
    /** @type {ComputedValue} */
    this.attachTemplate = null;
    /** @type {ComputedValue} */
    this.mount = null;

    /** @type {null | Map<string, ComputedValue>} */
    this.custom = null;
  }
  /**
   * Add a declaration for these bindings
   * @param {Declaration} declaration 
   * @param {any[]} values
   */
  add(declaration, values) {
    let desc = propertyDescriptors.get(declaration.propertyName);
    this.flags |= desc.flag;
    if(desc.keyed) {
      /** @type {Declaration | null} */
      let parent = declaration.multi ? declaration : null;
      for(let d of declaration.each()) {
        let dprop = d.propertyName;
        let ddesc = propertyDescriptors.get(dprop);
        let cname = ddesc.cname;
        if(!this[cname]) this[cname] = new MultiBinding(this, ddesc);
        /** @type {MultiBinding} */ (this[cname]).add(d, values, parent);
      }
    }
  }
  // /**
  //  * Add a declaration for these bindings
  //  * @param {Declaration} declaration 
  //  * @param {any[]} values
  //  */
  // _add(declaration, values) {
  //   let propertyName = declaration.propertyName;
  //   if(propertyName in properties) {
  //     let options = properties[propertyName];
  //     let { prop, flag, multiValue, multiBindings, read, long } = options;
  //     if(long) {
  //       for(let d of declaration.each()) {
  //         for(let i = 0; i < long.length; i++) {
  //           let { name, default: def } = long[i];
  //           let arg = d.args[i] || new AnyValue(def);
  //           this.add(new Declaration(d.rule, name, d.index, d.key, arg), values);
  //         }
  //       }
  //       return;
  //     }
  //     if(this[prop] === null) {
  //       this.flags |= flag;
        
  //       if(multiBindings) {
  //         this[prop] = new MultiBinding(this, options);
  //       } else {
  //         let compute = createCompute(this, declaration.args, read, multiValue, null, values);
  //         this[prop] = compute;
  //       }
  //     }
  //     // TODO maybe get rid of...
  //     if( multiBindings) {
  //       /** @type {MultiBinding} */
  //       (this[prop]).add(declaration, values);
  //       return;
  //       /** @type {ComputedValue} */
  //       let compute;
  //       if(this[prop].has(declaration))
  //         compute = this[prop].get(declaration);
  //       else {
  //         compute = createCompute(this, declaration, read, multiValue, values);
  //         this[prop].set(declaration, compute);
  //       }
  //       compute.addDeclaration(declaration);
  //     }
  //     else
  //       this[prop].addDeclaration(declaration);
  //   } else if(propertyName.startsWith('--')) { // Temporary, remove!
  //     if(this.custom === null) {
  //       this.flags |= flags.custom;
  //       this.custom = new Map();
  //     }
  //     if(!this.custom.has(propertyName)) {
  //       let compute = new ComputedValue(this.rootElement, this.element, null, false, null);
  //       this.custom.set(propertyName, compute);
  //     }
  //     this.custom.get(propertyName).addDeclaration(declaration);
  //   } else {
  //     throw new Error('Unknown property ' + propertyName);
  //   }
  // }
}