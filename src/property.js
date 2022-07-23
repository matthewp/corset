// @ts-check

/**
 * @typedef {import('./pinfo').PropertyDefinition} PropertyDefinition
 * @typedef {import('./pinfo').SimplePropertyDefinition} SimplePropertyDefinition
 * @typedef {import('./pinfo').ShorthandPropertyDefinition} ShorthandPropertyDefinition
 * @typedef {import('./pinfo').LonghandPropertyDefinition} LonghandPropertyDefinition
 * @typedef {import('./pinfo').MultiPropertyDefinition} MultiPropertyDefinition
 * @typedef {import('./pinfo').BehaviorMultiPropertyDefinition} BehaviorMultiPropertyDefinition
 */

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

 export const features = {
  shorthand: 1 << 0,
  longhand: 1 << 1,
  keyed: 1 << 2, // Legacy, needed for sure reason
  multi: 1 << 3,
  oldValues: 1 << 4,
  behavior: 1 << 5,
  labeled: 1 << 6
};

/** @type {Record<string, PropertyDefinition>} */
export const properties = {
  /** @type {SimplePropertyDefinition} */
  'attach-template': {
    flag: flags.attach,
    feat: 0,
    prop: 'attachTemplate',
    read(el) {
      let doc = el.ownerDocument || document;
      let tmpl = doc.createElement('template');
      tmpl.content.append(...Array.from(el.childNodes));
      return tmpl;
    }
  },
  /** @type {ShorthandPropertyDefinition} */
  attr: {
    flag: flags.attr,
    feat: features.multi | features.shorthand | features.keyed,
    prop: 'attr',
    longhand: ['attr-value', 'attr-toggle'],
    defaults: ['', true]
  },
  /** @type {LonghandPropertyDefinition} */
  'attr-value': {
    flag: flags.attr,
    feat: features.longhand,
    shorthand: 'attr',
    index: 0,
    default: '',
    read(el, key) {
      return ('getAttribute' in el) && el.getAttribute(key);
    }
  },
  /** @type {LonghandPropertyDefinition} */
  'attr-toggle': {
    flag: flags.attr,
    feat: features.longhand,
    shorthand: 'attr',
    index: 1,
    default: true,
    read(el, key) {
      return ('hasAttribute' in el) && el.hasAttribute(key);
    }
  },
  /** @type {MultiPropertyDefinition} */
  'class-toggle': {
    flag: flags.classToggle,
    feat: features.multi | features.keyed,
    prop: 'classToggle',
    read(el, key) {
      return ('classList' in el) && el.classList.contains(key);
    }
  },
  /** @type {MultiPropertyDefinition} */
  data: {
    flag: flags.data,
    feat: features.multi | features.keyed,
    prop: 'data',
    read(el, key) {
      if(!('dataset' in el))
        throw new Error(`data can only be used on HTMLElements`);
      return /** @type {HTMLElement} */(el).dataset[key];
    }
  },
  /** @type {ShorthandPropertyDefinition} */
  each: {
    flag: flags.each,
    feat: features.shorthand,
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
  /** @type {ShorthandPropertyDefinition} */
  event: {
    flag: flags.event,
    feat: features.multi | features.keyed | features.oldValues | features.shorthand | features.labeled,
    prop: 'event',
    longhand: ['event-type', 'event-listener', 'event-capture', 'event-once',
      'event-passive', 'event-signal'],
    defaults: [null, false, false, false, undefined]
  },
  'event-type': {
    flag: flags.event,
    feat: features.keyed | features.longhand | features.labeled,
    shorthand: 'event',
    index: 0,
    default: null,
    read: () => null
  },
  'event-listener': {
    flag: flags.event,
    feat: features.longhand | features.labeled,
    shorthand: 'event',
    index: 1,
    default: null,
    read: () => null
  },
  'event-capture': {
    flag: flags.event,
    feat: features.longhand | features.labeled,
    shorthand: 'event',
    index: 2,
    default: false,
    read: () => false
  },
  'event-once': {
    flag: flags.event,
    feat: features.longhand | features.labeled,
    shorthand: 'event',
    index: 3,
    default: false,
    read: () => false
  },
  'event-passive': {
    flag: flags.event,
    feat: features.longhand | features.labeled,
    shorthand: 'event',
    index: 4,
    default: false,
    read: () => false
  },
  'event-signal': {
    flag: flags.event,
    feat: features.longhand | features.labeled,
    shorthand: 'event',
    index: 5,
    default: undefined,
    read: () => undefined
  },
  /** @type {BehaviorMultiPropertyDefinition} */
  behavior: {
    flag: flags.behavior,
    feat: features.multi | features.behavior | features.oldValues,
    prop: 'behavior'
  },
  /** @type {MultiPropertyDefinition} */
  prop: {
    flag: flags.prop,
    feat: features.multi | features.keyed,
    prop: 'prop',
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