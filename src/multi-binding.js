// @ts-check
import { Binding } from './binding.js';
import { ComputedValue } from './compute.js';
import { flags as declFlags } from './declaration.js';
import { properties } from './property.js';
import { SparseArray } from './sparse-array.js';
import { createValueTemplate } from './template.js';
import { SpaceSeparatedListValue } from './value.js';

/**
 * @typedef {import('./changeset').Changeset} Changeset
 * @typedef {import('./declaration').Declaration} Declaration
 * @typedef {import('./template').ValueTemplate} ValueTemplate
 * @typedef {import('./property').PropertyDefinition} PropertyDefinition
 * @typedef {import('./property').KeyedMultiPropertyDefinition} KeyedMultiPropertyDefinition
 * @typedef {import('./property').ShorthandPropertyDefinition} ShorthandPropertyDefinition
 * @typedef {import('./property').LonghandPropertyDefinition} LonghandPropertyDefinition
 */

/**
 * 
 * @param {Declaration} declaration 
 * @returns {ValueTemplate}
 */
 function createPrependedKeyedTemplate(declaration) {
  return createValueTemplate(SpaceSeparatedListValue, [
    /** @type {ValueTemplate} */(declaration.keyTemplate)
  ].concat(declaration.template.deps))
}

export class MultiBinding extends Binding {
  /**
   * @param {ShorthandPropertyDefinition | KeyedMultiPropertyDefinition} defn
   * @param {ConstructorParameters<typeof Binding>} args
   */
  constructor(defn, ...args) {
    super(...args);

    /** @type {ShorthandPropertyDefinition | KeyedMultiPropertyDefinition} */
    this.defn = defn;

    /** @type {number} */
    this.numberOfValues =
    /** @type {ShorthandPropertyDefinition} */(defn).longhand?.length || 0;

    /** @type {number} */
    this.numberOfValuesWithKey = this.numberOfValues + (defn.keyed ? 1 : 0);

    /** @type {Set<string | null>} */
    this.active = new Set();
    /** @type {Map<string | null, readonly any[]>} */
    this.initial = new Map();
    /** @type {Map<string | null, any[]> | null} */
    this.oldValues = /** @type {KeyedMultiPropertyDefinition} */(defn).oldValues
      ? new Map() : null;
  }
  init(){}
  /**
  * 
  * @param {Declaration} declaration 
  */
  add(declaration) {
    this.push(declaration);

    let propName = declaration.propertyName;
    switch(declaration.flags) {
      // attr[type]: "text"
      case declFlags.multi | declFlags.shorthand | declFlags.keyed: {
        let template = createPrependedKeyedTemplate(declaration);
        return this.addTemplate(declaration, template);
      }
      // Unkeyed multi
      case declFlags.multi | declFlags.shorthand: {
        return this.addTemplate(declaration, declaration.template);
      }
      case declFlags.longhand | declFlags.keyed: {
        let defn = /** @type {LonghandPropertyDefinition} */(properties[propName]);        
        return this.addTemplate(declaration, createPrependedKeyedTemplate(declaration), defn.index);
      }
      // class-toggle[disabled]: true
      case declFlags.keyed | declFlags.multi: {
        let template = createPrependedKeyedTemplate(declaration);
        return this.addTemplate(declaration, template);
      }
      // each: ${items} select(template)
      case declFlags.shorthand: {
        return this.addTemplate(declaration, declaration.template);
      }
      // each-items: ${items}
      case declFlags.longhand: {
        let defn = /** @type {LonghandPropertyDefinition} */(properties[propName]);
        return this.addTemplate(declaration, declaration.template, defn.index);
      }
      // class-toggle: one "one", two "two"
      case declFlags.multi: {
        return this.addTemplate(declaration, declaration.template);
      }
      default: {
        throw new Error('Unknown property type');
      }
    }
  }
  /**
  * 
  * @param {Changeset} changeset 
  */
  * calculate(changeset) {
    let { element } = this;
    let sorted = this.declarations;
    let active = new Set(this.active);

    /** @type {Map<string | null, SparseArray>} */
    let valueMap = new Map();

    /** @type {Set<string | null>} */
    let dirtyKeys = new Set();

    let i = sorted.length;
    /** @type {Declaration} */
    let declaration;
    loop: while(i > 0) {
      i--;
      declaration = sorted[i];
      if(element.matches(declaration.rule.selector)) {
        let compute = /** @type {ComputedValue} */(this.computedValues.get(declaration));

        let dirty = compute.dirty(changeset);
        let computedValue = compute.check(changeset);

        switch(declaration.flags) {
          // attr: "type" "text"
          case declFlags.multi | declFlags.shorthand:
          // class-toggle: one "one", two "two"
          case declFlags.multi: {
            for(let values of computedValue) {
              let key = values[0];
              this.#bookkeep(active, key);
              let allValues = this.#appendToValues(key, values);
              yield [allValues, dirty];
              if(this.oldValues)
                this.oldValues.set(key, allValues.slice(1));
            }
            break loop;
          }
          // attr[type]: "text"
          case declFlags.multi | declFlags.shorthand | declFlags.keyed: {
            let key = computedValue[0];
            this.#bookkeep(active, key);
            yield [this.#appendToValues(key, computedValue), dirty];
            break;
          }
          
          // attr-value[type]: "text"
          case declFlags.longhand | declFlags.keyed:
          // each-items: ${items};
          case declFlags.longhand: {
            let keyed = !!(declaration.flags & declFlags.keyed);
            /** @type {number} */
            let numOfValues = this.numberOfValues;
            /** @type {string | null} */
            let key = keyed ? computedValue[0] : null;
            /** @type {any} */
            let propValue = keyed ? computedValue[1] : computedValue[0];

            this.#bookkeep(active, key);
            /** @type {SparseArray} */
            let valueList;
            if(valueMap.has(key))
              valueList = /** @type {SparseArray} */(valueMap.get(key));
            else {
              valueList = new SparseArray(numOfValues);
              valueMap.set(key, valueList);
            }
            if(valueList.empty(compute.index)) {
              valueList.set(compute.index, propValue);

              if(valueList.full()) {
                if(this.oldValues)
                  this.oldValues.set(key, Array.from(valueList));
                if(key) valueList.unshift(key);
                yield [valueList, dirty || dirtyKeys.has(key)];
                valueMap.delete(key);
                dirtyKeys.delete(key);
                break;
              }
            }

            if(dirty) {
              dirtyKeys.add(key);
            }

            break;
          }
          // class-toggle[disabled]: true
          case declFlags.keyed | declFlags.multi: {
            let key = computedValue[0];
            this.#bookkeep(active, key);
            let allValues = this.#appendToValues(key, computedValue);
            if(dirty && this.oldValues) this.oldValues.set(key, computedValue.slice(1));
            yield [allValues, dirty];
            break;
          }
          // each: ${items} select(template)
          case declFlags.shorthand: {
            this.#bookkeep(active, null);
            yield [this.#appendToValues(null, computedValue, false), dirty];
            break;
          }
          default: {
            throw new Error(`This is not supported`);
          }
        }
      }
    }

    // Fill in the defaults by looking at the valueMap for holes.
    for(let [key, values] of valueMap) {
      if(!dirtyKeys.has(key)) continue;
      // valueMap is always appended from a longhand prop.
      let numOfValues = this.numberOfValues;
      let i = 0;
      while(i < numOfValues) {
        if(values.empty(i)) {
          values[i] = /** @type {ShorthandPropertyDefinition} */(this.defn).defaults[i];
        }
        i++;
      }
      if(key) values.unshift(key);
      yield [values, true];
    }

    // Yield out to reset to initial state.
    for(let key of active) {
      yield [[key, ...this.initial.get(key) || []], true];
      this.active.delete(key);
    }
  }
  /**
   * 
   * @param {Changeset} changeset 
   */
  * values(changeset) {
    for(let [values] of this.calculate(changeset)) {
      yield values;
    }
  }
  * current() {
    if(!this.oldValues) return;
    for(let [key, values] of this.oldValues) {
      /** @type {any[]} */
      let out = key ? [key] : [];
      yield out.concat(values);
    }
  }
  /**
   * 
   * @param {Changeset} changeset 
   */
  * changes(changeset) {
    for(let [values, dirty] of this.calculate(changeset)) {
      if(dirty)
        yield values;
    }
  }
  /**
   * 
   * @param {string} key 
   */
  #setInitials(key) {
    if(!this.initial.has(key)) {
      /** @type {any[]} */
      let values = [];
      if(this.defn.longhand) {
        let i = 0, len = this.defn.longhand.length;
        while(i < len) {
          let lhDefn = /** @type {LonghandPropertyDefinition} */(properties[this.defn.longhand[i]]);
          values[i] = lhDefn.read(this.element, key);
          i++;
        }
      } else {
        
        values[0] = this.defn.read(this.element, key);
      }
      this.initial.set(key, Object.freeze(values));
    }
  }
  /**
   * 
   * @param {Set<string | null>} active 
   * @param {string | null} key 
   */
  #bookkeep(active, key) {
    active.delete(key);
    if(key) this.#setInitials(key);
    this.active.add(key);
  }
  /**
   * @param {string | null} key
   * @param {any[]} values 
   * @param {boolean} keyed
   */
  #appendToValues(key, values, keyed = true) {
    if(values.length === this.numberOfValuesWithKey) return values;
    /** @type {any[]} */
    let append = [];
    let i = values.length;
    let d = keyed ? 1 : 0;
    while(i < this.numberOfValuesWithKey) {
      append.push(/** @type {ShorthandPropertyDefinition} */(this.defn).defaults[i - d]);
      i++;
    }
    if(this.oldValues && this.oldValues.has(key)) {
      let oldValues = /** @type {any[]} */(this.oldValues.get(key));
      append.push(...oldValues);
    }
    return values.concat(append);
  }
}