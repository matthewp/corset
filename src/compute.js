// @ts-check

/**
 * @typedef {import('./declaration').Declaration} Declaration
 * @typedef {import('./value').Value} Value
 */

const NO_VALUE = {};

/**
 * 
 * @param {Value[]} args
 * @param {Element} rootElement
 * @param {Element} element
 * @param {any[]} values
 */
function callArg(args, rootElement, element, values) {
  return args[0].get(rootElement, element, values);
}

/**
 * 
 * @param {Value[]} args
 * @param {Element} rootElement
 * @param {Element} element
 * @param {any[]} values
 */
function callMultiArg(args, rootElement, element, values) {
  return args.map(arg => arg.get(rootElement, element, values));
}

/**
 * 
 * @param {ComputedValue} compute
 * @param {any[]} values
 */
function computeValue(compute, values) {
  let { callArg, element, initialValue, rootElement, sorted } = compute;

  let i = sorted.length;
  /** @type {Declaration} */
  let declaration;
  while(i > 0) {
    i--;
    declaration = sorted[i];
    if(element.matches(declaration.rule.selector)) {
      let args = declaration.args;
      return callArg(args, rootElement, element, values);
    }
  }
  return initialValue;
}

/**
 * 
 * @param {ComputedValue} compute
 * @param {any[]} values
 */
 function computeMultiDirty(compute, values) {
  let { currentValue } = compute;
  let newValue = computeValue(compute, values);
  for(let i = 0, len = newValue.length; i < len; i++) {
    if(currentValue[i] !== newValue[i]) {
      compute.currentValue = newValue;
      return true;
    }
  }
  return false;
}

/**
 * 
 * @param {ComputedValue} compute
 * @param {any[]} values
 */
function computeDirty(compute, values) {
  let { currentValue } = compute;
  let newValue = computeValue(compute, values);
  if(newValue !== currentValue) {
    compute.currentValue = newValue;
    return true;
  }
  return false;
}

export class ComputedValue {
  /**
   * @param {Element} rootElement
   * @param {Element} element
   * @param {any} initialValue
   * @param {Boolean} multi
   */
  constructor(rootElement, element, initialValue, multi) {
    /** @type {Set<Declaration>} */
    this.set = new Set();

    /** @type {Array<Declaration>} */
    this.sorted = [];
    /** @type {Element} */
    this.rootElement = rootElement;
    /** @type {Element} */
    this.element = element;
    /** @type {any} */
    this.initialValue = initialValue;
    /** @type {boolean} */
    this.multi = multi;
    /** @type {typeof callArg} */
    this.callArg = multi ? callMultiArg : callArg;
    /** @type {typeof computeDirty} */
    this.computeDirty = multi ? computeMultiDirty : computeDirty;
    /** @type {any} currentValue */
    this.currentValue = NO_VALUE;
  }
  /**
   * Add a declaration
   * @param {Declaration} declaration 
   */
  addDeclaration(declaration) {
    if(!this.set.has(declaration)) {
      this.set.add(declaration);
      this.sorted.push(declaration); // TODO PUT THEM IN ORDER
    }
  }
  /**
   * 
   * @returns {any}
   */
  get() {
    return this.currentValue;
  }
  /**
   * Get an item at this index
   * @param {number} index 
   * @returns {any}
   */
  item(index) {
    return this.currentValue[index];
  }
  /**
   * 
   * @param {any[]} values 
   * @returns {boolean}
   */
  dirty(values) {
    return this.computeDirty(this, values);
  }
  /**
   * 
   * @param {any[]} values 
   * @returns {any}
   */
  compute(values) {
    this.computeDirty(this, values);
    return this.currentValue;
  }
}