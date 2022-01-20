import { ComputedValue } from './compute2.js';
import { PropertyBinding } from './property.js';

// TODO move this
import { flags } from './bindings.js';

/**
 * @typedef {import('./declaration').Declaration} Declaration
 * @typedef {import('./sheet').SheetRoot} Root
 */

const builtins = new Map([
  //['class-toggle', []
  ['class-toggle', {
    multi: true
  }]
]);

/**
 * 
 * @param {Declaration} declaration
 */
function * explode(declaration) {
  let { propertyName, args } = declaration;
  if(!builtins.has(propertyName)) {
    yield [propertyName, args];
  } else {
    const descriptor = builtins.get(propertyName);
    throw new Error(`TODO explode prop`);
  }
}

export class Bindings {
  /**
   * Create a new map of bindings
   * @param {Root} root
   * @param {Element} element 
   */
  constructor(root, element) {
    /** @type {Root} */
    this.root = root;
    /** @type {Element} */
    this.element = element;

    /** @type {number} */
    this.flags = 0;
    /** @type {Map<string, PropertyBinding>} */
    this.properties = new Map();
  }

  /**
   * Add a declaration for these bindings
   * @param {Declaration} declaration 
   * @param {any[]} values
  */
  add(declaration) {
    if(declaration.propertyName === 'class-toggle') {
      /** @type {PropertyBinding} */
      let binding;
      if(this.properties.has('class-toggle')) {
        binding = this.properties.get('class-toggle');
      } else {
        binding = new PropertyBinding(this);
        this.properties.set('class-toggle', binding);    
        this.flags |= flags.classToggle;
      }

      for(let d of declaration.sub) {
        binding.add(d);
        binding.add(declaration);
      }
    } else if(['attr-value', 'attr-toggle'], declaration.propertyName) {
      let binding;
      if(this.properties.has(declaration.propertyName)) {
        binding = this.properties.get(declaration.propertyName);
      } else {
        binding = new PropertyBinding(this);
        this.properties.set(declaration.propertyName, binding);
        this.flags |= flags.attr;
      }
      binding.add(declaration);
    } else {
      throw new Error(`Property [${declaration.propertyName}] not currently supported.`);
    }
  }
}