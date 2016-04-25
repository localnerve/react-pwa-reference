/***
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global after, before, beforeEach, describe, it */
'use strict';

var expect = require('chai').expect;
var mocks = require('test/mocks');

describe('sw/utils/db', function () {
  var toolbox, db;

  before('setup sw/utils/db', function () {
    this.timeout(5000);

    mocks.swUtilsDb.begin();

    toolbox = require('sw-toolbox');
    toolbox.mockSetup();

    db = require('application/assets/scripts/sw/utils/db');
  });

  after(function () {
    toolbox.mockTeardown();
    mocks.swUtilsDb.end();
  });

  it('should export expected methods', function () {
    expect(db).to.respondTo('init');
    expect(db).to.respondTo('requests');
  });

  describe('initStore', function () {
    var initStore, keyName = 'someKey';

    beforeEach(function () {
      initStore = db.init({ key: keyName });
    });

    it('should construct DataWrapper properly', function () {
      expect(initStore.storeName).to.equal('init');
      expect(initStore.keyName).to.equal(keyName);
      expect(initStore.read).to.be.a('function');
      expect(initStore).to.respondTo('read');
      expect(initStore.update).to.be.a('function');
      expect(initStore).to.respondTo('update');
    });

    it('should read successfully', function (done) {
      initStore.read()
        .then(function (value) {
          expect(value).to.be.a('string').that.is.not.empty;
          done();
        })
        .catch(function (error) {
          done(error);
        });
    });

    it('should read unsuccessfully', function (done) {
      initStore = db.init({ key: keyName, emulateError: true });

      initStore.read()
        .then(function () {
          done(new Error('expected failure'));
        })
        .catch(function (error) {
          expect(error.message).to.be.a('string');
          done();
        });
    });

    it('should update successfully', function (done) {
      initStore.update('someValue')
        .then(function () {
          done();
        })
        .catch(function (error) {
          done(error);
        });
    });

    it('should update unsuccessfully', function (done) {
      initStore = db.init({ key: keyName, emulateError: true });

      initStore.update('someValue')
        .then(function () {
          done(new Error('expected failure'));
        })
        .catch(function () {
          done();
        });
    });
  });
});
