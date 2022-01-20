// @ts-check

/**
 * // Imports
 * @typedef {import('./compute').ComputedValue} ComputedValue
 * @typedef {import('./value').Value} Value
 * 
 * // Types
 * @typedef {(rootElement: Element, element: Element, key: ComputedValue, args: Value[], values: any[]) => any} ReadElementValue
 * 
 * @typedef {object} KeyedShorthand
 * @property {number} flag
 * @property {boolean} multi
 * @property {string[]} explode
 * 
 * @typedef {object} KeyedLonghand
 * @property {number} flag
 * @property {string} cname
 * @property {any} default
 * @property {boolean} [multi]
 * @property {ReadElementValue} read
 * 
 * @typedef {object} PropertyDescriptor
 * @property {string} name
 * @property {string} [cname]
 * @property {number} flag
 * @property {ReadElementValue} read
 * @property {'short' | 'long'} hand
 * @property {boolean} multi
 * @property {boolean} keyed
 * @property {string[]} [explode]
 * @property {any} [default]
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

/** @type {Map<string, PropertyDescriptor>} */
export const properties = new Map();

/**
 * 
 * @param {string} name 
 * @param {Omit<PropertyDescriptor, "name">} desc 
 */
function registerProperty(name, desc) {
  properties.set(name, Object.create(desc, { name: { value: name } }));
}

/**
 * 
 * @param {string} name 
 * @param {KeyedShorthand} desc 
 */
function registerKeyedShorthand(name, desc) {
  registerProperty(name, Object.create(desc, {
    hand: { value: 'short' },
    keyed: { value: true }
  }));
}

/**
 * 
 * @param {string} name 
 * @param {KeyedLonghand} desc 
 */
function registerKeyedLonghand(name, desc) {
  registerProperty(name, Object.create(desc, {
    hand: { value: 'long' },
    keyed: { value: true }
  }));
}

registerKeyedLonghand('attr-toggle', {
  cname: 'attrToggle',
  flag: flags.attr,
  default: true,
  read(_rootElement, element, key, _args, values) {
    return element.hasAttribute(key.compute(values));
  }
});

registerKeyedLonghand('attr-value', {
  cname: 'attrValue',
  flag: flags.attr,
  default: '',
  read(_rootElement, element, key, _args, values) {
    return element.getAttribute(key.compute(values));
  }
});

registerKeyedShorthand('attr', {
  flag: flags.attr,
  multi: true,
  explode: ['attr-value', 'attr-toggle']
});

registerKeyedLonghand('class-toggle', {
  cname: 'classToggle',
  flag: flags.classToggle,
  multi: true,
  default: '',
  read(_rootElement, element, key, _args, values) {
    return element.classList.contains(key.compute(values));
  }
});