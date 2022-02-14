// @ts-check

import { NO_VALUE } from './value.js';

/**
 * @typedef {import('./changeset').Changeset} Changeset
 * @typedef {import('./function').ICorsetFunctionClass} ICorsetFunctionClass
 * @typedef {import('./function').FunctionContext} FunctionContext
 */

/**
 * @typedef {Object} FunctionRegistry - Some explanation of what this is.
 * @property {Map<string, ICorsetFunctionClass>} fns
 */

const RegistryBase = {};

/**
 * @returns {FunctionRegistry}
 */
function createRegistry() {
  return Object.create(RegistryBase, {
    fns: {
      enumerable: true,
      value: new Map()
    }
  });
}

export const registry = createRegistry();
export const localsRegistry = createRegistry();

/**
 * 
 * @this {FunctionRegistry}
 * @param {string} name 
 * @param {ICorsetFunctionClass} ctr 
 */
function registerFunction(name, ctr) {
  this.fns.set(name, ctr);
}

/**
 * 
 * @this {FunctionRegistry | void}
 * @param {string} name 
 * @param {ICorsetFunctionClass} ctr 
 */
export function registerCustomFunction(name, ctr) {
  if(!name.startsWith('--')) {
    throw new Error(`Custom functions must start with --`);
  }
  let reg = this;
  if(!reg || !RegistryBase.isPrototypeOf(reg)) {
    reg = registry;
  }
  registerFunction.call(reg, name, ctr);
}

registerFunction.call(registry, 'get', class {
  /**
   * 
   * @typedef {((o: {}) => any) | string} CallbackOrProp
   * 
   * @param {[{[key: string]: any}, CallbackOrProp]} args 
   * @returns {any}
   */
  call([value, callbackOrProp]) {
    if(typeof callbackOrProp === 'function') {
      return callbackOrProp(value);
    } else {
      return value[callbackOrProp];
    }
  }
});

registerFunction.call(registry, 'select', class {
  /**
   * 
   * @param {[string]} param0 
   * @param {FunctionContext} ctx 
   */
  call([selector], { rootElement }) {
    return rootElement.querySelector(selector);
  }
});

class ScopeLookupFunction {
  /**
   * Look up a value within the DOM scope
   * @param {string} dataName
   * @param {string} propName
   */
   constructor(dataName, propName) {
    this.dataPropName = 'data-corset-' + dataName;
    this.dataSelector = '[' + this.dataPropName + ']';
    /** @type {string} */
    this.propName = propName;
    /** @type {any} */
    this.value = NO_VALUE;
  }
  /**
   * 
   * @param {any[]} param0 
   * @param {FunctionContext} param1
   * @param {Map<string, any>} _props
   * @param {Changeset} changeset
   * @returns {boolean}
   */
  check([], { element }, _props, changeset) {
    let check = false;
    if(changeset.selectors) check = true;
    if(check) {
      let value = this.#get(element);
      if(value !== this.value) {
        this.value = value;
        return true;
      }
    }
    return false;
  }
  /**
   * 
   * @returns {any}
   */
  call() {
    return this.value;
  }
  /**
   * 
   * @param {Element} element 
   * @returns 
   */
  #get(element) {
    /** @type {Element | null} */
    let el = element;
    do {
      if(el.hasAttribute(this.dataPropName)) {
        return /** @type {any} */(el)[Symbol.for(this.propName)];
      }
      el = element.closest(this.dataSelector);
    } while(el);
  }
}

registerFunction.call(registry, 'item', class extends ScopeLookupFunction {
  constructor() {
    super('item', 'corsetItem');
  }
});

registerFunction.call(registry, 'index', class extends ScopeLookupFunction {
  constructor() {
    super('index', 'corsetIndex');
  }
});

registerFunction.call(registry, 'bind', class {
  /**
   * 
   * @param {[Function, ...any[]]} param0
   * @param {FunctionContext} param1
   * @returns 
   */
  call([fn, ...args], { element }) {
    return fn.bind(element, ...args);
  }
});

registerFunction.call(registry, 'data', class {
  /**
   * 
   * @param {[string]} param0 
   * @param {FunctionContext} param1
   */
  call([prop], { element }) {
    if(!(element instanceof HTMLElement))
      throw new Error(`data() only works on HTMLElements.`);
    return /** @type {HTMLElement} */(element).dataset[prop];
  }
});

/**
 * 
 * @param {string} propName 
 * @returns {ICorsetFunctionClass}
 */
export function createLocalsScopeFunction(propName) {
  /** @type {ICorsetFunctionClass} */
  class ScopeLookupFunction {
    static inputProperties = [propName];
    /**
     * 
     * @param {any[]} args 
     * @param {FunctionContext} context 
     * @param {Map<typeof propName, any>} props
     */
    call(args, context, props) {
      /** @type {((...args: any[]) => any) | undefined} */
      let fn = props.get(propName);
      if(typeof fn !== 'function') {
        throw new Error(`Unable to find the custom function ${propName}`);
      }
      return fn.apply(context, args);
    }
  }

  registerCustomFunction.call(localsRegistry, propName, ScopeLookupFunction);
  return ScopeLookupFunction;
}