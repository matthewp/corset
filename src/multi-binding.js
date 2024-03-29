// @ts-check
import { Binding } from './binding.js';
import { ComputedValue } from './compute.js';
import { flags as declFlags } from './declaration.js';
import { Name } from './constants.js';
import { properties, features, keySimple } from './property.js';
import { SparseArray } from './sparse-array.js';
import { KEYWORD_ALL, KEYWORD_REVERT_SHEET } from './constants.js';

/**
 * @typedef {import('./types').MountedBehaviorType} MountedBehaviorType
 * @typedef {import('./changeset').Changeset} Changeset
 * @typedef {import('./constants').Constant} Constant
 * @typedef {import('./declaration').Declaration} Declaration
 * @typedef {import('./template').ValueTemplate} ValueTemplate
 * @typedef {import('./property').PropertyDefinition} PropertyDefinition
 * @typedef {import('./pinfo').MultiPropertyDefinition} MultiPropertyDefinition
 * @typedef {import('./property').ShorthandPropertyDefinition} ShorthandPropertyDefinition
 * @typedef {import('./property').LonghandPropertyDefinition} LonghandPropertyDefinition
 * @typedef {import('./property').BehaviorMultiPropertyDefinition} BehaviorMultiPropertyDefinition
 * @typedef {import('./property').KeyReader} KeyReader
 * @typedef {string | Constant | null | MountedBehaviorType} MultiBindingKey
 */

/**
 * @template {string | Constant | Array<any> | MountedBehaviorType} K
 */
