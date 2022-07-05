// @ts-check
import { Binding } from './binding.js';
import { ComputedValue } from './compute.js';
import { flags as declFlags } from './declaration.js';
import { Name } from './constants.js';
import { properties, features } from './property.js';
import { SparseArray } from './sparse-array.js';
import { createValueTemplate } from './template.js';
import { SpaceSeparatedListValue } from './value.js';
import { KEYWORD_UNSET } from './constants.js';

/**
 * @typedef {import('./types').MountedBehaviorType} MountedBehaviorType
 * @typedef {import('./changeset').Changeset} Changeset
 * @typedef {import('./declaration').Declaration} Declaration
 * @typedef {import('./template').ValueTemplate} ValueTemplate
 * @typedef {import('./property').PropertyDefinition} PropertyDefinition
 * @typedef {import('./pinfo').MultiPropertyDefinition} MultiPropertyDefinition
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
 * @typedef {string | Name | null | MountedBehaviorType} MultiBindingKey
 */

/**
 * @template {string | Name | Array<any> | MountedBehaviorType} K
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
      /** @type {ShorthandPropertyDefinition} */(defn).longhand?.length || 2;

    /** @type {number} */
    this.numberOfValuesWithKey = this.numberOfValues + (defn.keyed ? 1 : 0);

    /** @type {Set<MultiBindingKey>} */
    this.active = new Set();
    /** @type {Map<MultiBindingKey, readonly any[]>} */
    this.initial = new Map();
    /** @type {Map<MultiBindingKey, any[]> | null} */
    this.oldValues = /** @type {MultiPropertyDefinition} */(defn).oldValues
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
      // event: [label] type callback
      case declFlags.multi | declFlags.shorthand | declFlags.label:
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
    let { element } = this;
    let sorted = this.declarations;
    let active = new Set(this.active);
    /** @type {Set<string | Name | null>} */
    let unset = new Set();

    /**
     * @typedef {SparseArray<K extends string ? K : null>} KeyedSparseArray
     */

    /** @type {Map<string | Name | null, KeyedSparseArray>} */
    let valueMap = new Map();
    let getValueList =
    /**
     * 
     * @param {string | Name | null} key 
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

    /** @type {Set<string | Name | null>} */
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
              let key = /** @type {string | Name} */(values[0]);

              let idx = Name.is(key) ? 1 : 0;
              if(values[1] === KEYWORD_UNSET) {
                if(key === '*') {
                  active = new Set(this.active);
                  break loop;
                }
                else {
                  unset.add(key);
                  break;
                }
              } else if(unset.has(key)) {
                break;
              }

              this.#bookkeep(active, key);
              if(dirty) dirtyKeys.add(key);
              let valueList = getValueList(key, this.numberOfValuesWithKey);
              for(let i = 0; idx < values.length; i++, idx++) {
                if(valueList.empty(i))
                  valueList.set(i, values[idx]);
              }
              //let allValues = this.#appendToValues(key, values);
              //yield [allValues, dirty];
              //if(this.oldValues)
              //  this.oldValues.set(key, allValues.slice(1, this.numberOfValues + 1));
            }
            //break loop;
            break;
          }
          // event: [label] type callback, [another-label] type callback
          case declFlags.multi | declFlags.shorthand | declFlags.label: {
            for(let values of /** @type {[K, ...any[]][]} */(computedValue)) {
              let key = /** @type {string | Name} */(values[0]);
              if(!Name.is(key)) {
                key = Name.for('corset.default.' + key);
              }
              else
                values = /** @type {[K, ...any[]]} */(values.slice(1));

              this.#bookkeep(active, key);
              let valueList = getValueList(key, this.numberOfValues);
              for(let i = 0; i < values.length; i++) {
                if(valueList.empty(i))
                  valueList.set(i, values[i]);
              }
              if(dirty) dirtyKeys.add(key);
              /*let allValues = this.#appendToValues(key, values);
              yield [allValues, dirty];
              if(this.oldValues)
                this.oldValues.set(key, allValues.slice(0, this.numberOfValues + 1));*/
            }
            //break loop;
            break;
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
            console.warn('Keyed properties have been deprecated.');
            let key = computedValue[0];
            this.#bookkeep(active, key);
            let allValues = this.#appendToValues(key, computedValue);
            yield [allValues, dirty];
            if(this.oldValues) this.oldValues.set(key, allValues.slice(1, this.numberOfValues + 1));
            break;
          }

          /*
          case declFlags.longhand | declFlags.label: {
            break
          }
          */
          
          // attr-value[type]: "text"
          case declFlags.longhand | declFlags.keyed:
          // event-once: [name] true;
          case declFlags.longhand | declFlags.label:
          // each-items: ${items};
          case declFlags.longhand: {
            if(declaration.flags === (declFlags.longhand | declFlags.keyed)) {
              console.warn('Keyed properties have been deprecated.');
            }

            let keyed = !!(declaration.flags & declFlags.keyed);
            let label = !!(declaration.flags & declFlags.label);
            let hasLabel = label && Name.is(computedValue[0]);
            /** @type {number} */
            let numOfValues = this.numberOfValues;
            /** @type {string | Name | null} */
            let key = keyed ? computedValue[0] : label ? hasLabel ? computedValue[0] : Name.for('corset.default.' + computedValue[0]) : null;
            /** @type {any} */
            let propValue = keyed ? computedValue[0] : computedValue[1];

            this.#bookkeep(active, key);
            let valueList = getValueList(key, numOfValues);
            if(!hasLabel && valueList.empty(0))
              valueList.set(0, computedValue[0]);
            if(valueList.empty(compute.index)) {
              valueList.set(compute.index, propValue);

              // if(valueList.full()) {
              //   if(this.oldValues) this.oldValues.set(key, Array.from(valueList));
              //   if(key) valueList.unshift(key);
              //   yield [
              //     /** @type {[K, ...any[]]} */(/** @type {unknown} */(valueList)),
              //     dirty || dirtyKeys.has(key)
              //   ];
              //   valueMap.delete(key);
              //   dirtyKeys.delete(key);
              //   break;
              // }
            }

            if(dirty) {
              dirtyKeys.add(key);
            }

            break;
          }
          // class-toggle[disabled]: true
          case declFlags.keyed | declFlags.multi: {
            console.warn('Keyed properties have been deprecated.');
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
      if(this.oldValues) {
        let current = this.oldValues.get(key);
        this.oldValues.set(key, values.slice(1));
        if(current) {
          values.push(...current);
        }
      }
      // if(key) {
      //   if(Label.isLabel(key))
      //     values.unshift(this.labelKey?.get(/* @type {Label} */(key)));
      //   else if(values.empty(0))
      //     values[0] = key;
      // }
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
   * @param {string | Name | MountedBehaviorType} key 
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
   * @param {Set<MultiBindingKey>} active 
   * @param {MultiBindingKey} key 
   */
  #bookkeep(active, key) {
    active.delete(key);
    if(key !== null) this.#setInitials(key);
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
    if(!Name.is(key)) append.push(key);
    let i = append.length + values.length;
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