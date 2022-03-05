// @ts-check
import { lookup } from './scope.js';

/**
 * @typedef {import('./binding').Binding} Binding
 * @typedef {import('./changeset').Changeset} Changeset
 * @typedef {import('./compute').ComputedValue} ComputedValue
 * @typedef {import('./types').Value} Value
 * @typedef {import('./types').ValueType} ValueType
 * @typedef {import('./function').ICorsetFunctionClass} ICorsetFunctionClass
 * @typedef {import('./function').ICorsetFunction} ICorsetFunction
 */

export const NO_VALUE = Symbol('corset.noValue');

/**
 * 
 * @param {any} value 
 * @returns {ValueType}
 */
 export const anyValue = value => 
 /** @implements {Value} */
 class AnyValue{get(){ return value }};

/** @implements {Value} */
export class InsertionValue {
  constructor() {
    /** @type {number} */
    this.current = 0;
    /** @type {any} */
    this.value = NO_VALUE;
  }
  /**
   * 
   * @param {[number]} args 
   * @param {Binding} _binding 
   * @param {Map<string, any>} _props
   * @param {Changeset} changeset 
   * @returns {boolean}
   */
  check([index], _binding, _props, {values}) {
    let value = values[index];
    if(this.value !== value) {
      this.value = value;
      return true;
    }
    return false;
  }
  get() {
    return this.value;
  }
}

/** @implements {Value} */
export class SpaceSeparatedListValue {
  /**
   * 
   * @param {any[]} values 
   * @returns 
   */
  get(values = []) {
    return values;
  }
}

export class CommaSeparatedListValue extends SpaceSeparatedListValue {}

/** @implements {Value} */
export class PlaceholderValue {
  constructor() {
    this.current = 0;
    /** @type {NO_VALUE | ComputedValue} */
    this.compute = NO_VALUE;
    /** @type {any} */
    this.value = null;
  }
  /**
   * 
   * @param {[string, any]} args 
   * @param {Binding} binding 
   * @param {Map<string, any>} _props
   * @param {Changeset} changeset 
   * @returns {boolean}
   */
  check(args, binding, _props, changeset) {
    let check = false;
    if(changeset.selectors) check = true;
    else if(this.compute === NO_VALUE) check = true;
    else {
      this.compute.dirty(changeset);
      let value = this.compute.check(changeset);
      if(value !== this.value) {
        this.value = value;
        return true;
      }
      return false;
    }
    if(check) {
      let scope = this.#get(args, binding);
      if(scope) {
        if(scope.value !== this.value || scope.compute !== this.compute) {
          this.compute = scope.compute;
          this.value = scope.value;
          return true;
        } else {
          // Nothing has changed.
          return false;
        }
      } else if(args.length > 1) {
        let value = args[1];
        if(!this.value || value !== this.value[0]) {
          this.value = [value];
          return true;
        }
        return false;
      }
    }
    return false;
  }
  /**
   * 
   * @param {[string, any]} args 
   * @param {Binding} param1 
   * @returns 
   */
  #get(args, { element }) {
    let [propName] = args;
    let dataName = 'prop-' + propName.substr(2);
    let dataPropName = 'data-corset-' + dataName;
    let dataSelector = '[' + dataPropName + ']';
    return lookup(element, dataPropName, dataSelector, propName);
  }
  get() {
    return this.value;
  }
}

/**
 * 
 * @param {ICorsetFunctionClass} CorsetFunction 
 * @returns {ValueType}
 */
export const functionValue = (CorsetFunction) => {
  /** @type {ICorsetFunction | undefined} */
  let prototype = CorsetFunction.prototype;
  if(typeof prototype !== 'object') throw new Error(`Functions must contain a prototype`);
  /** @type {ICorsetFunction['call']} */
  let callValue = prototype.call;

  class FunctionValue {
    static inputProperties = CorsetFunction.inputProperties;

    constructor() {
      /** @type {ICorsetFunction} */
      this.fn = new CorsetFunction();
    }
    /**
     * 
     * @param {any[]} args 
     * @param {Binding} binding 
     * @param {Map<string, any> | null} props
     * @returns {any}
     */
    get(args, binding, props) {
      return callValue.call(this.fn, args, props, binding);
    }
  }

  if(prototype.check) {
    let checkValue = prototype.check;
    /**
     * 
     * @param {any[]} args 
     * @param {Binding} binding 
     * @param {Map<string, any> | null} props
     * @param {Changeset} changeset
     */
    FunctionValue.prototype.check = function(args, binding, props, changeset) {
      return checkValue.call(this.fn, args, props, binding, changeset);
    };
  }

  return FunctionValue;
}