/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
 /* global before, after, describe, it */
'use strict';

var expect = require('chai').expect;
var mocks = require('../../../mocks');

describe('mail/index', function () {
  var mail;

  before(function () {
    mocks.mail.begin();
    mail = require('../../../../services/mail/index');
  });

  after(function () {
    mocks.mail.end();
  });

  it('should send mail without error', function (done) {
    mail.send({
      name: 'tom',
      email: 'tom@heaven.org',
      message: 'thinking of you'
    }, function(err) {
      done(err);
    });
  });

  it('should expose a worker method', function () {
    expect(mail.worker).to.be.a('function');
    expect(mail).to.respondTo('worker');
  });
});
