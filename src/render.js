// @ts-check

import { flags } from './bindings.js';
import { EachInstance } from './each.js';
import { NO_VALUE } from './compute.js';

/**
 * @typedef {import('./bindings').Bindings} Bindings
 */

/** @type {WeakMap<Element, EachInstance>} */
const eachInstances = new WeakMap();

/**
 * 
 * @param {Element} element 
 * @param {Bindings} bindings 
 * @param {any[]} values
 * @returns {boolean}
 */
function render(element, bindings, values) {
  let invalid = false;

  if(bindings.flags & flags.custom) {
    for(let [propertyName, compute] of bindings.custom) {
      if(compute.dirty(values)) {
        let name = propertyName.replace(/-?-([a-zA-Z])/, (_whole, letter) => {
          return letter.toUpperCase();
        });
        if(!(element instanceof HTMLElement)) {
          throw new Error('Custom properties cannot be used on non-HTML elements.');
        }
        element.dataset['dslProp' + name] = '';
        element[Symbol.for(propertyName)] = compute.get();
      }
    }
  }

  if(bindings.flags & flags.classToggle && bindings.classToggle.dirty(values)) {
    element.classList.toggle(bindings.classToggle.item(0), bindings.classToggle.item(1));
    invalid = true;
  }

  if(bindings.flags & flags.each) {
    /** @type {EachInstance} */
    let inst;
    if(eachInstances.has(element)) {
      inst = eachInstances.get(element);
    }

    /** @type {any[]} */
    let items = bindings.eachItems.compute(values);
    /** @type {HTMLTemplateElement} */
    let template = bindings.eachTemplate.compute(values);
    /** @type {string} */
    let scope = bindings.eachScope.compute(values);
    /** @type {string} */
    let indexVar = bindings.flags & flags.eachIndex ? bindings.eachIndex.compute(values) : '--index';
    /** @type {string} */
    let key = bindings.flags & flags.eachKey ? bindings.eachKey.compute(values) : '';
    
    if(!inst || inst.template !== template || inst.scopeName !== scope) {
      inst = new EachInstance(element, template, key, scope, indexVar);
      eachInstances.set(element, inst);
    }
    return inst.set(items);
  }

  if(bindings.flags & flags.attr && bindings.attr.dirty(values)) {
    element.setAttribute(bindings.attr.item(0), bindings.attr.item(1));
    invalid = true;
  }

  if(bindings.flags & flags.attrToggle && bindings.attrToggle.dirty(values)) {
    let value = bindings.attrToggle.item(1);
    element.setAttribute(bindings.attrToggle.item(0), value === true ? '' : value);
  }

  if(bindings.flags & flags.text && bindings.text.dirty(values)) {
    element.textContent = bindings.text.get();
  }

  if(bindings.flags & flags.prop && bindings.prop.dirty(values)) {
    element[bindings.prop.item(0)] = bindings.prop.item(1);
  }

  if(bindings.flags & flags.data && bindings.data.dirty(values)) {
    /** @type {any} */
    let el = element;
    el.dataset[bindings.data.item(0)] = bindings.data.item(1);
  }

  // Events last, does not affect the cascade.
  if(bindings.flags & flags.event && bindings.event.dirty(values)) {
    const lastValue = bindings.event.lastValue;
    if(lastValue !== NO_VALUE) {
      element.removeEventListener(lastValue[0], lastValue[1]);
    }
    element.addEventListener(bindings.event.item(0), bindings.event.item(1));
  }

  return invalid;
}

/**
 * @param {Map<Element, Bindings>} allBindings
 * @param {any[]} values
 * @returns {boolean}
 */
export function renderRoot(allBindings, values) {
  let invalid = false;
  for(let [element, bindings] of allBindings) {
    if(render(element, bindings, values))
      invalid = true;
  }
  return invalid;
}