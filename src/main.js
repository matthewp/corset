// @ts-check

/**
 * @typedef {import('./mount').Mountpoint} Mountpoint
 * @typedef {import('./mount').BehaviorContext} BehaviorContext
 * @typedef {import('./sheet').SheetWithValues} SheetWithValues
 * @typedef {import('./types').MountedBehavior} MountedBehavior
 * @typedef {import('./types').MountedBehaviorType} MountedBehaviorType
 * @typedef {import('./fn').ICorsetFunction} ICorsetFunction
 * @typedef {import('./fn').FunctionContext} FunctionContext
 */

export { 
  sheet as default,
  sheet
} from './compile.js';
export { mount, registerBehavior } from './mount.js';
export { registerCustomFunction } from './function.js';