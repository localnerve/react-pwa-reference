/**
 * Copyright (c) 2016 - 2021 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global before, after, describe, it */

import { expect } from 'chai';
import mocks from 'test/mocks';

describe('mail/queue', () => {
  let queue, amqplib;
  const fields = {
    name: 'testuser',
    email: 'test@test.com',
    message: 'this is a message'
  };

  before(function () {
    this.timeout(5000);

    mocks.queue.begin();
    queue = require('application/server/services/mail/queue');
    amqplib = require('amqplib');
  });

  after(() => {
    mocks.queue.end();
  });

  describe('sendMail', () => {
    // test sendMail

    it('should handle connect error', (done) => {
      const errorType = 'connect';
      amqplib.setErrors({
        connect: true
      });

      queue.sendMail(fields, (err) => {
        expect(err).to.be.an.instanceof(Error);
        expect(err.message).to.equal(errorType);
        done();
      });
    });

    it('should handle a connection error', (done) => {
      const errorType = 'connection';
      amqplib.setErrors({
        connection: true
      });

      queue.sendMail(fields, (err) => {
        expect(err).to.be.an.instanceof(Error);
        expect(err.message).to.equal(errorType);
        done();
      });
    });

    it('should handle a channel error', (done) => {
      const errorType = 'channel';
      amqplib.setErrors({
        channel: true
      });

      queue.sendMail(fields, (err) => {
        expect(err).to.be.an.instanceof(Error);
        expect(err.message).to.equal(errorType);
        done();
      });
    });

    it('should work with no errors', (done) => {
      amqplib.setErrors({});

      queue.sendMail(fields, (err) => {
        done(err);
      });
    });
  });

  describe('contactWorker', () => {
    // test contactWorker

    it('should ack messages', (done) => {
      amqplib.setErrors({});

      amqplib.setConsumerMessage(fields);

      amqplib.setConsumerAck((msg) => {
        const result = amqplib.getConsumerMessage(msg);
        expect(result).to.eql(fields);
        done();
      });
      amqplib.setConsumerNack(() => {
        done(new Error('Nack should not have been called'));
      });

      queue.contactWorker();
    });

    it('should nack messages', (done) => {
      amqplib.setErrors({});

      const payload = JSON.parse(JSON.stringify(fields));
      payload.emulateError = true;

      amqplib.setConsumerMessage(payload);

      amqplib.setConsumerAck(() => {
        done(new Error('Ack should not have been called'));
      });
      amqplib.setConsumerNack((msg) => {
        const result = amqplib.getConsumerMessage(msg);
        delete result.emulateError;
        expect(result).to.eql(fields);
        done();
      });

      queue.contactWorker();
    });
  });
});
