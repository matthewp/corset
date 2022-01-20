// @ts-check

import { flags } from './bindings.js';
import { EachInstance } from './each.js';
import { NO_VALUE } from './compute.js';
import { datasetPropKey } from './custom-prop.js';
import { mount } from './mount.js';

/**
 * @typedef {import('./bindings').Bindings} Bindings
 * @typedef {import('./mount').Mountpoint} Mountpoint
 */

/** @type {WeakMap<Element, EachInstance>} */
const eachInstances = new WeakMap();

/** @type {WeakMap<Element, Mountpoint>} */
const mountPoints = new WeakMap();

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
        element.dataset[datasetPropKey(propertyName)] = '';
        element[Symbol.for(propertyName)] = compute.get();
      }
    }
  }

  if(bindings.flags & flags.classToggle) {
    for(let compute of bindings.classToggle.changes(values)) {
      element.classList.toggle(compute.key(), compute.get());
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
    let key = bindings.flags & flags.eachKey ? bindings.eachKey.compute(values) : '';
    
    if(!inst || inst.template !== template) {
      inst = new EachInstance(element, template, key);
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
    for(let value of bindings.attrValue.changes(values)) {
      let key = value.key();
      let toggle = bindings.attrToggle.get(key).compute(values);
      if(toggle)
        element.setAttribute(key, value.get());
      else
        element.removeAttribute(key);
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

  if(bindings.flags & flags.mount) {
    const compute = bindings.mount;
    if(compute.dirty(values)) {
      const lastValue = compute.lastValue;
      const value = bindings.mount.get();
      if(lastValue !== NO_VALUE) {
        mountPoints.get(element).unmount();
      }
      if(value !== null) {
        let mountpoint = mount(/** @type {HTMLElement} */(element), value);
        mountPoints.set(element, mountpoint);
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

/**
 * 
 * @param {Element} element 
 * @param {Bindings} bindings 
 */
function unmount(element, bindings) {
  if(bindings.flags & flags.mount) {
    let compute = bindings.mount;
    if(compute.currentValue !== NO_VALUE) {
      mountPoints.get(element).unmount();
    }
  }

  if(bindings.flags & flags.event) {
    for(let compute of bindings.event.values()) {
      if(compute.currentValue !== NO_VALUE) {
        element.removeEventListener(compute.item(0), compute.item(1));
      }
    }
  }
}

/**
 * @param {Map<Element, Bindings>} allBindings
 */
export function unmountRoot(allBindings) {
  for(let [element, bindings] of allBindings) {
    unmount(element, bindings);
  }
}