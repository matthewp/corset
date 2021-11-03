/** @typedef {import('./types').ValueType} ValueType */
/** @typedef {ValueType} Value */

/** @implements {ValueType} */
export class AnyValue {
  constructor(value) {
    this.value = value;
  }
  get() {
    return this.value;
  }
}

/** @implements {ValueType} */
export class InsertionValue {
  constructor(index) {
    this.index = index;
  }

  get(_, values) {
    return values[this.index];
  }
}

/** @implements {ValueType} */
export class VarValue {
  constructor(propName) {
    this.propName = propName;
    this.dataPropName = 'data-dsl-prop' + propName.substr(1);
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