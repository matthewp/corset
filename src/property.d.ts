import { ValueTemplate } from './template';

type PropertyPropName = 'attr' |
  'attrValue' |
  'attrToggle' |
  'attachTemplate' |
  'classToggle' | 
  'data' |
  'each' |
  'event' |
  'mount' |
  'prop' |
  'text'

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
  prop: 'classToggle' | 'data' | 'event' | 'prop';
}

export interface ShorthandPropertyDefinition extends BasePropertyDefinition {
  longhand: string[];
  prop: 'each' | 'attr';
  defaults: any[];
  keyed?: boolean;
  multi?: boolean;
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
  | KeyedMultiPropertyDefinition;

export declare const properties: Record<string, PropertyDefinition>;

export declare const flags: Record<
  'text' |
  'classToggle' |
  'event' |
  'custom' | 
  'each' |
  'prop' |
  'attr' |
  'data' |
  'attach' |
  'mount'
, number>;

type featureNames = 'keyed' | 'multi' | 'oldValues' | 'longhand';

export declare const features: Record<featureNames, number>;

export declare function hasFeatures(defn: PropertyDefinition | undefined,
  ...feat: featureNames[]);