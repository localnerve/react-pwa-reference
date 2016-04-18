/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
 /* global before, after, describe, it */
'use strict';

var expect = require('chai').expect;
var mocks = require('../../../mocks');

describe('mail/queue', function () {
  var queue, amqplib,
    fields = {
      name: 'testuser',
      email: 'test@test.com',
      message: 'this is a message'
    };

  before(function () {
    mocks.queue.begin();
    queue = require('../../../../services/mail/queue');
    amqplib = require('amqplib');
  });

  after(function () {
    mocks.queue.end();
  });

  describe('sendMail', function () {
    // test sendMail

    it('should handle connect error', function (done) {
      var errorType = 'connect';
      amqplib.setErrors({
        connect: true
      });

      queue.sendMail(fields, function (err) {
        expect(err).to.be.an.instanceof(Error);
        expect(err.message).to.equal(errorType);
        done();
      });
    });

    it('should handle a connection error', function (done) {
      var errorType = 'connection';
      amqplib.setErrors({
        connection: true
      });

      queue.sendMail(fields, function (err) {
        expect(err).to.be.an.instanceof(Error);
        expect(err.message).to.equal(errorType);
        done();
      });
    });

    it('should handle a channel error', function (done) {
      var errorType = 'channel';
      amqplib.setErrors({
        channel: true
      });

      queue.sendMail(fields, function (err) {
        expect(err).to.be.an.instanceof(Error);
        expect(err.message).to.equal(errorType);
        done();
      });
    });

    it('should work with no errors', function (done) {
      amqplib.setErrors({});

      queue.sendMail(fields, function (err) {
        done(err);
      });
    });
  });

  describe('contactWorker', function () {
    // test contactWorker

    it('should ack messages', function (done) {
      amqplib.setErrors({});

      amqplib.setConsumerMessage(fields);

      amqplib.setConsumerAck(function (msg) {
        var result = amqplib.getConsumerMessage(msg);
        expect(result).to.eql(fields);
        done();
      });
      amqplib.setConsumerNack(function () {
        done(new Error('Nack should not have been called'));
      });

      queue.contactWorker();
    });

    it('should nack messages', function (done) {
      amqplib.setErrors({});

      var payload = JSON.parse(JSON.stringify(fields));
      payload.emulateError = true;

      amqplib.setConsumerMessage(payload);

      amqplib.setConsumerAck(function () {
        done(new Error('Ack should not have been called'));
      });
      amqplib.setConsumerNack(function (msg) {
        var result = amqplib.getConsumerMessage(msg);
        delete result.emulateError;
        expect(result).to.eql(fields);
        done();
      });

      queue.contactWorker();
    });
  });
});
