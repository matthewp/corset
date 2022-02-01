import { anyValue, PlaceholderValue } from './value.js';

/**
 * @typedef {import('./value').ValueType} ValueType
 */

/**
 * 
 * @typedef {Object} ValueTemplate
 * @property {ValueType} Value
 * @property {ValueTemplate[]} deps
 * @property {Map<string, ValueTemplate> | null} [inputProperties]
 */

/**
 * 
 * @param {ValueType} Value 
 * @param {ValueTemplate[]} deps
 * @returns {ValueTemplate}
 */
export function createValueTemplate(Value, deps = []) {
  let template = {
    Value,
    deps,
    inputProperties: null
  };

  if(Value.inputProperties) {
    /** @type {Map<string, ValueTemplate>} */
    let map = new Map();
    for(let propName of Value.inputProperties) {
      map.set(propName, createValueTemplate(PlaceholderValue, [
        createValueTemplate(anyValue(propName))
      ]));
    }
    template.inputProperties = map;
  }

  return template
}