// @ts-check

/**
 * @typedef {import('./types').HostElement} HostElement
 */

/**
 * @param {HostElement} host
 */
function getDocument(host) {
  return host.ownerDocument || host;
}

/**
 * @param {HostElement} host
 * @param {HTMLTemplateElement} template
 * @returns {DocumentFragment}
 */
export function cloneTemplate(host, template) {
  return getDocument(host).importNode(template.content, true);
}

/**
 * @param {HostElement} host
 * @param {SVGElement} element
 * @returns {DocumentFragment}
 */
export function cloneSVG(host, element) {
  let g = element.firstElementChild?.firstElementChild?.cloneNode(true);
  let frag = getDocument(host).createDocumentFragment();
  while(g?.firstChild) {
    frag.append(g.firstChild);
  }
  return frag;
}

/**
 * @param {HTMLTemplateElement | SVGElement} template
 * @returns {(host: HostElement, a: any) => DocumentFragment}
 */
export function createCloneElement(template) {
  return template.nodeName === 'TEMPLATE' ? cloneTemplate : cloneSVG;
}

/**
 * @param {HostElement} host
 * @param {HTMLTemplateElement | SVGElement} template
 */
export function cloneElement(host, template) {
  return createCloneElement(template)(host, template);
}