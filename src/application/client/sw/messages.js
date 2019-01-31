/***
 * Copyright (c) 2016 - 2019 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * Message handling for the service worker.
 */
/* global Promise, self, clients */
import debugLib from 'sw/utils/debug';
import { synchronize as pushSync } from './sync/push';
import { initCommand } from './init';

const debug = debugLib('messages');

/***
 * Add any new messaging command handlers to this object.
 *
 * Format of all commands:
 * @param {Object} payload - The message payload.
 * @param {Function} responder - The sendResponse function with event prebound.
 * @returns {Promise} Resolves when complete.
 */
const commands = {
  /***
   * Handle init messages
   */
  init: initCommand,

  /**
   * Handle pushSync messages
   */
  pushSync: (payload, responder) => {
    return pushSync(payload.subscriptionId)
      .then(() => {
        return responder({
          error: null
        });
      })
      .catch((error) => {
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
  let result;
  const respondTo = event.data.port || event.source;

  if (respondTo) {
    respondTo.postMessage(response);
  } else {
    if (self.clients) {
      result = clients.matchAll().then((clients) => {
        for (let i = 0; i < clients.length; i++) {
          clients[i].postMessage(response);
        }
      });
    }
  }

  return result || Promise.resolve();
}

self.addEventListener('message', (event) => {
  const commandName = event.data.command,
    payload = event.data.payload,
    command = commands[commandName] || unknownCommand;

  debug(`"${commandName}" command received`, payload);

  const result = command(payload, sendResponse.bind(null, event));

  if ('waitUntil' in event) {
    event.waitUntil(result);
  }
});
