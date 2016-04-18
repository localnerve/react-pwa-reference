/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * Mock idb for sw/sync/push
 */
/* global Promise */
'use strict';

module.exports = {
  synchronize: function synchronizePushSubscription () {
    var error = this.error;
    var value = typeof this.mockValue === 'undefined' ? false : this.mockValue;

    return new Promise(function (resolve, reject) {
      if (error) {
        return reject(new Error('mock error'));
      }

      return resolve(value);
    });
  },
  setEmulateError: function (error) {
    this.error = error;
  },
  setValue: function (value) {
    this.mockValue = value;
  }
};
