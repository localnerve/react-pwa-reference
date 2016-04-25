/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
'use strict';

var handledMessageChannel = 'messageChannel';
var handledWorker = 'worker';

/**
 * Mock worker container
 *
 * @param {Object} options - The mock worker options
 * @param {Boolean} options.simulateError - true to simulate an error
 * @param {Object} options.messageChannel - a Message Channel
 */
function Worker (options) {
  this.simulateError = options.simulateError;
  this.messageChannel = options.messageChannel;
  if (options.onmessage) {
    this.onmessage = null;
  }
}

Worker.prototype = {
  /**
   * postMessage just calls the onMessage handler.
   * If a MessageChannel is supplied, use that.
   */
  postMessage: function () {
    var reply = {
      data: {
        error: this.simulateError,
        message: 'pong'
      }
    };

    if (this.messageChannel) {
      reply.data.handled = handledMessageChannel;
      this.messageChannel.port1.onmessage(reply);
    } else if (this.onmessage) {
      reply.data.handled = handledWorker;
      this.onmessage(reply);
    } else {
      throw new Error('Worker mock cannot reply');
    }
  }
};

/**
 * Factory for mock workers.
 *
 * @param {Object} [options] - The options for operations.
 * @param {Boolean} [options.simulateError] - Simulate an error.
 * @return A mock worker object.
 */
function createWorker (options) {
  return new Worker(options || {});
}

module.exports = {
  createWorker: createWorker,
  handled: {
    messageChannel: handledMessageChannel,
    worker: handledWorker
  }
};
