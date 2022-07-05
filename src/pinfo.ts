
export type PropertyPropName = 'attr' |
  'attrValue' |
  'attrToggle' |
  'attachTemplate' |
  'behavior' |
  'classToggle' | 
  'data' |
  'each' |
  'event' |
  'prop' |
  'text' |
  'storeRoot' |
  'storeSet'

interface BasePropertyDefinition {
  flag: number;
  feat: number;
  prop?: PropertyPropName;
}

type ReadKeyedValue = (element: Element, key: string) => any;
type ReadUnkeyedValue = (element: Element) => any;

export interface MultiPropertyDefinition extends BasePropertyDefinition {
  keyed: boolean;
  multi: true;
  labeled?: false;
  read: ReadKeyedValue;
  oldValues?: boolean;
  longhand?: never;
  shorthand?: never;
  prop: 'classToggle' | 'data' | 'prop';
}

export interface KeyedMultiPropertyDefinition extends MultiPropertyDefinition {
  keyed: true;
  prop: 'data' | 'prop';
}

export interface BehaviorMultiPropertyDefinition extends BasePropertyDefinition {
  keyed: false;
  multi: true;
  labeled?: false;
  oldValues: boolean;
  longhand?: never;
  prop: 'behavior';
  read?: never;
  shorthand?: never;
}

export interface ShorthandPropertyDefinition extends BasePropertyDefinition {
  shorthand?: never;
  longhand: string[];
  prop: 'each' | 'attr' | 'event';
  defaults: any[];
  labeled?: boolean;
  keyed?: boolean;
  multi?: boolean;
  oldValues?: boolean;
}

export interface LonghandPropertyDefinition extends BasePropertyDefinition {
  shorthand: string;
  index: number;
  keyed?: boolean;
  labeled?: boolean;
  default: any;
  read: ReadKeyedValue;
  multi?: never;
  longhand?: never;
}

export interface SimplePropertyDefinition extends BasePropertyDefinition {
  labeled?: false;
  read: ReadUnkeyedValue;
  prop: PropertyPropName;
  shorthand?: never;
  longhand?: never;
  multi?: never;
}

export type PropertyDefinition = SimplePropertyDefinition
  | ShorthandPropertyDefinition
  | LonghandPropertyDefinition
  | MultiPropertyDefinition
  | KeyedMultiPropertyDefinition
  | BehaviorMultiPropertyDefinition;

export declare const properties: Record<string, PropertyDefinition>;

export declare const flags: Record<
  'text' |
  'behavior' |
  'classToggle' |
  'event' |
  'custom' | 
  'each' |
  'prop' |
  'attr' |
  'data' |
  'attach' |
  'storeRoot' |
  'storeSet'
, number>;

type featureNames = 'keyed' | 'multi' | 'oldValues' | 'longhand' | 'behavior';

export declare const features: Record<featureNames, number>;