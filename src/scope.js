
/**
 * 
 * @param {string} dataPropName 
 * @param {string} dataSelector 
 * @param {string} propName 
 * @returns 
 */
export function lookup(element, dataPropName, dataSelector, propName) {
  /** @type {Element | null} */
  let el = element;
  do {
    if(el.hasAttribute(dataPropName)) {
      return /** @type {any} */(el)[Symbol.for(propName)];
    }
    el = element.closest(dataSelector);
  } while(el);
}