/**
 * @typedef {import('./sheet').SheetWithValues} SheetWithValues
 * @typedef {Record<string, any>} State 
 * @typedef {(state: State) => SheetWithValues} UpdaterFn
*/

/**
 * 
 * @param {Mountpoint} mountpoint 
 * @returns {State}
 */
function createState(mountpoint) {
  return new Proxy(Object.create(null), {
    set(target, key, value, receiver) {
      Reflect.set(target, key, value, receiver);
      mountpoint.update();
      return true;
    }
  });
}

export class Mountpoint {
  /**
   * 
   * @param {HTMLElement} rootElement 
   * @param {UpdaterFn} updater 
   */
  constructor(rootElement, updater) {
    /** @type {HTMLElement} */
    this.rootElement = rootElement;
    /** @type {UpdaterFn} */
    this.updater = updater;
    /** @type {State} */
    this.state = createState(this);
    /** @type {SheetWithValues | null} */
    this.bindings = null;
  }

  update() {
    this.bindings = this.updater(this.state);
    this.bindings.update(this.rootElement);
  }

  unmount() {
    this.bindings.unmount(this.rootElement);
  }
}

/**
 * 
 * @param {HTMLElement} element 
 * @param {UpdaterFn} updater 
 * @returns {Mountpoint}
 */
export function mount(element, updater) {
  let mp = new Mountpoint(element, updater);
  mp.update();
  return mp;
}

