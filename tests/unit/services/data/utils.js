/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
 /* global before, describe, it */
'use strict';

var expect = require('chai').expect;

describe('data/utils', function () {
  var utils;

  before('utils', function () {
    utils = require('../../../../services/data/utils');
  });

  describe('objContains', function () {
    var testKey = 'testKey';
    var testValue = 'testValue';
    var test = {
      some: 'string'
    };
    var object = {
      other: {
        test: {
          some: 'string'
        }
      },
      test: {}
    };

    before('objContains', function () {
      test[testKey] = testValue;
      object.test = Object.assign(object.test, test);
    });

    it('should retrieve test object', function () {
      var result = utils.objContains(testKey, testValue, object);
      expect(result).to.eql(test);
    });

    it('should returned undefined if not found', function () {
      var result = utils.objContains('nope', 'nothing', object);
      expect(result).to.be.undefined;
    });
  });
});
