// @ts-check

/**
 * @typedef {import('./bindings2').Bindings} Bindings
 * @typedef {import('./declaration').Declaration} Declaration
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
    d1.rule.index === d2.rule.index ?
    d1.index < d2.index :
    d1.rule.index < d2.rule.index :
    d1.rule.specificity < d2.rule.specificity;
}

export class PropertyBinding {
  /**
   * 
   * @param {Bindings} bindings 
   */
  constructor(bindings) {
    /** @type {Bindings} */
    this.bindings = bindings;
    /** @type {Declaration[]} */
    this.sorted = [];
  }

  /**
   * 
   * @param {Declaration} declaration 
   */
  add(declaration) {
    binaryInsert(this.sorted, declaration, compare);
  }

  *[Symbol.iterator]() {
    // Loop over and collect keys along the way.
    let sorted = this.sorted,
      i = sorted.length - 1,
      /** @type {Set<string>} */
      keys = new Set();

    let {element} = this.bindings;
    let {rootElement, values} = this.bindings.root;

    while(i >= 0) {
      let decl = sorted[i];

      if(decl.multi) {
        break;
      }

      let key = decl.key.get(rootElement, element, values);
      if(!keys.has(key)) {
        keys.add(key);
        let value = decl.args[0].get(rootElement, element, values);
        yield [key, value];
      }

      i--;
    }
  }
}


// Just playing...

/*

function registerProperty(propertyName, controller) {

}

registerProperty('text', class {
  read(element) {
    return element.textContent;
  }
  set() {

  }
});

registerProperty('class-toggle', class {
  read(element, key) {
    return element.classList.has(key);
  }
});

*/