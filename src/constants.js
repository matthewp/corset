// @ts-check

/**
 * @typedef {{}} MappedValue
 * 
 * @typedef {((value: string) => MappedValue) & { map: Map<string, MappedValue>; for: (s: string) => MappedValue; base: Object; is: (value: any) => boolean; }} Constant
 */

const ConstantMethods = {
  /**
  * 
  * @param {string} value 
  * @returns {MappedValue}
  * @this {Constant}
  */
  for(value) {
    let map = /** @type {Map<string, MappedValue>} */(/** @type {unknown} */(this.map));
    return /** @type {MappedValue} */(map.get(value) ||
      (map.set(value, this(value))) && map.get(value));
  },

  /**
   * @param {any} value
   * @returns {boolean}
   * @this {Constant}
   */
  is(value) {
    return Object.prototype.isPrototypeOf.call(this.base, value);
  }
};

/**
 * 
 * @returns {Constant}
 */
let createConstant = () => {
  /**
   * @param {string} value
   */
  function ConstantBase(value) {
    return Object.create(ConstantBase.base, {
      name: { enumerable: false, writable: false, configurable: false, value }
    });
  }
  ConstantBase.base = Object.create(null);
  ConstantBase.map = new Map();
  Object.assign(ConstantBase, ConstantMethods);
  return /** @type {Constant} */(/** @type {unknown} */(ConstantBase));
};

export const Name = createConstant();
export const Keyword = createConstant();

export const KEYWORD_UNSET = Keyword('unset');
export const KEYWORD_ALL = Keyword('all');