// @ts-check

/**
 * @typedef {import('./mount').Mountpoint} Mountpoint
 * @typedef {import('./mount').BehaviorContext} BehaviorContext
 * @typedef {import('./sheet').SheetWithValues} SheetWithValues
 * @typedef {import('./types').MountedBehavior} MountedBehavior
 * @typedef {import('./fn').ICorsetFunction} ICorsetFunction
 */

export { 
  sheet as default,
  sheet
} from './compile.js';
export { mount, registerBehavior } from './mount.js';
export { registerCustomFunction } from './function.js';