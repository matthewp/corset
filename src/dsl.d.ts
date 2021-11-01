declare class Sheet {
  update(root: HTMLElement): void;
}

export default function(strings: string[], ...values: any[]): Sheet;