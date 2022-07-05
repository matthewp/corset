// @ts-check

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
  behavior: 1 << 9,
  storeRoot: 1 << 10,
  storeSet: 1 << 11
};

/**
 * @typedef {import('./pinfo').PropertyDefinition} PropertyDefinition
 * @typedef {import('./pinfo').SimplePropertyDefinition} SimplePropertyDefinition
 * @typedef {import('./pinfo').ShorthandPropertyDefinition} ShorthandPropertyDefinition
 * @typedef {import('./pinfo').LonghandPropertyDefinition} LonghandPropertyDefinition
 * @typedef {import('./pinfo').MultiPropertyDefinition} MultiPropertyDefinition
 * @typedef {import('./pinfo').KeyedMultiPropertyDefinition} KeyedMultiPropertyDefinition
 * @typedef {import('./pinfo').BehaviorMultiPropertyDefinition} BehaviorMultiPropertyDefinition
 */

 export const features = {
  shorthand: 1 << 0,
  longhand: 1 << 1,
  keyed: 1 << 2,
  multi: 1 << 3,
  oldValues: 1 << 4,
  behavior: 1 << 5
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
    feat: features.multi,
    prop: 'attr',
    keyed: true,
    multi: true,
    longhand: ['attr-value', 'attr-toggle'],
    defaults: ['', true]
  },
  /** @type {LonghandPropertyDefinition} */
  'attr-value': {
    flag: flags.attr,
    feat: features.longhand,
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
    feat: features.longhand,
    shorthand: 'attr',
    index: 1,
    keyed: true,
    default: true,
    read(el, key) {
      return el.hasAttribute(key);
    }
  },
  /** @type {MultiPropertyDefinition} */
  'class-toggle': {
    flag: flags.classToggle,
    feat: features.multi,
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
    defaults: [[], {}, null],
    labeled: true,
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
  /** @type {ShorthandPropertyDefinition} */
  event: {
    flag: flags.event,
    feat: features.multi | features.keyed | features.oldValues,
    prop: 'event',
    multi: true,
    keyed: true,
    labeled: true,
    oldValues: true,
    longhand: ['event-type', 'event-listener', 'event-capture', 'event-once',
      'event-passive', 'event-signal'],
    defaults: ['', null, false, false, false, undefined]
  },
  'event-type': {
    flag: flags.event,
    feat: features.keyed | features.longhand,
    shorthand: 'event',
    index: 0,
    keyed: true,
    labeled: true,
    default: null,
    read: () => null
  },
  'event-listener': {
    flag: flags.event,
    feat: features.longhand,
    shorthand: 'event',
    index: 1,
    keyed: true,
    labeled: true,
    default: null,
    read: () => null
  },
  'event-capture': {
    flag: flags.event,
    feat: features.longhand,
    shorthand: 'event',
    index: 2,
    keyed: true,
    labeled: true,
    default: false,
    read: () => false
  },
  'event-once': {
    flag: flags.event,
    feat: features.longhand,
    shorthand: 'event',
    index: 3,
    keyed: true,
    labeled: true,
    default: false,
    read: () => false
  },
  'event-passive': {
    flag: flags.event,
    feat: features.longhand,
    shorthand: 'event',
    index: 4,
    keyed: true,
    labeled: true,
    default: false,
    read: () => false
  },
  'event-signal': {
    flag: flags.event,
    feat: features.longhand,
    shorthand: 'event',
    index: 5,
    keyed: true,
    labeled: true,
    default: undefined,
    read: () => undefined
  },
  /** @type {BehaviorMultiPropertyDefinition} */
  behavior: {
    flag: flags.behavior,
    feat: features.multi | features.behavior,
    prop: 'behavior',
    multi: true,
    keyed: false, // TODO get rid of
    oldValues: true,
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
   /** @type {SimplePropertyDefinition} */
  'store-root': {
    flag: flags.storeRoot,
    feat: 0,
    prop: 'storeRoot',
    read: () => null
  },
  /** @type {SimplePropertyDefinition} */
  'store-set': {
    flag: flags.storeSet,
    feat: 0,
    prop: 'storeSet',
    read: () => null
  }
};