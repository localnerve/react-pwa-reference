/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * Mock responses for the subscription service.
 */
'use strict';

var allTopics = [{
  label: 'Alerts',
  tag: 'push-alerts-tag'
}, {
  label: 'Upcoming Events',
  tag: 'push-upcoming-events-tag'
}];

var updateTopic = [{
  label: 'Alerts',
  tag: 'push-alerts-tag',
  subscribe: true
}];

function mockError (params) {
  var err;
  if (params.emulateError) {
    err = new Error('mock service error');
  }
  return err;
}

function unsubscribe (params, config, callback) {
  var err = mockError(params);
  callback(err);
}

module.exports = {
  updateTopic: updateTopic,
  topics: allTopics,
  read: function read (params, config, callback) {
    var err = mockError(params);
    callback(err, allTopics);
  },
  create: function create (params, body, config, callback) {
    var err = mockError(params);
    callback(err, allTopics);
  },
  update: function update (params, body, config, callback) {
    var err = mockError(params);
    // just send update back
    callback(err, body.topics);
  },
  // This is 'del' because of fluxible-plugin-fetchr/utils/MockServiceManager
  del: unsubscribe,
  delete: unsubscribe
};
