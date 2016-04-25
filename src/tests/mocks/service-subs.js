/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
'use strict';

module.exports = {
  create: function (subscriptionId, endpoint, callback) {
    callback();
  },
  read: function (subscriptionId, callback) {
    callback();
  },
  update: function (subscriptionId, topics, endpoint, newId, callback) {
    callback();
  },
  delete: function (subscriptionId, callback) {
    callback();
  }
};
