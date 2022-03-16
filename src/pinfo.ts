
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

export interface KeyedMultiPropertyDefinition extends BasePropertyDefinition {
  keyed: true;
  multi: true;
  read: ReadKeyedValue;
  oldValues?: boolean;
  longhand?: never;
  prop: 'classToggle' | 'data' | 'prop';
}

export interface BehaviorMultiPropertyDefinition extends BasePropertyDefinition {
  keyed: false;
  multi: true;
  oldValues: boolean;
  longhand?: never;
  prop: 'behavior';
  read?: never;
}

export interface ShorthandPropertyDefinition extends BasePropertyDefinition {
  longhand: string[];
  prop: 'each' | 'attr' | 'event';
  defaults: any[];
  keyed?: boolean;
  multi?: boolean;
  oldValues?: boolean;
}

export interface LonghandPropertyDefinition extends BasePropertyDefinition {
  shorthand: string;
  index: number;
  keyed?: boolean;
  default: any;
  read: ReadKeyedValue;
}

export interface SimplePropertyDefinition extends BasePropertyDefinition {
  read: ReadUnkeyedValue;
  prop: PropertyPropName;
}

export type PropertyDefinition = SimplePropertyDefinition
  | ShorthandPropertyDefinition
  | LonghandPropertyDefinition
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