
/**
 * 
 * @param {string | null} dataPropName 
 * @param {string} dataSelector 
 * @param {string} propName 
 * @returns 
 */
export function lookup(element, dataSelector, propName) {
  /** @type {Element | null} */
  let el = element;
  do {
    if(el.matches(dataSelector)) {
      return /** @type {any} */(el)[Symbol.for(propName)];
    }
    el = element.closest(dataSelector);
  } while(el);
}



/**
 * 
 * @param {HTMLElement} element
 * @param {symbol} listSym
 * @param {string} key
 * @param {symbol} keySym
 * @param {string} dataProp
 * @param {any} value
 */
 export function addItemToScope(element, listSym, key, keySym, dataProp, value) {
  let e = /** @type {any} */(element);
  /** @type {Set<string>} */

  let list = e[listSym];
  if(!list) {
    list = e[listSym] = new Set();
  }
  list.add(key);
  let str = Array.from(list).join(' ');
  element.dataset[dataProp] = str;

  e[keySym] = value;
}

/**
 * 
 * @param {HTMLElement} element 
 * @param {symbol} listSym
 * @param {string} key
 * @param {symbol} keySym
 * @param {string} dataProp
 */
export function removeItemFromScope(element, listSym, key, keySym, dataProp) {
  let e = /** @type {any} */(element);
  /** @type {Set<string> | undefined} */
  let list = e[listSym];
  if(list) {
    list.delete(key);
    delete e[keySym];
    if(list.size) {
      let str = Array.from(list).join(' ');
      element.dataset[dataProp] = str;
    } else {
      delete e[keySym];
      delete element.dataset[dataProp];
    }
  }
}