
class Part {
  constructor(selector) {
    this.selector = selector;
  }

  getValue(values) {
    debugger;
    return 99;
  }
}

export class TextPart extends Part {
  set(node, values) {
    node.textContent = this.getValue(values);
  }
}