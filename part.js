
class Part {
  constructor(selector, value) {
    this.selector = selector;
    this.value = value;
  }

  getValue(node, values) {
    return this.value.extract(values, node);
  }
}

export class TextPart extends Part {
  set(node, values) {
    node.textContent = this.getValue(node, values);
  }
}