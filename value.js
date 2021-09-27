
export class InsertionValue {
  constructor(index) {
    this.index = index;
  }

  extract(values) {
    return values[this.index];
  }
}