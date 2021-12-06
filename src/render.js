// @ts-check

import { flags } from './bindings.js';
import { EachInstance } from './each.js';
import { NO_VALUE } from './compute.js';
import { datasetKey } from './custom-prop.js';

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
        if(!(element instanceof HTMLElement)) {
          throw new Error('Custom properties cannot be used on non-HTML elements.');
        }
        element.dataset[datasetKey(propertyName)] = '';
        element[Symbol.for(propertyName)] = compute.get();
      }
    }
  }

  if(bindings.flags & flags.classToggle) {
    for(let compute of bindings.classToggle.values()) {
      if(compute.dirty(values)) {
        element.classList.toggle(compute.item(0), compute.item(1));
        invalid = true;
      }
    }
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
    let scope = bindings.flags & flags.eachScope ? bindings.eachScope.compute(values) : '--scope';
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

  if(bindings.flags & flags.attach && bindings.attachTemplate.dirty(values)) {
    /** @type {HTMLTemplateElement} */
    let result = bindings.attachTemplate.get();
    let frag = element.ownerDocument.importNode(result.content, true);
    element.replaceChildren(frag);
    invalid = true;
  }

  if(bindings.flags & flags.attr) {
    for(let compute of bindings.attr.values()) {
      if(compute.dirty(values)) {
        element.setAttribute(compute.item(0), compute.item(1));
        invalid = true;
      }
    }
  }

  if(bindings.flags & flags.attrToggle) {
    for(let compute of bindings.attrToggle.values()) {
      if(compute.dirty(values)) {
        let value = compute.item(1);
        if(value === false)
          element.removeAttribute(compute.item(0));
        else
          element.setAttribute(compute.item(0), value === true ? '' : value);
      }
    }
  }

  if(bindings.flags & flags.text && bindings.text.dirty(values)) {
    element.textContent = bindings.text.get();
  }

  if(bindings.flags & flags.prop) {
    for(let compute of bindings.prop.values()) {
      if(compute.dirty(values)) {
        element[compute.item(0)] = compute.item(1);
      }
    }
  }

  if(bindings.flags & flags.data) {
    for(let compute of bindings.data.values()) {
      if(compute.dirty(values)) {
        /** @type {any} */
        let el = element;
        el.dataset[compute.item(0)] = compute.item(1);
      }
    }
  }

  // Events last, does not affect the cascade.
  if(bindings.flags & flags.event) {
    for(let compute of bindings.event.values()) {
      if(compute.dirty(values)) {
        const lastValue = compute.lastValue;
        if(lastValue !== NO_VALUE) {
          element.removeEventListener(lastValue[0], lastValue[1]);
        }
        element.addEventListener(compute.item(0), compute.item(1));
      }
    }
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