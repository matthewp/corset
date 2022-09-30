// @ts-check

import { PlaceholderValue, SpaceSeparatedListValue, NO_VALUE } from './value.js';

/**
 * @typedef {import('./binding').Binding} Binding
 * @typedef {import('./changeset').Changeset} Changeset
 * @typedef {import('./value').Value} Value
 * @typedef {import('./types').CheckedValue} CheckedValue
 * @typedef {import('./template').ValueTemplate} ValueTemplate
 * 
 * @typedef {(c: Changeset, v: number) => number} VersionCalculate
 */

export class ComputedValue {
  /** @type {boolean} */
  #initial = true;
  /** @type {any} */
  #value;
  /** @type {WeakMap<Changeset, boolean>} */
  #dirty = new WeakMap();
  /** @type {CheckedValue['check'] | undefined} */
  #check;
  /**
   * 
   * @param {ValueTemplate} template 
   * @param {Binding} binding 
   * @param {number} index
   */
  constructor(template, binding, index = 0) {
    /** @type {Binding} */
    this.binding = binding;
    /** @type {number} */
    this.index = index;
    /** @type {any[]} */
    this.args = [];
    /** @type {ComputedValue[]} */
    this.argDeps = [];
    /** @type {Map<string, ComputedValue> | null} */
    this.inputDeps = null;
    /** @type {Map<string, any> | null} */
    this.inputProps = null;
    /** @type {Value} */
    this.raw = hydrate(this, template);
    /** @type {() => any[]} */
    this.listValue = this.raw instanceof SpaceSeparatedListValue ?
      () => this.#value :
      () => [this.#value];
    /** @type {boolean} */
    this.valid = true;

    // Private
    this.#value = null;
    this.#check = this.raw.check;
  }
  /**
   * 
   * @param {number} index 
   * @param {ComputedValue} dep
   * @param {Changeset} changeset
   */
  set(index, dep, changeset) {
    let deps = this.argDeps;
    if(deps[index] !== dep) {
      this.#dirty.set(changeset, true);
    }
    deps[index] = dep;
  }
  /**
   * @param {Changeset} changeset
   * @returns {boolean}
   */
  dirty(changeset) {
    if(this.#initial) {
      this.calculate(changeset);
      this.#dirty.set(changeset, true);
      this.#initial = false;
    }
    if(this.#dirty.has(changeset)) {
      return /** @type {boolean} */(this.#dirty.get(changeset));
    }
    this.calculate(changeset);
    return /** @type {boolean} */(this.#dirty.get(changeset));
  }
  /**
   * 
   * @param {Changeset} changeset 
   */
  compute(changeset) {
    let { value } = call(this, changeset, this.raw.get);
    this.#value = value;
  }
  /**
   * 
   * @param {Changeset} changeset 
   * @returns {any}
   */
  check(changeset) {
    if(this.dirty(changeset)) {
      this.compute(changeset);
    }
    return this.#value;
  }
  /**
   * 
   * @param {Changeset} changeset 
   * @returns {{ valid: boolean; dirty: boolean; }}
   */
  calculate(changeset) {
    let dirty = false;
    let valid = this.valid;
    if(this.#dirty.has(changeset)) {
      dirty = /** @type {boolean} */(this.#dirty.get(changeset));
      return { dirty, valid };
    }
    if(this.#check) {
      let { value, valid: callValid } = call(this, changeset, this.#check);
      if(!callValid) {
        dirty = callValid !== valid;
        valid = false;
      } else if(value) {
        dirty = true;
      }
    }

    for(let dep of this.#allDeps()) {
      let { dirty: depDirty, valid: depValid} = dep.calculate(changeset);
      if(depDirty) {
        dirty = true;
      }
      if(!depValid) {
        valid = false;
      }
    }

    this.#dirty.set(changeset, dirty);
    this.valid = valid;
    return {dirty, valid};
  }
  * #allDeps() {
    yield * this.argDeps;
    if(this.inputDeps) {
      yield * this.inputDeps.values();
    }
  }
}

/**
 * 
 * @param {ComputedValue} compute 
 * @param {ValueTemplate} template 
 * @returns {Value}
 */
function hydrate(compute, template) {
  let value = new template.Value(compute.binding);
  for(let dep of template.deps) {
    compute.argDeps.push(new ComputedValue(dep, compute.binding));
  }
  let inputProperties = template.inputProperties;
  if(inputProperties) {
    compute.inputProps = new Map();
    compute.inputDeps = new Map();
    for(let [propName, template] of inputProperties) {
      compute.inputDeps.set(propName, new ComputedValue(template, compute.binding));
    }
  }
  return value;
}

/**
 * @param {ComputedValue} compute 
 * @param {Changeset} changeset
 * @param {Value['get'] | CheckedValue['check']} method
 * @returns {{ value: any, valid: boolean }}
 */
function call(compute, changeset, method) {
  let {args, binding, raw: value, inputProps: props} = compute;
  if(compute.inputDeps) {
    for(let [propName, v] of compute.inputDeps) {
      let value = v.check(changeset);
      if((v.raw instanceof PlaceholderValue) && Array.isArray(value)) {
        value = value[0];
      }
      /** @type {Map<string, any>} */(props).set(propName, value);
    }
  }
  args.length = 0;
  for(let v of compute.argDeps) {
    if(v.raw instanceof PlaceholderValue) {
      let values = v.check(changeset);
      if(values === NO_VALUE) {
        return {
          value: undefined,
          valid: false
        };
      }
      if(values) args.push(...values);
    }
    else
      args.push(v.check(changeset)); 
  }
  return {
    value: method.call(value, args, binding, props, changeset),
    valid: true
  };
}