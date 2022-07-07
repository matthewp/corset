// @ts-check

/**
 * @typedef {{}} Constant
 * 
 * @typedef {((value: string) => Constant) & { map: Map<string, Constant>; for: (s: string) => Constant; base: Object; is: (value: any) => boolean; }} ConstantCreator
 */

const ConstantMethods = {
  /**
  * 
  * @param {string} value 
  * @returns {Constant}
  * @this {ConstantCreator}
  */
  for(value) {
    let map = /** @type {Map<string, Constant>} */(/** @type {unknown} */(this.map));
    return /** @type {Constant} */(map.get(value) ||
      (map.set(value, this(value))) && map.get(value));
  },

  /**
   * @param {any} value
   * @returns {boolean}
   * @this {ConstantCreator}
   */
  is(value) {
    return Object.prototype.isPrototypeOf.call(this.base, value);
  }
};

/**
 * 
 * @returns {ConstantCreator}
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
  return /** @type {ConstantCreator} */(/** @type {unknown} */(ConstantBase));
};

export const Name = createConstant();
export const Keyword = createConstant();

export const KEYWORD_REVERT_SHEET = Keyword('revert-sheet');
export const KEYWORD_ALL = Keyword('all');