
/**
 * Takes a custom property name like --my-prop and makes it 
 * PascalCase like MyProp for use with dataset.
 * @param {string} propertyName
 * @returns {string}
 */
export function pascalCase(propertyName) {
  return propertyName.replace(/-?-([a-zA-Z])/g, (_whole, letter) => {
    return letter.toUpperCase();
  });
}

/**
 * Creates a key for dataset for looking up a key
 * @param {string} keyName
 * @returns {string}
 */
 export function datasetKey(propertyName) {
  return 'corset' + pascalCase(propertyName);
}

/**
 * Creates a key for dataset for looking up custom properties
 * @param {string} propertyName 
 * @returns {string}
 */
export function datasetPropKey(propertyName) {
  return 'corsetProp' + pascalCase(propertyName);
}