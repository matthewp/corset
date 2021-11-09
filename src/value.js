// @ts-check

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
  get(element) {
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
export class GetValue {
  constructor(objValue, propValue) {
    if(!propValue) {
      propValue = objValue;
      objValue = new VarValue(new AnyValue('--scope'));
    }
    this.objValue = objValue;
    this.propValue = propValue;
  }
  get(element, values) {
    let obj = this.objValue.get(element, values);
    let prop = this.propValue.get(element, values);
    if(typeof prop === 'function') {
      return prop(obj);
    } else {
      return obj[prop];
    }
  }
}