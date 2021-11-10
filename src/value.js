// @ts-check

/** @typedef {import('./binding').Binding} Binding */
/** @typedef {import('./types').Value} Value */

/** @implements {Value} */
export class AnyValue {
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

  get(_, values) {
    return values[this.index];
  }
}

/** @implements {Value} */
export class VarValue {
  constructor(propValue) {
    this.propName = propValue.get();
    this.dataPropName = 'data-dsl-prop-' + this.propName.substr(2);
    this.dataSelector = '[' + this.dataPropName + ']';
  }
  /** @param {Binding} binding */
  get(binding) {
    let el = binding.element;
    do {
      if(el.hasAttribute(this.dataPropName)) {
        return el[Symbol.for(this.propName)];
      }
      el = binding.element.closest(this.dataSelector);
    } while(el);
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
   * @param {Binding} binding 
   * @param {any[]} values
   */
  get(binding, values) {
    let obj = this.objValue.get(binding, values);
    let prop = this.propValue.get(binding, values);
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
  /** @param {Binding} binding */
  get(binding) {
    return binding.rootElement.querySelector(this.selector);
  }
}