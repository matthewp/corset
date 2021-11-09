// @ts-check
/** @typedef {import('./rule').Rule} Rule */
/** @typedef {import('./declaration').Declaration} Declaration */

export class Binding {
  /**
   * @param {Element} element
   * @param {Element} rootElement
   */
  constructor(element, rootElement) {
    /** @type {Element} */
    this.element = element;
    /** @type {Element} */
    this.rootElement = rootElement;
    /** @type {Declaration[]} */
    this.declarations = [];
    /** @type {any} */
    this.initialValue = null;
    /** @type {any} */
    this.currentValue = null;
  }
  /**
   * @param {Declaration} declaration 
   */
  addDeclaration(declaration) {
    this.declarations.push(declaration);
    if(this.declarations.length === 1) {
      this.initialValue = declaration.property.read(this.element, declaration.args);
    }
  }
  /** @param {any[]} values */
  set(values) {
    let element = this.element;
    let declarations = this.declarations;
    let i = declarations.length;
    let declaration;
    while(i > 0) {
      i--;
      declaration = declarations[i];
      if(element.matches(declaration.rule.selector)) {
        let newValue = declaration.property.getValue(this, values, declaration.args);
        return this.setValue(declaration, newValue);
      }
    }
    // No declarations match, reset to the initial value.
    return this.setValue(declaration, this.initialValue);
  }
  /**
   * @param {Declaration} declaration 
   * @param {any} newValue 
   * @returns {Boolean}
   */
  setValue(declaration, newValue) {
    if(this.currentValue !== newValue) {
      this.currentValue = newValue;
      declaration.property.set(this, newValue, declaration.args);
      return declaration.property.invalidates;
    }
    return false;
  }
}