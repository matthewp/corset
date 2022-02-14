// @ts-check
import { anyValue } from './value.js';
import { createValueTemplate } from './template.js';

export const flags = {
  text: 1 << 0,
  classToggle: 1 << 1,
  event: 1 << 2,
  custom: 1 << 3,
  each: 1 << 4,
  prop: 1 << 5,
  attr: 1 << 6,
  data: 1 << 7,
  attach: 1 << 8,
  mount: 1 << 9,
};

/**
 * @typedef {import('./property').PropertyDefinition} PropertyDefinition
 * @typedef {import('./property').SimplePropertyDefinition} SimplePropertyDefinition
 * @typedef {import('./property').ShorthandPropertyDefinition} ShorthandPropertyDefinition
 * @typedef {import('./property').LonghandPropertyDefinition} LonghandPropertyDefinition
 * @typedef {import('./property').KeyedMultiPropertyDefinition} KeyedMultiPropertyDefinition
 */

 export const features = {
  shorthand: 1 << 0,
  longhand: 1 << 1,
  keyed: 1 << 2,
  multi: 1 << 3,
  oldValues: 1 << 4
};

/** @type {Record<string, PropertyDefinition>} */
export const properties = {
  /** @type {SimplePropertyDefinition} */
  'attach-template': {
    flag: flags.attach,
    feat: 0,
    prop: 'attachTemplate',
    read(el) {
      let tmpl = el.ownerDocument.createElement('template');
      tmpl.content.append(...Array.from(el.childNodes));
      return tmpl;
    }
  },
  /** @type {ShorthandPropertyDefinition} */
  attr: {
    flag: flags.attr,
    feat: features.multi | features.keyed,
    prop: 'attr',
    keyed: true,
    multi: true,
    longhand: ['attr-value', 'attr-toggle'],
    defaults: ['', true]
  },
  /** @type {LonghandPropertyDefinition} */
  'attr-value': {
    flag: flags.attr,
    feat: features.keyed | features.longhand,
    shorthand: 'attr',
    index: 0,
    keyed: true,
    default: '',
    read(el, key) {
      return el.getAttribute(key);
    }
  },
  /** @type {LonghandPropertyDefinition} */
  'attr-toggle': {
    flag: flags.attr,
    feat: features.keyed | features.longhand,
    shorthand: 'attr',
    index: 1,
    keyed: true,
    default: true,
    read(el, key) {
      return el.hasAttribute(key);
    }
  },
  /** @type {KeyedMultiPropertyDefinition} */
  'class-toggle': {
    flag: flags.classToggle,
    feat: features.multi | features.keyed,
    multi: true,
    keyed: true,
    prop: 'classToggle',
    read(el, key) {
      return el.classList.contains(key);
    }
  },
  /** @type {KeyedMultiPropertyDefinition} */
  data: {
    flag: flags.data,
    feat: features.multi | features.keyed,
    prop: 'data',
    multi: true,
    keyed: true,
    read(el, key) {
      if(!('dataset' in el))
        throw new Error(`data can only be used on HTMLElements`);
      return /** @type {HTMLElement} */(el).dataset[key];
    }
  },
  /** @type {ShorthandPropertyDefinition} */
  each: {
    flag: flags.each,
    feat: 0,
    prop: 'each',
    longhand: ['each-items', 'each-template', 'each-key'],
    defaults: [[], {}, null]
  },
  'each-items': {
    flag: flags.each,
    feat: features.longhand,
    shorthand: 'each',
    index: 0,
    default: [],
    read: () => null,
  },
  'each-template': {
    flag: flags.each,
    feat: features.longhand,
    shorthand: 'each',
    index: 1,
    default: {},
    read: () => null
  },
  'each-key': {
    flag: flags.each,
    feat: features.longhand,
    shorthand: 'each',
    index: 2,
    default: null,
    read: () => null
  },
  /** @type {KeyedMultiPropertyDefinition} */
  event: {
    flag: flags.event,
    feat: features.multi | features.keyed | features.oldValues,
    prop: 'event',
    multi: true,
    keyed: true,
    oldValues: true,
    read: () => null
  },
  /** @type {SimplePropertyDefinition} */
  mount: {
    flag: flags.mount,
    feat: 0,
    prop: 'mount',
    read: () => null
  },
  /** @type {KeyedMultiPropertyDefinition} */
  prop: {
    flag: flags.prop,
    feat: features.multi | features.keyed,
    prop: 'prop',
    multi: true,
    keyed: true,
    read(el, key) {
      return /** @type {any} */(el)[key];
    }
  },
  /** @type {SimplePropertyDefinition} */
  text: {
    flag: flags.text,
    feat: 0,
    prop: 'text',
    read(el) {
      return el.textContent;
    }
  },
};