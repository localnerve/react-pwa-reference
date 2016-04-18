/***
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * Message handling for the service worker.
 */
/* global Promise, self, clients */
'use strict';

var debug = require('./utils/debug')('messages');
var push = require('./sync/push');

/***
 * Add any new messaging command handlers to this object.
 *
 * Format of all commands:
 * @param {Object} payload - The message payload.
 * @param {Function} responder - The sendResponse function with event prebound.
 * @returns {Promise} Resolves when complete.
 */
var commands = {
  /***
   * Handle init messages
   */
  init: require('./init').command,

  /**
   * Handle pushSync messages
   */
  pushSync: function (payload, responder) {
    return push.synchronize(payload.subscriptionId)
    .then(function () {
      return responder({
        error: null
      });
    })
    .catch(function (error) {
      debug('pushSync failed', error);
      return responder({
        error: error.toString()
      });
    });
  }
};

/**
 * Handle unknown commands
 *
 * @param {Object} payload - Ignored.
 * @param {Function} responder - Function to call to resolve the message
 */
function unknownCommand (payload, responder) {
  return responder({
    error: 'Unknown command received by service worker.'
  });
}

/**
 * Sends a response back to the message originator.
 * If no source or port, sends to all clients.
 *
 * @param {Object} event - The message event.
 * @param {Object} response - The message response payload.
 */
function sendResponse (event, response) {
  var result,
    respondTo = event.data.port || event.source;

  if (respondTo) {
    respondTo.postMessage(response);
  } else {
    if (self.clients) {
      result = clients.matchAll().then(function (clients) {
        for (var i = 0; i < clients.length; i++) {
          clients[i].postMessage(response);
        }
      });
    }
  }

  return result || Promise.resolve();
}

self.addEventListener('message', function (event) {
  var commandName = event.data.command,
    payload = event.data.payload,
    command = commands[commandName] || unknownCommand,
    handler = 'waitUntil' in event ? event.waitUntil : function () {};

  debug('\'' + commandName + '\' command received', payload);

  handler(
    command(payload, sendResponse.bind(this, event))
  );
});
