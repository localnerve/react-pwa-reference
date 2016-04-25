/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
'use strict';

module.exports = {
  sendMail: function (input, callback) {
    if (input.emulateError) {
      return callback(new Error('mock'));
    }
    callback();
  },

  contactWorker: function () {
  }
};
