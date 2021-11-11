// @ts-check

/**
 * @typedef {import('./types').Value} Value
 */

/** @implements {Value} */
export class AnyValue {
  /**
   * @param {any} value 
   */
  constructor(value) {
    this.value = value;
  }
  get() {
    return this.value;
  }
}

/** @implements {Value} */
export class InsertionValue {
  constructor(index) {
    this.index = index;
  }

  get(_, __, values) {
    return values[this.index];
  }
}

/** @implements {Value} */
export class VarValue {
  constructor(propValue, fallbackValue) {
    this.propName = propValue.get();
    this.dataPropName = 'data-dsl-prop-' + this.propName.substr(2);
    this.dataSelector = '[' + this.dataPropName + ']';
    /** @type {Value} */
    this.fallbackValue = fallbackValue || null;
  }
  /**
   * @param {Element} rootElement
   * @param {Element} element
   * @param {any[]} values
   */
  get(rootElement, element, values) {
    let el = element;
    do {
      if(el.hasAttribute(this.dataPropName)) {
        return el[Symbol.for(this.propName)];
      }
      el = element.closest(this.dataSelector);
    } while(el);
    
    if(this.fallbackValue !== null) {
      return this.fallbackValue.get(rootElement, element, values);
    }
  }
}

/** @implements {Value} */
export class GetValue {
  constructor(objValue, propValue) {
    if(!propValue) {
      propValue = objValue;
      objValue = new VarValue(new AnyValue('--scope'));
    }
    /** @type {Value} */
    this.objValue = objValue;
    /** @type {Value} */
    this.propValue = propValue;
  }
  /**
   * @param {Element} rootElement
   * @param {Element} element 
   * @param {any[]} values
   */
  get(rootElement, element, values) {
    let obj = this.objValue.get(rootElement, element, values);
    let prop = this.propValue.get(rootElement, element, values);
    if(typeof prop === 'function') {
      return prop(obj);
    } else {
      return obj[prop];
    }
  }
}

/** @implements {Value} */
export class SelectValue {
  constructor(selectorValue) {
    this.selector = selectorValue.get();
  }
  /**
   * @param {Element} rootElement
   */
  get(rootElement) {
    return rootElement.querySelector(this.selector);
  }
}