export class MultiBinding extends Binding {
  /**
   * @param {ShorthandPropertyDefinition | MultiPropertyDefinition | BehaviorMultiPropertyDefinition} defn
   * @param {ConstructorParameters<typeof Binding>} args
   */
  constructor(defn, ...args) {
    super(...args);

    /** @type {ShorthandPropertyDefinition | MultiPropertyDefinition | BehaviorMultiPropertyDefinition} */
    this.defn = defn;

    /** @type {number} */
    this.numberOfValues =
      this.defn.num ||
      /** @type {ShorthandPropertyDefinition} */(defn).longhand?.length || 2;

    /** @type {number} */
    this.numberOfValuesWithKey = this.numberOfValues + (defn.feat & features.keyed ? 1 : 0);

    /** @type {KeyReader} */
    this.readKey = /** @type {MultiPropertyDefinition} */(this.defn).key || keySimple;

    /** @type {Set<MultiBindingKey>} */
    this.active = new Set();
    /** @type {Map<MultiBindingKey, readonly any[]>} */
    this.initial = new Map();
    /** @type {Map<MultiBindingKey, any[]> | null} */
    this.oldValues = defn.feat & features.oldValues ? new Map() : null;
  }
  /**
  * 
  * @param {Declaration} declaration 
  */
  add(declaration) {
    this.push(declaration);

    let propName = declaration.propertyName;
    switch(declaration.flags) {
      // Unkeyed multi
      case declFlags.multi | declFlags.shorthand:
      // behavior: mount(Behavior)
      case declFlags.multi | declFlags.behavior:
      // event: [label] type callback
      case declFlags.multi | declFlags.shorthand | declFlags.label:
      // class-toggle: one "one", two "two"
      case declFlags.multi:
      // each: ${items} select(template)
      case declFlags.shorthand: {
        return this.addTemplate(declaration, declaration.template);
      }
      // each-items: ${items}
      case declFlags.longhand:
      // event-once: [label] true
      case declFlags.longhand | declFlags.label: {
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
    let sorted = this.declarations;
    let active = new Set(this.active);
    /** @type {Set<MultiBindingKey>} */
    let unset = new Set();

    /**
     * @typedef {SparseArray<K extends string ? K : null>} KeyedSparseArray
     */

    /** @type {Map<string | Constant | null, KeyedSparseArray>} */
    let valueMap = new Map();
    let getValueList =
    /**
     * 
     * @param {string | Constant | null} key 
     * @param {number} numOfValues 
     * @return {KeyedSparseArray}
     */
    function(key, numOfValues) {
      /** @type {KeyedSparseArray} */
      let valueList;
      if(valueMap.has(key))
        valueList = /** @type {KeyedSparseArray} */(valueMap.get(key));
      else {
        valueList = new SparseArray(numOfValues);
        valueMap.set(key, valueList);
      }
      return valueList;
    };

    /** @type {Set<string | Constant | null>} */
    let dirtyKeys = new Set();

    let i = sorted.length;
    /** @type {Declaration} */
    let declaration;
    loop: while(i > 0) {
      i--;
      declaration = sorted[i];
      if(this.matches(declaration.rule.selector)) {
        let compute = /** @type {ComputedValue} */(this.computedValues.get(declaration));

        let dirty = compute.dirty(changeset);
        let valid = compute.valid;
        let computedValue = compute.check(changeset);

        switch(declaration.flags) {
          // attr: "type" "text"
          case declFlags.multi | declFlags.shorthand:
          // class-toggle: one "one", two "two"
          case declFlags.multi: {
            for(let values of /** @type {[K, ...any[]][]} */(computedValue)) {
              let key = this.readKey(values);
              if(!valid) unset.add(key);

              let idx = Name.is(key) ? 1 : 0;
              if(values[1] === KEYWORD_REVERT_SHEET) {
                if(key === KEYWORD_ALL) {
                  for(let val of this.active) {
                    unset.add(val);
                  }
                  break;
                }
                else {
                  unset.add(key);
                  break;
                }
              } else if(unset.has(key) || typeof key === 'undefined') {
                break;
              }

              this.#bookkeep(active, key);
              if(dirty) dirtyKeys.add(key);
              let valueList = getValueList(key, this.numberOfValuesWithKey);
              for(let i = 0; idx < values.length; i++, idx++) {
                if(valueList.empty(i))
                  valueList.set(i, values[idx]);
              }
            }
            break;
          }
          // event: [label] type callback, [another-label] type callback
          case declFlags.multi | declFlags.shorthand | declFlags.label: {
            for(let values of /** @type {[K, ...any[]][]} */(computedValue)) {
              let key = this.readKey(values);
              let isName = Name.is(key);
              if(!isName) {
                key = Name.for('corset.default.' + key);
              }
              else
                values = /** @type {[K, ...any[]]} */(values.slice(1));

              this.#bookkeep(active, key, isName ? values[1] : values[0]);
              let valueList = getValueList(key, this.numberOfValues);
              for(let i = 0; i < values.length; i++) {
                if(valueList.empty(i))
                  valueList.set(i, values[i]);
              }
              if(dirty) dirtyKeys.add(key);
            }
            break;
          }
          // behavior: mount(Behavior)
          case declFlags.multi | declFlags.behavior: {
            if(valid) {
              for(let [values] of computedValue) {
                let Behavior = values[0];
                this.#bookkeep(active, Behavior);
                let allValues = this.#appendToValues(Behavior, values);
                yield [allValues, dirty];
                this.oldValues?.set(Behavior, values);
              }
            }
            break loop;
          }
          // each-items: ${items};
          case declFlags.longhand: {
            let keyed = this.defn.feat & features.keyed;
            /** @type {string | Constant | null} */
            let key = keyed ? this.readKey(computedValue) : null;
            if(!valid) break;
            /** @type {any} */
            let propValue = keyed ? computedValue[1] : computedValue[0];
            let idx = compute.index + (keyed ? 1 : 0);

            this.#bookkeep(active, key);
            let valueList = getValueList(key, this.numberOfValuesWithKey);
            if(keyed && valueList.empty(0))
              valueList.set(0, computedValue[0]);
            if(valueList.empty(idx))
              valueList.set(idx, propValue);
            if(dirty)
              dirtyKeys.add(key);

            if(valueList.full()) {
              if(this.oldValues) this.oldValues.set(key, Array.from(valueList));
              yield [
                /** @type {[K, ...any[]]} */(/** @type {unknown} */(valueList)),
                dirty || dirtyKeys.has(key)
              ];
              valueMap.delete(key);
              dirtyKeys.delete(key);
              break;
            }

            break;
          }
          // event-once: [name] true;
          case declFlags.longhand | declFlags.label: {
            let hasLabel = Name.is(computedValue[0]);
            /** @type {Name} */
            let key = hasLabel ? computedValue[0] : Name.for('corset.default.' + computedValue[0]);
            if(!valid) unset.add(key);
            if(unset.has(key)) break;
            /** @type {any} */
            let propValue = computedValue[1];
            if(!valid) break;

            this.#bookkeep(active, key, computedValue[0]);
            let valueList = getValueList(key, this.numberOfValues);
            if(!hasLabel && valueList.empty(0))
              valueList.set(0, computedValue[0]);
            if(valueList.empty(compute.index))
              valueList.set(compute.index, propValue);
            if(dirty)
              dirtyKeys.add(key);
            break;
          }
          // each: ${items} select(template)
          case declFlags.shorthand: {
            if(!valid) break;
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
      let isDirty = dirtyKeys.has(key);
      // valueMap is always appended from a longhand prop.
      let numOfValues = this.numberOfValues;
      let keyed = this.defn.feat & features.keyed;
      let i = keyed ? 1 : 0;
      while(i < numOfValues) {
        if(values.empty(i)) {
          values[i] = /** @type {ShorthandPropertyDefinition} */(this.defn).defaults[i - (keyed ? 1 : 0)];
        }
        i++;
      }
      if(this.oldValues) {
        let current = this.oldValues.get(key);
        this.oldValues.set(key, values.slice());
        if(current) {
          values.push(...current);
        }
      }
      yield [/** @type {[K, ...any[]]} */(/** @type {unknown} */(values)), isDirty];
    }

    // Yield out to reset to initial state.
    for(let key of active) {
      let initialValues = this.initial.get(key) || [];
      let valuesWithKey = this.defn.feat & features.keyed && !Name.is(key) ? [key, ...initialValues] : Array.from(initialValues);
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
   * @param {string | Constant | MountedBehaviorType} key 
   * @param {string} [type]
   */
  #setInitials(key, type) {
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
        if(type) values[0] = type;
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
   * @param {Set<MultiBindingKey>} active 
   * @param {MultiBindingKey} key 
   * @param {string} [type]
   */
  #bookkeep(active, key, type) {
    active.delete(key);
    if(key !== null) this.#setInitials(key, type);
    this.active.add(key);
  }
  /**
   * @param {MultiBindingKey} key
   * @param {[K, ...any[]]} values 
   * @param {boolean} keyed
   * @returns {[K, ...any[]]}
   */
  #appendToValues(key, values, keyed = true) {
    if(values.length === this.numberOfValuesWithKey && this.oldValues === null)
      return values;
    /** @type {any[]} */
    let append = [];
    let keyIsName = Name.is(key);
    if(typeof key === 'string') append.push(key);
    let i = append.length + values.length;
    let d = keyed ? 1 : 0;
    let numOfValues = keyIsName ? this.numberOfValues : this.numberOfValuesWithKey;
    while(i < numOfValues) {
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