/***
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global after, afterEach, before, describe, it */
'use strict';

var expect = require('chai').expect;
var mocks = require('test/mocks');

describe('sw/utils/idb', function () {
  var treoMock, idb;

  before('setup sw/utils/idb', function () {
    this.timeout(5000);

    mocks.swUtilsIdbTreo.begin();

    idb = require('application/client/sw/node_modules/sw/utils/idb');
    treoMock = require('treo');
    treoMock.setValue('some value');
  });

  after(function () {
    mocks.swUtilsIdbTreo.end();
  });

  it('should export expected things', function () {
    expect(idb.stores).to.be.an('object').that.is.not.empty;
    expect(idb).to.respondTo('all');
    expect(idb).to.respondTo('batch');
    expect(idb).to.respondTo('del');
    expect(idb).to.respondTo('get');
    expect(idb).to.respondTo('put');
  });

  describe('method', function () {
    var method = 'get';
    var storeName;

    before(function () {
      storeName = Object.keys(idb.stores)[0];
    });

    afterEach(function () {
      expect(treoMock.status.getCloseCount()).to.equal(1);
    });

    it('should execute successfully', function (done) {
      idb[method](storeName).then(function (value) {
        expect(value).to.be.a('string').that.is.not.empty;
        done();
      });
    });

    it('should fail successfully', function (done) {
      idb[method](storeName, 'emulateError')
        .then(function () {
          done(new Error('expected failure'));
        })
        .catch(function (error) {
          expect(error.message).to.be.an('string').that.is.not.empty;
          done();
        });
    });
  });
});
