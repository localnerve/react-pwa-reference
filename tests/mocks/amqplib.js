/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * A limited mock for amqplib
 */
'use strict';

var Q = require('q');

function Channel (chanError, msg, ack, nack) {
  this.chanError = chanError;
  this.msg = msg;
  this.cbAck = ack;
  this.cbNack = nack;
  this.error = new Error('channel');
}
Channel.prototype = {
  // Return promise, reject if chanError is true.
  assertQueue: function () {
    var deferred = Q.defer();

    if (this.chanError) {
      deferred.reject(this.error);
    } else {
      deferred.resolve();
    }

    return deferred.promise;
  },
  sendToQueue: function () {
  },
  consume: function (q, cb) {
    cb(this.msg);
  },
  nack: function (msg) {
    this.cbNack(msg);
  },
  ack: function (msg) {
    this.cbAck(msg);
  }
};

function Connection (connError, chanError, msg, ack, nack) {
  this.connError = connError;
  this.chanError = chanError;
  this.msg = msg;
  this.cbAck = ack;
  this.cbNack = nack;
  this.error = new Error('connection');
}
Connection.prototype = {
  // Return promise that receives a Channel on resolve
  // or reject if connError is true.
  createChannel: function () {
    var deferred = Q.defer();

    if (this.connError) {
      deferred.reject(this.error);
    } else {
      deferred.resolve(new Channel(
        this.chanError, this.msg, this.cbAck, this.cbNack
      ));
    }

    return deferred.promise;
  }
};

var errorProfile = {
  connect: false,
  connection: false,
  channel: false
};

var consumerMessage = {
  content: {
    toString: function() {
      return JSON.stringify({});
    }
  }
};

var consumerAck = function () {
};

var consumerNack = function () {
};

// Return promise that receives a connection on resolve
// or reject if emulateError is true.
function connect () {
  var deferred = Q.defer();

  if (errorProfile.connect) {
    deferred.reject(new Error('connect'));
  } else {
    deferred.resolve(new Connection(
      errorProfile.connection, errorProfile.channel,
      consumerMessage, consumerAck, consumerNack
    ));
  }

  return deferred.promise;
}

function setErrors (profile) {
  errorProfile.connect = profile.connect;
  errorProfile.connection = profile.connection;
  errorProfile.channel = profile.channel;
}

function setConsumerMessage (msg) {
  consumerMessage.content = new Buffer(JSON.stringify(msg));
}

function getConsumerMessage(msg) {
  return JSON.parse(msg.content.toString());
}

function setConsumerAck (cb) {
  consumerAck = cb;
}

function setConsumerNack (cb) {
  consumerNack = cb;
}

module.exports = {
  connect: connect,
  setErrors: setErrors,
  setConsumerMessage: setConsumerMessage,
  getConsumerMessage: getConsumerMessage,
  setConsumerAck: setConsumerAck,
  setConsumerNack: setConsumerNack
};
