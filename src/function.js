// @ts-check

import { anyValue, NO_VALUE } from './value.js';
import { createValueTemplate } from './template.js';
import { ComputedValue } from './compute.js';
import { registry as behaviorRegistry } from './mount.js';
import { lookup } from './scope.js';
import { storeDataSelector, storePropName, getKeySymbol } from './store.js';

/**
 * @typedef {import('./binding').Binding} Binding
 * @typedef {import('./changeset').Changeset} Changeset
 * @typedef {import('./fn').ICorsetFunction} ICorsetFunction
 * @typedef {import('./fn').ICorsetFunctionClass} ICorsetFunctionClass
 * @typedef {import('./fn').FunctionContext} FunctionContext
 * @typedef {import('./types').MountedBehaviorType} MountedBehaviorType
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
  constructor() {
    this.value = NO_VALUE;
  }
  /**
   *
   * @param {[{[key: string | symbol]: any}, CallbackOrProp]} args
   * @returns
   */
  check([value, callbackOrProp]) {
    if(typeof value === 'object') {
      if(typeof callbackOrProp !== 'function') {
        let newValue = getKeySymbol in value ?
          value[getKeySymbol](callbackOrProp) :
          value[callbackOrProp];
        if(newValue !== this.value) {
          this.value = newValue;
          return true;
        }
      }
    }
    return false;
  }
  /**
   * 
   * @typedef {((o: {}) => any) | string} CallbackOrProp
   * 
   * @param {[{[key: string | symbol]: any}, CallbackOrProp]} args
   * @returns {any}
   */
  call([value, callbackOrProp]) {
    if(typeof callbackOrProp === 'function') {
      return callbackOrProp(value);
    } else if(getKeySymbol in value) {
      return value[getKeySymbol](callbackOrProp);
    } else {
      return value[callbackOrProp];
    }
  }
});

registerFunction.call(registry, 'select', class {
  /**
   * 
   * @param {[string]} param0
   * @param {Map<string, any>} _props
   * @param {FunctionContext} ctx 
   */
  call([selector], _props, { rootElement }) {
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
    /** @type {string} */
    this.dataSelector = `[data-corset-scope~=${dataName}]`;
    /** @type {string} */
    this.propName = propName;
    /** @type {any} */
    this.value = NO_VALUE;
  }
  /**
   * 
   * @param {any[]} param0
   * @param {Map<string, any>} _props
   * @param {FunctionContext} param1
   * @param {Changeset} changeset
   * @returns {boolean}
   */
  check([], _props, { element }, changeset) {
    let check = false;
    if(changeset.selectors) check = true;
    if(check) {
      let value = lookup(element, this.dataSelector, this.propName);
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
}

registerFunction.call(registry, 'item', class extends ScopeLookupFunction {
  constructor() {
    super('item', 'corset.item');
  }
});

registerFunction.call(registry, 'index', class extends ScopeLookupFunction {
  constructor() {
    super('index', 'corset.index');
  }
});

registerFunction.call(registry, 'store-get', class {
  constructor() {
    /** @type {any} */
    this.value = undefined;
  }
  /**
   * 
   * @param {[string, string]} _args
   * @param {Map<string, any>} _props
   * @param {FunctionContext} param1
   * @param {Changeset} changeset
   * @returns {boolean}
   */
  check([storeName, key], _props, { element }, changeset) {
    let check = changeset.selectors;
    if(check) {
      /** @type {Map<string, any> | undefined} */
      let map = lookup(element, storeDataSelector(storeName), storePropName(storeName));
      if(map?.get(key) !== this.value) {
        this.value = map?.get(key);
        return true;
      }
    }
    return false;
  }
  call() {
    return this.value;
  }
});

registerFunction.call(registry, 'store', class {
  constructor() {
    /** @type {Map<any, any> | undefined} */
    this.map = undefined;
  }
  /**
   * 
   * @param {[string]} _args
   * @param {Map<string, any>} _props
   * @param {FunctionContext} param1
   * @param {Changeset} changeset
   * @returns {boolean}
   */
   check([storeName], _props, { element }, changeset) {
    let check = changeset.selectors;
    if(check) {
      /** @type {Map<any, any> | undefined} */
      let map = lookup(element, storeDataSelector(storeName), storePropName(storeName));
      if(map !== this.map) {
        this.map = map;
        return true;
      }
    }
    return false;
  }
  /**
   * @returns {Map<any, any> | undefined}
   */
  call() {
    return this.map;
  }
});

registerFunction.call(registry, 'bind', class {
  /**
   * 
   * @param {[Function, ...any[]]} param0
   * @returns 
   */
  call([fn, ...boundArgs]) {
    /**
     * @this {MountedBehaviorType | Element}
     * @param {...any[]} callArgs
     * @returns {(...args: any[]) => any}
     */
    function boundFn(...callArgs) {
      return fn.call(this, ...boundArgs, ...callArgs);
    }
    Object.defineProperty(boundFn, 'name', {
      value: 'bound ' + fn.name
    });
    return boundFn;
  }
});

registerFunction.call(registry, 'data', class {
  /**
   * 
   * @param {[string]} param0 
   * @param {Map<string, any>} _props
   * @param {FunctionContext} param1
   */
  call([prop], _props, { element }) {
    if(!(element instanceof HTMLElement))
      throw new Error(`data() only works on HTMLElements.`);
    return /** @type {HTMLElement} */(element).dataset[prop];
  }
});

/**
 * @typedef {Readonly<[MountedBehaviorType, Map<string, any> | null]>} MountValue
 */

registerFunction.call(registry, 'mount', class {
  constructor() {
    /** @type {ComputedValue | null} */
    this.compute = null;
    /** @type {MountedBehaviorType | null} */
    this.Behavior = null;
    /** @type {MountValue | null} */
    this.value = null;
  }
  /**
   *
   * @param {[MountedBehaviorType | string]} param0
   * @param {Map<string, any>} _props
   * @param {FunctionContext} context
   * @param {Changeset} changeset
   * @returns {boolean}
   */
  check([Ctr], _props, context, changeset) {
    /** @type {MountedBehaviorType} */
    let Behavior = /** @type {MountedBehaviorType} */(Ctr);
    if(typeof Ctr === 'string') {
      let name = Ctr;
      if(!behaviorRegistry.has(name))
        throw new Error(`Unregistered behavior ${name}`);
      Behavior = /** @type {MountedBehaviorType} */(behaviorRegistry.get(name));
    }

    if(Behavior !== this.Behavior) {
      let ValueType = anyValue(Behavior);
      ValueType.inputProperties = Behavior.inputProperties;
      let template = createValueTemplate(ValueType);
      this.Behavior = Behavior;
      this.compute = new ComputedValue(
        template,
        // A FunctionContext's prototype is actually a Binding at runtime.
        // If this ever changes, the following will be a wrong cast.
        /** @type {Binding} */(Object.getPrototypeOf(context))
      );
      this.compute.check(changeset);
      this.value = /** @type {MountValue} */
        (Object.freeze([Behavior, this.compute.inputProps]));
      return true;
    } else if(this.compute) {
      let dirty = this.compute.dirty(changeset);
      this.compute.check(changeset);
      return dirty;
    }
    return false;
  }
  /**
   *
   * @param {[]} param0
   */
  call([]) {
    return this.value;
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
     * @param {Map<typeof propName, any>} props
     * @param {FunctionContext} context 
     */
    call(args, props, context) {
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