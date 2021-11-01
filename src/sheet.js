
class Root {
  constructor(root, sheet) {
    this.root = root;
    this.selectors = sheet.selectors;
  }
  update(values) {
    let root = this.root;
    for(let [selector, parts] of this.selectors) {
      for(let el of root.querySelectorAll(selector)) {
        for(let part of parts) {
          part.set(el, values);
        }
      }
    }
  }
}

export class Sheet {
  constructor() {
    this.selectors = new Map();
  }
  getOrCreateSelector(selector) {
    let parts = this.selectors.get(selector);
    if(parts === undefined) {
      parts = [];
      this.selectors.set(selector, parts);
    }
    return parts;
  }
  addPart(part) {
    this.getOrCreateSelector(part.selector).push(part);
  }
}

export class BindingResult {
  constructor(sheet, values) {
    this.roots = new WeakMap();
    this.sheet = sheet;
    this.values = values;
  }

  update(root) {
    let binding;
    if(this.roots.has(root)) {
      binding = this.roots.get(root);
    } else {
      binding = new Root(root, this.sheet);
      this.roots.set(root, binding);
    }
    binding.update(this.values);
  }
}