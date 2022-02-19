// @ts-check
import { Binding } from './binding.js';
import { ComputedValue } from './compute.js';
import { flags as declFlags } from './declaration.js';
import { properties, features } from './property.js';
import { SparseArray } from './sparse-array.js';
import { createValueTemplate } from './template.js';
import { SpaceSeparatedListValue } from './value.js';

/**
 * @typedef {import('./types').MountedBehaviorType} MountedBehaviorType
 * @typedef {import('./changeset').Changeset} Changeset
 * @typedef {import('./declaration').Declaration} Declaration
 * @typedef {import('./template').ValueTemplate} ValueTemplate
 * @typedef {import('./property').PropertyDefinition} PropertyDefinition
 * @typedef {import('./property').KeyedMultiPropertyDefinition} KeyedMultiPropertyDefinition
 * @typedef {import('./property').ShorthandPropertyDefinition} ShorthandPropertyDefinition
 * @typedef {import('./property').LonghandPropertyDefinition} LonghandPropertyDefinition
 * @typedef {import('./property').BehaviorMultiPropertyDefinition} BehaviorMultiPropertyDefinition
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

/**
 * @template {string | Array<any> | MountedBehaviorType} K
 */
export class MultiBinding extends Binding {
  /**
   * @param {ShorthandPropertyDefinition | KeyedMultiPropertyDefinition | BehaviorMultiPropertyDefinition} defn
   * @param {ConstructorParameters<typeof Binding>} args
   */
  constructor(defn, ...args) {
    super(...args);

    /** @type {ShorthandPropertyDefinition | KeyedMultiPropertyDefinition | BehaviorMultiPropertyDefinition} */
    this.defn = defn;

    /** @type {number} */
    this.numberOfValues =
    /** @type {ShorthandPropertyDefinition} */(defn).longhand?.length || 0;

    /** @type {number} */
    this.numberOfValuesWithKey = this.numberOfValues + (defn.keyed ? 1 : 0);

    /** @type {Set<string | null | MountedBehaviorType>} */
    this.active = new Set();
    /** @type {Map<string | null | MountedBehaviorType, readonly any[]>} */
    this.initial = new Map();
    /** @type {Map<string | null | MountedBehaviorType, any[]> | null} */
    this.oldValues = /** @type {KeyedMultiPropertyDefinition} */(defn).oldValues
      ? new Map() : null;
  }
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
      case declFlags.multi | declFlags.shorthand:
      // behavior: mount(Behavior)
      case declFlags.multi | declFlags.behavior:
      // class-toggle: one "one", two "two"
      case declFlags.multi:
      // each: ${items} select(template)
      case declFlags.shorthand: {
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
      // each-items: ${items}
      case declFlags.longhand: {
        let defn = /** @type {LonghandPropertyDefinition} */(properties[propName]);
        return this.addTemplate(declaration, declaration.template, defn.index);
      }
      default: {
        throw new Error('Unknown property type');
      }
    }
  }
  /**
  * 
  * @param {Changeset} changeset 
  * @returns {Generator<[[K, ...any[]], boolean], void, unknown>}
  */
  * calculate(changeset) {
    let { element } = this;
    let sorted = this.declarations;
    let active = new Set(this.active);

    /**
     * @typedef {SparseArray<K extends string ? K : null>} KeyedSparseArray
     */

    /** @type {Map<string | null, KeyedSparseArray>} */
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
            for(let values of /** @type {[K, ...any[]][]} */(computedValue)) {
              let key = /** @type {string} */(values[0]);
              this.#bookkeep(active, key);
              let allValues = this.#appendToValues(key, values);
              yield [allValues, dirty];
              if(this.oldValues)
                this.oldValues.set(key, allValues.slice(1, this.numberOfValues + 1));
            }
            break loop;
          }
          // behavior: mount(Behavior)
          case declFlags.multi | declFlags.behavior: {
            for(let [values] of computedValue) {
              let Behavior = values[0];
              this.#bookkeep(active, Behavior);
              let allValues = this.#appendToValues(Behavior, values);
              yield [allValues, dirty];
              this.oldValues?.set(Behavior, values);
            }
            break loop;
          }
          // attr[type]: "text"
          case declFlags.multi | declFlags.shorthand | declFlags.keyed: {
            let key = computedValue[0];
            this.#bookkeep(active, key);
            let allValues = this.#appendToValues(key, computedValue);
            yield [allValues, dirty];
            if(this.oldValues) this.oldValues.set(key, allValues.slice(1, this.numberOfValues + 1));
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
            /** @type {KeyedSparseArray} */
            let valueList;
            if(valueMap.has(key))
              valueList = /** @type {KeyedSparseArray} */(valueMap.get(key));
            else {
              valueList = new SparseArray(numOfValues);
              valueMap.set(key, valueList);
            }
            if(valueList.empty(compute.index)) {
              valueList.set(compute.index, propValue);

              if(valueList.full()) {
                if(this.oldValues) this.oldValues.set(key, Array.from(valueList));
                if(key) valueList.unshift(key);
                yield [
                  /** @type {[K, ...any[]]} */(/** @type {unknown} */(valueList)),
                  dirty || dirtyKeys.has(key)
                ];
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
      if(this.oldValues) this.oldValues.set(key, Array.from(values));
      if(key) values.unshift(key);
      yield [/** @type {[K, ...any[]]} */(/** @type {unknown} */(values)), true];
    }

    // Yield out to reset to initial state.
    for(let key of active) {
      let initialValues = this.initial.get(key) || [];
      let valuesWithKey = this.defn.keyed ? [key, ...initialValues] : Array.from(initialValues);
      let allValues = this.#appendToValues(key, /** @type {[K, ...any[]]} */(valuesWithKey));
      yield [allValues, true];
      this.active.delete(key);
    }
  }
  /**
   * 
   * @param {Changeset} changeset 
   * @returns {Generator<any[], void, unknown>}
   */
  * values(changeset) {
    for(let [values] of this.calculate(changeset)) {
      yield values;
    }
  }
  /**
   * 
   * @returns {Generator<any[], void, unknown>}
   */
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
   * @param {string | MountedBehaviorType} key 
   */
  #setInitials(key) {
    if(!this.initial.has(key)) {
      /** @type {any[]} */
      let values = [];
      if(this.defn.longhand) {
        let i = 0, len = this.defn.longhand.length;
        while(i < len) {
          let lhDefn = /** @type {LonghandPropertyDefinition} */(properties[this.defn.longhand[i]]);
          values[i] = lhDefn.read(
            this.element,
            /** @type {string} */(key)
          );
          i++;
        }
      } else if(this.defn.feat & features.behavior) {
        values = [null, null];
      } else if(this.defn.read) {
        values[0] = this.defn.read(this.element, /** @type {string} */(key));
      }
      this.initial.set(key, Object.freeze(values));
    }
  }
  /**
   * 
   * @param {Set<string | null | MountedBehaviorType>} active 
   * @param {string | null | MountedBehaviorType} key 
   */
  #bookkeep(active, key) {
    active.delete(key);
    if(key !== null) this.#setInitials(key);
    this.active.add(key);
  }
  /**
   * @param {string | null | MountedBehaviorType} key
   * @param {[K, ...any[]]} values 
   * @param {boolean} keyed
   * @returns {[K, ...any[]]}
   */
  #appendToValues(key, values, keyed = true) {
    if(values.length === this.numberOfValuesWithKey && this.oldValues === null)
      return values;
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
    return /** @type {[K, ...any[]]} */(values.concat(append));
  }
}