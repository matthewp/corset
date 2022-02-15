// @ts-check

import { flags } from './property.js';
import { EachInstance } from './each.js';
import { datasetPropKey } from './custom-prop.js';
import { mount } from './mount.js';
import { NO_VALUE } from './value.js';

/**
 * @typedef {import('./binding').Binding} Binding
 * @typedef {import('./bindings').Bindings} Bindings
 * @typedef {import('./changeset').Changeset} Changeset
 * @typedef {import('./multi-binding').MultiBinding<string>} KeyedMultiBinding
 * @typedef {import('./multi-binding').MultiBinding<any[]>} ArrayMultiBinding
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
 * @param {Changeset} changeset
 * @returns {boolean}
 */
function render(element, bindings, changeset) {
  let invalid = false;
  let bflags = bindings.flags;

  if(bflags & flags.custom) {
    if(!(element instanceof HTMLElement)) {
      throw new Error('Custom properties cannot be used on non-HTML elements.');
    }

    for(let [propertyName, binding] of bindings.custom) {
      if(binding.dirty(changeset)) {
        binding.update(changeset);
        let value = binding.getList();
        element.dataset[datasetPropKey(propertyName)] = '';
        /** @type {any} */
        (element)[Symbol.for(propertyName)] = {
          value,
          compute: binding.compute
        };
      }
    }
  }

  if(bindings.flags & flags.classToggle) {
    let binding = /** @type {KeyedMultiBinding} */(bindings.classToggle);
    for(let [className, toggle] of binding.changes(changeset)) {
      element.classList.toggle(className, toggle);
      invalid = true;
    }
  }

  if(bflags & flags.each) {
    let binding = /** @type {ArrayMultiBinding} */(bindings.each);
    for(let [items, template, key] of binding.values(changeset)) {
      /** @type {EachInstance | undefined} */
      let inst;
      if(eachInstances.has(element)) {
        inst = /** @type {EachInstance} */(eachInstances.get(element));
      }

      if(!inst || inst.template !== template) {
        inst = new EachInstance(element, template, key);
        eachInstances.set(element, inst);
      }
      return inst.set(items);
    }
  }

  if(bflags & flags.attach) {
    let binding = /** @type {Binding} */(bindings.attachTemplate);
    if(binding.dirty(changeset)) {
      /** @type {HTMLTemplateElement} */
      let result = binding.update(changeset);
      let frag = element.ownerDocument.importNode(result.content, true);
      element.replaceChildren(frag);
      invalid = true;
    }
  }

  if(bflags & flags.attr) {
    for(let [key, value, toggle] of /** @type {KeyedMultiBinding} */(bindings.attr).changes(changeset)) {
      if(toggle)
        element.setAttribute(key, value);
      else
        element.removeAttribute(key);
      invalid = true;
    }
  }

  if(bflags & flags.text) {
    let binding = /** @type {Binding} */(bindings.text);
    if(binding.dirty(changeset))
      element.textContent = binding.update(changeset);
  }

  if(bflags & flags.prop) {
    let binding = /** @type {KeyedMultiBinding} */(bindings.prop);
    for(let [key, value] of binding.changes(changeset)) {
      /** @type {any} */(element)[key] = value;
    }
  }

  if(bflags & flags.data) {
    let binding = /** @type {KeyedMultiBinding} */(bindings.data);
    for(let [prop, value] of binding.changes(changeset)) {
      /** @type {HTMLElement} */
      (element).dataset[prop] = value;
    }
  }

  if(bflags & flags.mount) {
    let binding = /** @type {Binding} */(bindings.mount);
    if(binding.dirty(changeset)) {
      let hasExisingValue = binding.hasValue();
      let value = binding.update(changeset);
      if(hasExisingValue) {
        let mp = /** @type {Mountpoint} */(mountPoints.get(element));
        mp.unmount();
      }
      if(value !== null) {
        let mountpoint = mount(/** @type {HTMLElement} */(element), value);
        mountPoints.set(element, mountpoint);
      }
    }
  }

  // Events last, does not affect the cascade.
  if(bflags & flags.event) {
    let binding = /** @type {KeyedMultiBinding} */(bindings.event);
    for(let [eventName, listener, oldListener] of binding.changes(changeset)) {
      if(oldListener !== undefined) {
        element.removeEventListener(eventName, oldListener);
      }
      element.addEventListener(eventName, listener);
    }
  }

  return invalid;
}

/**
 * @param {Map<Element, Bindings>} allBindings
 * @param {Changeset} changeset
 * @returns {boolean}
 */
export function renderRoot(allBindings, changeset) {
  let invalid = false;
  for(let [element, bindings] of allBindings) {
    if(render(element, bindings, changeset))
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
  let bflags = bindings.flags;
  if(bflags & flags.mount) {
    let binding = /** @type {Binding} */(bindings.mount);
    if(binding.hasValue()) {
      let mp = /** @type {Mountpoint} */(mountPoints.get(element));
      mp.unmount();
    }
  }

  if(bflags & flags.event) {
    let eventBinding = /** @type {KeyedMultiBinding} */(bindings.event);
    for(let [eventName, listener] of eventBinding.current()) {
      element.removeEventListener(eventName, listener);
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