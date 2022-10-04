import type { Constant } from './constants';

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

type ReadKeyedValue = (element: Element | Document | ShadowRoot, key: string) => any;
type ReadUnkeyedValue = (element: Element | Document | ShadowRoot) => any;

export interface MultiPropertyDefinition extends BasePropertyDefinition {
  read: ReadKeyedValue;
  longhand?: never;
  shorthand?: never;
  prop: 'classToggle' | 'data' | 'prop' | 'storeSet' | 'storeRoot';
  key?: (values: any[]) => string | Constant;
  num?: number;
}

export interface BehaviorMultiPropertyDefinition extends BasePropertyDefinition {
  longhand?: never;
  prop: 'behavior';
  read?: never;
  shorthand?: never;
  num?: number;
}

export interface ShorthandPropertyDefinition extends BasePropertyDefinition {
  shorthand?: never;
  longhand: string[];
  prop: 'each' | 'attr' | 'event';
  defaults: any[];
  num?: number;
}

export interface LonghandPropertyDefinition extends BasePropertyDefinition {
  shorthand: string;
  index: number;
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
  | MultiPropertyDefinition
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

type featureNames = 'multi' | 'oldValues' | 'longhand' | 'behavior';

export declare const features: Record<featureNames, number>;