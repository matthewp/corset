
export class Selector {
  constructor(selector) {
    this.selector = selector;
    this.parts = [];
  }
}

class Part {
  constructor(selector, value) {
    this.selector = selector;
    this.value = value;
  }

  update(value, data) {
    if(value !== this.value) {
      this.value = value;
      this.set(value, data);
      return true;
    }
    return false;
  }

  commit(){}
}

export class TextPart extends Part {
  set(node, value) {
    node.textContent = value;
  }
}