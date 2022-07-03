// @ts-check

const Constant = {
  /** @property {Map<string, Constant>} */
  map: undefined,

  /**
  * 
  * @param {string} value 
  * @returns {Constant}
  */

  for(value) {
    let map = /** @type {Map<string, Constant>} */(/** @type {unknown} */(this.map));
    return /** @type {Constant} */(map.get(value) ||
      (map.set(value, Object.create(this, {
        value: { value }
      })) && map.get(value)));
  },

  /**
   * @param {any} value
   * @returns {boolean}
   */
  is(value) {
    return this.isPrototypeOf(value);
  }
};

let createConstant = () => Object.create(Constant, {
  map: { value: new Map() }
});

/** @type {Constant} */
export const Name = createConstant();
/** @type {Constant} */
export const Keyword = createConstant();

export const KEYWORD_UNSET = Keyword.for('unset');