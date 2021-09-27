
class Root {
  constructor(root, template) {
    this.root = root;
    this.parts = template.parts;
    //this.bindings = new WeakMap();
  }
  update(values) {
    for(let part of this.parts) {
      for(let el of this.root.querySelectorAll(part.selector)) {
        part.set(el, values);
      }
    }
  }
}

export class Template {
  constructor(parts) {
    this.parts = parts;
  }
}

export class TemplateResult {
  constructor(template, values) {
    this.roots = new WeakMap();
    this.template = template;
    this.values = values;
  }

  update(root) {
    let binding;
    if(this.roots.has(root)) {
      binding = this.roots.get(root);
    } else {
      binding = new Root(root, this.template);
      this.roots.set(root, binding);
    }
    binding.update(this.values);
  }
}