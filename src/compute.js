// @ts-check

/**
 * @typedef {import('./declaration').Declaration} Declaration
 * @typedef {import('./value').Value} Value
 * @typedef {import('./bindings').Bindings} Bindings
 * @typedef {import('./bindings').ReadElementValue} ReadElementValue
 */

export const NO_VALUE = {};

/**
 * Sort a declaration first by selector specificity, then by rule index,
 * then by declaration index
 * @param {Declaration} d1
 * @param {Declaration} d2
 * @returns {boolean}
 */
 function compare(d1, d2) {
  return d1.rule.specificity === d2.rule.specificity ?
    d1.rule.index === d2.rule.index ?
    d1.index < d2.index :
    d1.rule.index < d2.rule.index :
    d1.rule.specificity < d2.rule.specificity;
}

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
      compute.lastValue = currentValue;
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
    compute.lastValue = currentValue;
    compute.currentValue = newValue;
    return true;
  }
  return false;
}

export class ComputedValue {
  /**
   * @param {Element} rootElement The root element of the tree
   * @param {Element} element The element this compute targets
   * @param {any} initialValue The initial value of the compute
   * @param {Boolean} isMultiValue Contains multiple values
   * @param {ComputedValue | null} keyCompute The compute for the key value
   */
  constructor(rootElement, element, initialValue, isMultiValue, keyCompute) {
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
    this.isMultiValue = isMultiValue;
    /** @type {ComputedValue | null} */
    this.keyCompute = keyCompute
    /** @type {typeof callArg} */
    this.callArg = isMultiValue ? callMultiArg : callArg;
    /** @type {typeof computeDirty} */
    this.computeDirty = isMultiValue ? computeMultiDirty : computeDirty;
    /** @type {any} */
    this.currentValue = NO_VALUE;
    /** @type {any} */
    this.lastValue = NO_VALUE;
  }
  /**
   * Add a declaration
   * @param {Declaration} declaration 
   */
  addDeclaration(declaration) {
    if(!this.set.has(declaration)) {
      this.set.add(declaration);
      binaryInsert(this.sorted, declaration, compare);
      //this.sorted.push(declaration); // TODO PUT THEM IN ORDER
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
    let keyDirty = !!(this.keyCompute && this.computeDirty(this.keyCompute, values));
    return this.computeDirty(this, values) || keyDirty;
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

  key() {
    return this.keyCompute ? this.keyCompute.get() : null;
  }
}

/**
 * 
 * @param {Bindings} bindings 
 * @param {Value[]} args
 * @param {ReadElementValue} read
 * @param {boolean} multiValue
 * @param {ComputedValue | null} keyCompute
 * @param {any[]} values
 * @returns {ComputedValue}
 */
 export function createCompute(bindings, args, read, multiValue, keyCompute, values) {
  return new ComputedValue(bindings.rootElement, bindings.element,
    read(bindings.rootElement, bindings.element, keyCompute, args, values), multiValue, keyCompute
  );
}