/**
 * Copyright (c) 2016 - 2022 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global before, after, describe, it */

import { expect } from 'chai';
import mocks from 'test/mocks';

describe('mail/index', () => {
  let mail;

  before(function () {
    this.timeout(5000);

    mocks.mail.begin();
    mail = require('application/server/services/mail/index');
  });

  after(() => {
    mocks.mail.end();
  });

  it('should send mail without error', (done) => {
    mail.send({
      name: 'tom',
      email: 'tom@heaven.org',
      message: 'thinking of you'
    }, (err) => {
      done(err);
    });
  });

  it('should expose a worker method', () => {
    expect(mail.worker).to.be.a('function');
    expect(mail).to.respondTo('worker');
  });
});
