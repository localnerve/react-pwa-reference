/***
 * Copyright (c) 2016, 2017 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global before, beforeEach, after, describe, it */
'use strict';

var expect = require('chai').expect;
var mocks = require('test/mocks');

describe('sw/utils/debug', function () {
  var debugLib, treoMock;
  var debugKey = 'debug';
  var mockValue = 'mock value';
  var unexpectedFlowError = new Error('unexpected flow');

  before('setup debug', function () {
    this.timeout(5000);

    mocks.swUtilsIdbTreo.begin();
    mocks.swData.begin();
    treoMock = require('treo');
    treoMock.setValue(mockValue);
    debugLib =
      require('application/client/sw/node_modules/sw/utils/debug').default;
  });

  after(function () {
    mocks.swData.end();
    mocks.swUtilsIdbTreo.end();
  });

  describe('load', function () {
    var calledGet;

    beforeEach(function () {
      calledGet = 0;
      treoMock.setReporter(function (method, key) {
        if (method === 'get' && key === debugKey) {
          calledGet++;
        }
      });
    });

    it('should call idb get', function (done) {
      debugLib.load()
        .then(function (namespace) {
          expect(namespace).to.equal(mockValue);
          expect(calledGet).to.equal(1);
          done();
        })
        .catch(function (error) {
          done (error || unexpectedFlowError);
        });
    });
  });

  describe('save', function () {
    var calledDel, calledPut;

    beforeEach(function () {
      calledDel = calledPut = 0;
      treoMock.setReporter(function (method, key) {
        if (method === 'del' && key === debugKey) {
          calledDel++;
        }
        if (method === 'put' && key === debugKey) {
          calledPut++;
        }
      });
    });

    it('should call del if input undefined', function (done) {
      debugLib.save()
        .then(function () {
          expect(calledDel).to.equal(1);
          expect(calledPut).to.equal(0);
          done();
        })
        .catch(function (error) {
          done(error || unexpectedFlowError);
        });
    });

    it('should call put if input non-null', function (done) {
      debugLib.save('*')
        .then(function () {
          expect(calledPut).to.equal(1);
          expect(calledDel).to.equal(0);
          done();
        })
        .catch(function (error) {
          done(error || unexpectedFlowError);
        });
    });
  });
});
