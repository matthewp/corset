// @ts-check

import { flags } from './property.js';
import { EachInstance } from './each.js';
import { datasetPropKey } from './custom-prop.js';
import { Mountpoint } from './mount.js';
import { lookup } from './scope.js';
import { storePropName, storeDataName, storeDataPropName, Store } from './store.js';

/**
 * @typedef {import('./binding').Binding} Binding
 * @typedef {import('./bindings').Bindings} Bindings
 * @typedef {import('./types').MountedBehaviorType} MountedBehaviorType
 * @typedef {import('./changeset').Changeset} Changeset
 * @typedef {import('./multi-binding').MultiBinding<string>} KeyedMultiBinding
 * @typedef {import('./multi-binding').MultiBinding<any[]>} ArrayMultiBinding
 * @typedef {import('./multi-binding').MultiBinding<MountedBehaviorType>} BehaviorMultiBinding
 * @typedef {import('./sheet').Root} Root
 */

/** @type {WeakMap<Element, EachInstance>} */
const eachInstances = new WeakMap();

/** @type {WeakMap<Element, Map<MountedBehaviorType, Mountpoint>>} */
const mountPoints = new WeakMap();

/**
 * 
 * @param {Element} element 
 * @param {Bindings} bindings 
 * @param {Root} root
 * @param {Changeset} changeset
 * @returns {boolean}
 */
function render(element, bindings, root, changeset) {
  let invalid = false;
  let bflags = bindings.flags;

  if(bflags & flags.storeRoot) {
    if(!(element instanceof HTMLElement)) {
      throw new Error('Stores cannot be used on non-HTML elements.');
    }

    let binding = /** @type {Binding} */(bindings.storeRoot);
    if(binding.dirty(changeset)) {
      let oldValue = binding.value;
      let storeName = binding.update(changeset);
      if(storeName) {
        element.dataset[storeDataPropName(storeName)] = '';
        let map = new Store(root);
        /** @type {any} */
        (element)[Symbol.for(storePropName(storeName))] = map;
        root.mount?.context?.stores.set(storeName, map);
      } else {
        delete element.dataset[storeDataPropName(oldValue)];
        delete /** @type {any} */(element)[Symbol.for(storePropName(oldValue))];
        root.mount?.context?.stores.delete(oldValue);
      }
      invalid = true;
    }
  }

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

  if(bflags & flags.storeSet) {
    let binding = /** @type {Binding} */(bindings.storeSet);
    if(binding.dirty(changeset)) {
      let args = binding.update(changeset);
      if(args) {
        let [storeName, key, value] = args;
        let dataName = storeDataName(storeName);
        let map = lookup(element, dataName, `[${dataName}]`, storePropName(storeName));
        map?.set(key, value);
      }
      invalid = true;
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
    if(binding.dirty(changeset)) {
      let values = binding.update(changeset);
      if(Array.isArray(values)) values = values.join('');
      element.textContent = values;
    }
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

  if(bflags & flags.behavior) {
    let binding = /** @type {BehaviorMultiBinding} */(bindings.behavior);
    for(let [Behavior, props, OldBehavior] of binding.changes(changeset)) {
      let hasOldValue = OldBehavior !== undefined;
      let sameBehavior = hasOldValue && OldBehavior === Behavior;

      /** @type {Map<MountedBehaviorType, Mountpoint>} */
      let map;
      if(mountPoints.has(element))
        map = /** @type {Map<MountedBehaviorType, Mountpoint>} */(mountPoints.get(element));
      else {
        map = new Map();
        mountPoints.set(element, map);
      }

      if(hasOldValue || sameBehavior) {
        let mp = /** @type {Mountpoint} */(map.get(OldBehavior));
        if(sameBehavior) mp.update();
        else mp.unmount();
      }
      if(!sameBehavior && Behavior !== null) {
        let mountpoint = new Mountpoint(/** @type {HTMLElement} */(element), Behavior, props);
        mountpoint.update();
        map.set(Behavior, mountpoint);
      }
    }
  }

  // Events last, does not affect the cascade.
  if(bflags & flags.event) {
    let binding = /** @type {KeyedMultiBinding} */(bindings.event);
    for(let [eventName, listener, capture, once, passive, signal, _oldEventName, oldListener, oldCapture] of binding.changes(changeset)) {
      if(oldListener !== undefined)
        element.removeEventListener(eventName, root.getCallback(oldListener), oldCapture);
      if(listener)
        element.addEventListener(eventName, root.getCallback(listener), {
          capture,
          once,
          passive,
          signal
        });
    }
  }

  return invalid;
}

/**
 * @param {Map<Element, Bindings>} allBindings
 * @param {Root} root
 * @param {Changeset} changeset
 * @returns {boolean}
 */
export function renderRoot(allBindings, root, changeset) {
  let invalid = false;
  for(let [element, bindings] of allBindings) {
    if(render(element, bindings, root, changeset))
      invalid = true;
  }
  return invalid;
}

/**
 * 
 * @param {Element} element 
 * @param {Bindings} bindings 
 * @param {Root} root
 */
function unmount(element, bindings, root) {
  let bflags = bindings.flags;
  if(bflags & flags.behavior) {
    let binding = /** @type {BehaviorMultiBinding} */(bindings.behavior);
    let map = /** @type {Map<MountedBehaviorType, Mountpoint>} */(mountPoints.get(element));
    for(let [OldBehavior] of binding.current()) {
      map.get(OldBehavior)?.unmount();
    }
    // TODO allow multiple
    ///** @type {Mountpoint} */(mountPoints.get(element)).unmount();
  }

  if(bflags & flags.event) {
    let eventBinding = /** @type {KeyedMultiBinding} */(bindings.event);
    for(let [_key, eventName, listener] of eventBinding.current()) {
      element.removeEventListener(eventName, root.getCallback(listener));
    }
  }
}

/**
 * @param {Map<Element, Bindings>} allBindings
 * @param {Root} root
 */
export function unmountRoot(allBindings, root) {
  for(let [element, bindings] of allBindings) {
    unmount(element, bindings, root);
  }
}