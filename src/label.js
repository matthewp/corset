// @ts-check

/** @type {Map<string, Label>} */
const map = new Map();

export const Label = {
  /**
  * 
  * @param {string} value 
  * @returns {Label}
  */

  for(value) {
    return /** @type {Label} */(map.get(value) ||
    (map.set(value, Object.create(this, {
      value: { value }
    })) && map.get(value)));
  },

  /**
   * @param {any} value
   * @returns {boolean}
   */
  isLabel(value) {
    return Label.isPrototypeOf(value);
  }
};