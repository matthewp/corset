// @ts-check

/**
 * @typedef {import('./sheet').SheetWithValues} SheetWithValues
 * @typedef {Record<string, any>} State 
 * @typedef {import('./types').MountedBehavior} MountedBehavior
 * @typedef {import('./types').MountedBehaviorType} MountedBehaviorType
*/

/** @type {Map<string, MountedBehaviorType>} */
export let registry = new Map();

/**
 * @typedef {(...args: any[]) => any} CallbackFunction
 * @typedef {(...args: any[]) => Promise<any>} AsyncCallbackFunction
 */

/**
 * 
 * @param {Mountpoint} mp 
 * @param {CallbackFunction} fn
 * @param {...any[]} args
 * @returns {any}
 */
function scopedCallback(mp, fn, ...args) {
  let res = fn.call(mp.behavior, ...args);
  mp.update();
  return res;
}

/**
 * 
 * @param {Mountpoint} mp 
 */
export function BehaviorContext(mp) {
  /** @type {Element | Document | ShadowRoot} */
  this.element = mp.rootElement;
  /** @type {() => void} */
  this.rebind = mp.update.bind(mp);
  /** @type {Map<string, Map<string, any>>} */
  this.stores = new Map();
}

export class Mountpoint {
  /**
   * 
   * @param {HTMLElement | Document | ShadowRoot} rootElement 
   * @param {MountedBehaviorType} Behavior 
   * @param {Map<string, any> | undefined} props
   */
  constructor(rootElement, Behavior, props) {
    /** @type {HTMLElement | Document | ShadowRoot} */
    this.rootElement = rootElement;
    /** @type {Map<string, any> | null} */
    this.props = props || null;
    /** @type {BehaviorContext} */
    this.context = new BehaviorContext(this);
    /** @type {MountedBehavior} */
    this.behavior = new Behavior(/** @type {never} */(props), this.context);
    /** @type {SheetWithValues | null} */
    this.bindings = null;
    /** @type {WeakMap<CallbackFunction, CallbackFunction>} */
    this.callbacks = new WeakMap();
    /** @type {Mountpoint | null} */
    this.parent = null;
  }
  /**
   * 
   * @param {(...args: any[]) => any} callbackFn 
   * @returns {CallbackFunction}
   */
  getCallback(callbackFn) {
    if(this.callbacks.has(callbackFn))
      return /** @type {CallbackFunction} */(this.callbacks.get(callbackFn));
    let listener = scopedCallback.bind(null, this, callbackFn);
    this.callbacks.set(callbackFn, listener);
    return listener;
  }
  /**
   * @returns {boolean}
   */
  update() {
    this.bindings = this.behavior.bind(this.props, this.context);
    return this.bindings.update(this);
  }

  unmount() {
    if(this.bindings)
      this.bindings.unmount(this);
  }
}

/**
 * 
 * @param {HTMLElement | Document | ShadowRoot} element 
 * @param {MountedBehaviorType} behavior
 * @param {Map<string, any>} [props]
 * @returns {Mountpoint}
 */
export function mount(element, behavior, props) {
  let mp = new Mountpoint(element, behavior, props);
  mp.update();
  return mp;
}

/**
 * 
 * @param {string} name 
 * @param {MountedBehaviorType} behavior
 * @returns {void} 
 */
export function registerBehavior(name, behavior) {
  registry.set(name, behavior);
}