// @ts-check

/**
 * 
 * @typedef {object} WasmParserInterface
 * @property {() => number} get_tag
 * @property {(n: number) => 1 | 0} parse
 * @property {(n: number) => number} reset
 * @property {{ buffer: ArrayBuffer }} memory
 * 
 * @typedef {object} RawStringTemplate
 * @property {readonly string[] | ArrayLike<string>} raw
 * 
 * @typedef {WebAssembly.Exports & WasmParserInterface} WasmParser
*/

const INSERTION = 'ins()';

const wasm = await WebAssembly.instantiateStreaming(
  fetch(new URL('./main.wasm', import.meta.url).toString())
);

const instance = wasm.instance;

const exports = /** @type {WasmParser} */ (instance.exports);

const $get_tag = exports.get_tag;
const $memory = exports.memory;
const $parse = exports.parse;
const $reset = exports.reset;

export const mem8 = new Uint8Array($memory.buffer);
export const mem32 = new Uint32Array($memory.buffer);

/** @type {Uint8Array} The array of the heap */
export let heap8;
/** @type {Uint32Array} */
export let heap32;
/** @type {Uint8Array} */
export let data8;

const enc = new TextEncoder();
const dec = new TextDecoder();

/**
 * 
 * @param {Uint8Array} buffer 
 * @param {number} start 
 * @param {number} end 
 * @returns 
 */
const readFromBuffer = (buffer, start, end) => dec.decode(buffer.slice(start, end));

/** @type {number} - The length of the source */
let len;

/* HASH function
const hash = (str) => {
    let h = 5381;
    for(let i = 0; i < str.length; i++) {
        let c = str[i];
      h = ((h << 5) + h) + c.charCodeAt(0);
    }
    return h
};
*/

/**
 * Parses sources from a tagged template
 * @param {RawStringTemplate} source 
 * @param {any[]} values
 * @returns {void}
 */
export function parse(source, values) {
  let holes = values.map(_ => INSERTION);
  let raw = String.raw(source, ...holes);

  const bytes = enc.encode(raw);
  len = bytes.byteLength;
  const dataPtr = $reset(len);
  mem8.set(bytes, dataPtr);
  data8 = mem8.subarray(dataPtr);

  const tagPtr = $get_tag();
  heap8 = mem8.subarray(tagPtr);
  heap32 = mem32.subarray(tagPtr >> 2);
}

/**
 * Parses until the next tag, returning 1 if parsing should continue
 * @returns {0|1}
 */
export const next = () => $parse(len);

/**
 * Reading a string from the buffer.
 * @param {number} start 
 * @param {number} end 
 * @returns {string}
 */
export const readString = (start, end) => {
  return readFromBuffer(data8, start, end);
};

/**
 * Reads the property name.
 * @returns {string}
 */
export const readProperty = () => readFromBuffer(data8, heap32[1], heap32[2]);

/**
 * Reads the number of values in the property value.
 * @returns {number}
 */
export const readNumberOfValues = () => heap32[3];

/**
 * Gets the first value pointer in the property.
 * @returns {number}
 */
export const readFirstValuePointer = () => heap32[4];