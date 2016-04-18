/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * Mock idb for sw/utils/db
 */
/* global Promise */
'use strict';

module.exports = {
  stores: {
    init: 'init',
    requests: 'requests'
  },
  emulateError: function (error) {
    this.error = error;
  },
  setValue: function (value) {
    this.mockValue = value;
  },
  get: function () {
    var testValue;

    if (!this.error) {
      testValue = this.mockValue || 'test value';
    }

    return Promise.resolve(testValue);
  },
  put: function () {
    if (this.error) {
      return Promise.reject(new Error('mock error'));
    }

    return Promise.resolve();
  }
};
