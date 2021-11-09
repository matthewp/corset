// @ts-check

/** @typedef {import('./value').Value} Value */

/**
 * @typedef {Object} Property
 * @property {string} name
 * @property {Boolean} invalidates
 * @property {(element: Element, args: Value[]) => any} read
 * @property {(element: Element, value: any, args: Value[]) => void} set
 * @property {(element: Element, values: any[], args: Value[]) => any} getValue
 */

/** @type {Property} */
export const TextProperty = {
  name: 'text',
  invalidates: false,
  read(element) {
    return element.textContent;
  },
  getValue(element, values, args) {
    return args[0].get(element, values);
  },
  set(element, text, _args) {
    element.textContent = text;
  }
};

/** @type {Property} */
export const ClassToggleProperty = {
  name: 'class-toggle',
  invalidates: true,
  read() {
    return false;
  },
  getValue(element, values, args) {
    return args[1].get(element, values);
  },
  set(element, cond, args) {
    let className = args[0].get();
    element.classList[cond ? 'add' : 'remove'](className);
  }
};

/** @type {Property} */
export const EventProperty = {
  name: 'event',
  invalidates: false,
  read(element, args) {
    return element['on' + args[0]] || null;
  },
  getValue(element, values, args) {
    return args[1].get(element, values);
  },
  set(element, callback, args) {
    let eventName = args[0].get();
    element.addEventListener(eventName, callback);
  }
};

/** @type {Property} */
export const CustomProperty = {
  name: 'custom-property',
  invalidates: false,
  read() {
    return null;
  },
  getValue(element, values, args) {
    return args[1].get(element, values);
  },
  set(element, value, args) {
    let varName = args[0].get();
    let name = varName.replace(/-?-([a-zA-Z])/, (_whole, letter) => {
      return letter.toUpperCase();
    });
    if(!(element instanceof HTMLElement)) {
      throw new Error('Custom properties cannot be used on non-HTML elements.');
    }
    element.dataset['dslProp' + name] = '';
    element[Symbol.for(varName)] = value;
  }
}