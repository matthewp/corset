// @ts-check
import { ComputedValue } from './compute.js';
import { NO_VALUE } from './value.js';

/**
 * @typedef {import('./changeset').Changeset} Changeset
 * @typedef {import('./declaration').Declaration} Declaration
 * @typedef {import('./template').ValueTemplate} ValueTemplate
 * @typedef {import('./property').PropertyDefinition} PropertyDefinition
 * @typedef {import('./property').ShorthandPropertyDefinition} ShorthandPropertyDefinition
 * @typedef {import('./property').LonghandPropertyDefinition} LonghandPropertyDefinition
 * @typedef {import('./property').PropertyPropName} PropertyPropName
 */

/**
 * 
 * @param {any[]} sorted 
 * @param {any} item 
 * @param {(a: any, b: any) => boolean} comparator
 * @returns {number}
 */
 function binaryInsert(sorted, item, comparator) {
  if(sorted.length === 0) {
    sorted.push(item);
    return 0;
  }
  let low = 0, high = sorted.length - 1, mid = 0;
  while (low <= high) {
    mid = low + (high - low >> 1);
    if(comparator(sorted[mid], item)) {
      low = mid + 1;
    } else {
      high = mid -1;
    }
  }

  if(comparator(sorted[mid], item)) {
    mid++;
  }

  sorted.splice(mid, 0, item);
  return mid;
}

/**
 * Sort a declaration first by selector specificity, then by rule index,
 * then by declaration index
 * @param {Declaration} d1
 * @param {Declaration} d2
 * @returns {boolean}
 */
function compare(d1, d2) {
  return d1.rule.specificity === d2.rule.specificity ?
    d1.sourceOrder < d2.sourceOrder :
    d1.rule.specificity < d2.rule.specificity;
}

export class Binding {
  /**
   * 
   * @param {string} propertyName
   * @param {Element} rootElement 
   * @param {Element} element 
   */
  constructor(propertyName, rootElement, element) {
    /** @type {string} */
    this.propertyName = propertyName;
    /** @type {Element} */
    this.rootElement = rootElement;
    /** @type {Element} */
    this.element = element;
    /** @type {Declaration[]} */
    this.declarations = [];
    /** @type {Map<Declaration, ComputedValue>} */
    this.computedValues = new Map();
    /** @type {ComputedValue | null} */
    this.compute = null;
    /** @type {any} */
    this.value = NO_VALUE;
    /** @type {any} */
    this.initial = NO_VALUE;
  }
  /**
   * 
   * @param {Declaration} declaration
   * @returns {ComputedValue}
   */
  add(declaration) {
    return this.addTemplate(declaration, declaration.template);
  }
  /**
   * 
   * @param {Declaration} declaration 
   */
  push(declaration) {
    binaryInsert(this.declarations, declaration, compare);
  }
  /**
   * 
   * @param {Declaration} declaration 
   * @param {ValueTemplate} template 
   * @param {number} [index]
   * @returns {ComputedValue}
   */
  addTemplate(declaration, template, index) {
    /** @type {ComputedValue} */
    let compute = new ComputedValue(template, this, index);
    this.computedValues.set(declaration, compute);
    return compute;
  }
  /**
   * 
   * @param {Changeset} changeset 
   * @returns 
   */
  dirty(changeset) {
    if(this.value === NO_VALUE) {
      return true;
    } else {
      let compute = this.compute;
      this.compute = this.#find();
      if(compute !== this.compute) return true;
      return compute ? compute.dirty(changeset) : false;
    }
  }
  /**
   * 
   * @param {Changeset} changeset 
   */
  update(changeset) {
    if(this.compute === null) {
      this.compute = this.#find();
    }
    if(this.compute === null) {
      this.value = this.initial;
    } else {
      this.value = this.compute.check(changeset);
    }
    return this.value;
  }
  /**
   * 
   * @returns {any[]}
   */
  getList() {
    return this.compute?.listValue() || [];
  }
  /**
   * Whether this binding has received a value yet or not.
   * @returns {boolean}
   */
  hasValue() {
    return this.value !== NO_VALUE;
  }
  /**
   * 
   * @returns {ComputedValue | null}
   */
  #find() {
    let declaration = this.#firstMatch();
    if(declaration) {
      /** @type {ComputedValue} */
      let compute = /** @type {ComputedValue} */(this.computedValues.get(declaration));
      return compute;
    }
    return null;
  }
  *walk() {
    let { element } = this;
    let sorted = this.declarations;

    let i = sorted.length;
    /** @type {Declaration} */
    let declaration;
    while(i > 0) {
      i--;
      declaration = sorted[i];
      if(element.matches(declaration.rule.selector)) {
        yield declaration;
      }
    }
  }
  /**
   * 
   * @returns {Declaration | void}
   */
  #firstMatch() {
    for(let declaration of this.walk()) {
      return declaration;
    }
  }
}