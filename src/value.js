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
class ScopeLookupValue {
  /**
   * Look up a value within the DOM scope
   * @param {string} dataName
   * @param {string} propName
   */
  constructor(dataName, propName) {
    this.dataPropName = 'data-corset-' + dataName;
    this.dataSelector = '[' + this.dataPropName + ']';
    /** @type {string} */
    this.propName = propName;
  }
  /**
   * @param {Element} _rootElement
   * @param {Element} element
   * @param {any[]} _values
   */
  get(_rootElement, element, _values) {
    let el = element;
    do {
      if(el.hasAttribute(this.dataPropName)) {
        return el[Symbol.for(this.propName)];
      }
      el = element.closest(this.dataSelector);
    } while(el);
  }
}

/** @implements {Value} */
export class VarValue extends ScopeLookupValue {
  /**
   *
   * @param {any} propValue
   * @param {Value} [fallbackValue]
   */
  constructor(propValue, fallbackValue) {
    let propName = propValue.get();
    super('prop-' + propName.substr(2), propName);
    /** @type {Value | null} */
    this.fallbackValue = fallbackValue || null;
  }

  /**
   * @param {Element} rootElement
   * @param {Element} element
   * @param {any[]} values
   */
  get(rootElement, element, values) {
    let ret = super.get(rootElement, element, values);
    if(ret !== undefined) return ret;
    
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
      objValue = new ItemValue();
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

/** @implements {Value} */
export class BindValue {
  constructor(fnValue, ...args) {
    this.fnValue = fnValue;
    this.args = args;
  }
  /**
   * @param {Element} rootElement
   * @param {Element} element
   * @param {any[]} values
   */
  get(rootElement, element, values) {
    let fn = this.fnValue.get(rootElement, element, values);
    let args = this.args.map(arg => arg.get(rootElement, element, values));
    return fn.bind(element, ...args);
  }
}

export class ItemValue extends ScopeLookupValue {
  constructor() {
    super('item', 'corsetItem');
  }
}

export class IndexValue extends ScopeLookupValue {
  constructor() {
    super('index', 'corsetIndex');
  }
}

/** @implements {Value} */
export class DataValue {
  constructor(propValue) {
    /** @type {Value} */
    this.propValue = propValue;
  }
  /**
   * @param {Element} rootElement
   * @param {Element} element
   * @param {any[]} values
   */
  get(rootElement, element, values) {
    let prop = this.propValue.get(rootElement, element, values);
    if(!('dataset' in element)) {
      throw new Error('The data() function can only be used on HTMLElements.');
    }
    return /** @type {HTMLElement} */(element).dataset[prop];
  }
}

/** @implements {Value} */
export class CustomFunctionValue {
  constructor(varValue, ...args) {
    /** @type {Value} */
    this.varValue = varValue;
    /** @type {Value[]} */
    this.args = args;
  }
  /**
   * @param {Element} rootElement
   * @param {Element} element
   * @param {any[]} values
   */
  get(rootElement, element, values) {
    let fn = this.varValue.get(rootElement, element, values);
    let args = this.args.map(arg => arg.get(rootElement, element, values));
    return fn(...args);
  }
}