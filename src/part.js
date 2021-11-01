
class Part {
  constructor(selector, value) {
    this.selector = selector;
    this.value = value;
    this.nodeCache = new WeakMap();
  }

  set(node, values) {
    let newValue = this.getValue(node, values);
    if(this.nodeCache.has(node) && this.nodeCache.get(node) === newValue) {
      return;
    }
    this.nodeCache.set(node, newValue);
    this.update(node, values);
  }

  getValue(node, values) {
    return this.value.extract(values, node);
  }
}

export class TextPart extends Part {
  update(node, values) {
    node.textContent = this.getValue(node, values);
  }
}

export class EventPart extends Part {
  constructor(selector, name, value) {
    super(selector, value);
    this.eventName = name;
  }

  update(node, values) {
    node.addEventListener(this.eventName, this.value.extract(values));
  }
}

export class ClassTogglePart extends Part {
  constructor(selector, name, value) {
    super(selector, value);
    this.className = name;
  }

  update(node, values) {
    node.classList[this.getValue(node, values) ? 'add' : 'remove'](this.className);
  }
}