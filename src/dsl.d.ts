import type { RawStringTemplate } from './types';

declare class Sheet {
  update(root: HTMLElement): void;
}

export default function(template: RawStringTemplate, ...values: any[]): Sheet;