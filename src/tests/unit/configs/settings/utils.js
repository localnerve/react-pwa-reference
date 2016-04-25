/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global describe, it, before */
'use strict';

var _ = require('lodash');
var expect = require('chai').expect;
var utils = require('configs/settings/utils');

describe('settings/utils', function () {
  describe('prependPathToObject', function () {
    var strToken = 'astring',
      lastToken = 'dobeedo',
      prePath = 'dobee/'+lastToken;

    var testObj, testTerminalCount, terminals = {
        str: strToken,
        num: 10,
        bool: false,
        nope: null
      };

    before(function () {
      // The number of times terminals appears below
      testTerminalCount = 6;

      testObj = JSON.parse(JSON.stringify(terminals));
      testObj.obj = _.assign(JSON.parse(JSON.stringify(terminals)), {
        arr: _.values(terminals)
      }, {
        obj: {
          arr: [terminals, terminals]
        }
      });
      testObj.arr = _.values(terminals);
    });

    function collectStrings (obj, strings) {
      if (typeof obj === 'string') {
        strings.push(obj);
      } else if (Object.prototype.toString.call(obj) === '[object Array]') {
        obj.forEach(function (o) {
          if (typeof o === 'string') {
            strings.push(o);
          } else if ( typeof o === 'object') {
            collectStrings(o, strings);
          }
        });
      } else if (Object.prototype.toString.call(obj) === '[object Object]') {
        Object.keys(obj).forEach(function (key) {
          if (typeof obj[key] === 'string') {
            strings.push(obj[key]);
          } else if (typeof obj[key] === 'object') {
            collectStrings(obj[key], strings);
          }
        });
      }
    }

    it('should prepend all occurences of string with valid path', function () {
      var result = utils.prependPathToObject(testObj, prePath);

      var strings = [];
      collectStrings(result, strings);

      expect(strings).length.to.be(testTerminalCount);
      strings.forEach(function (aString) {
        expect(aString).to.contain(strToken);
        expect(aString).to.contain(prePath);
        expect(aString).to.contain(lastToken+'/');
      });
    });
  });
});
