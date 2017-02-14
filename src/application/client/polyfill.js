/***
 * Copyright (c) 2016, 2017 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * Apply all global client-side polyfills.
 */
/* global Promise */
import { polyfill as es6Polyfill } from 'es6-promise';
import objectAssign from 'object-assign';

if (!Promise) {
  es6Polyfill();
}

if (!Object.assign) {
  Object.defineProperty(Object, 'assign', {
    enumerable: false,
    configurable: true,
    writable: true,
    value: objectAssign
  });
}
