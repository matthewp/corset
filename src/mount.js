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
 * @typedef {{}} EventListener
 * @property {(ev: Event) => any} handleEvent
 */

/**
 * 
 * @param {Mountpoint} mp 
 * @param {CallbackFunction} fn 
 * @returns {EventListener}
 */
function createListener(mp, fn) {
  return {
    /**
     * 
     * @param {Event} ev 
     * @returns {any}
     */
    handleEvent(ev) {
      let res = fn.call(mp.behavior, ev);
      mp.update();
      return res;
    }
  };
}

export class Mountpoint {
  /**
   * 
   * @param {HTMLElement} rootElement 
   * @param {MountedBehaviorType} Behavior 
   * @param {Map<string, any> | null} props
   */
  constructor(rootElement, Behavior, props) {
    /** @type {HTMLElement} */
    this.rootElement = rootElement;
    /** @type {Map<string, any> | null} */
    this.props = props;
    /** @type {MountedBehavior} */
    this.behavior = new Behavior(/** @type {never} */(props));
    /** @type {SheetWithValues | null} */
    this.bindings = null;
    /** @type {WeakMap<CallbackFunction, EventListener>} */
    this.callbacks = new WeakMap();
  }
  /**
   * 
   * @param {(...args: any[]) => any} callbackFn 
   * @returns {EventListener}
   */
  getCallback(callbackFn) {
    if(this.callbacks.has(callbackFn))
      return /** @type {EventListener} */(this.callbacks.get(callbackFn));
    let listener = createListener(this, callbackFn);
    this.callbacks.set(callbackFn, listener);
    return listener;
  }
  /**
   * 
   */
  update() {
    this.bindings = this.behavior.bind(this.props);
    this.bindings.update(this);
  }

  unmount() {
    if(this.bindings)
      this.bindings.unmount(this);
  }
}

/**
 * 
 * @param {HTMLElement} element 
 * @param {MountedBehaviorType} behavior 
 * @returns {void}
 */
export function mount(element, behavior) {
  let mp = new Mountpoint(element, behavior, null);
  mp.update();
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