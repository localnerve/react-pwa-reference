/**
 * Copyright (c) 2016 - 2018 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global describe, it, before */

import _ from 'lodash';
import path from 'path';
import { expect } from 'chai';
import utils from 'configs/settings/utils';

describe('settings/utils', () => {
  describe('prependPathToObject', () => {
    const strToken = 'astring',
      lastToken = 'dobeedo',
      prePath = 'dobee/'+lastToken,
      terminals = {
        str: strToken,
        num: 10,
        bool: false,
        nope: null
      };

    let testObj, testTerminalCount;

    before(() => {
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

    it('should prepend all occurences of string with valid path', () => {
      const result = utils.prependPathToObject(testObj, prePath);
      const strings = [];

      collectStrings(result, strings);

      expect(strings).to.have.lengthOf(testTerminalCount);
      strings.forEach(function (aString) {
        expect(aString).to.contain(strToken);
        expect(aString).to.contain(path.normalize(prePath));
        expect(aString).to.contain(path.normalize(lastToken+'/'));
      });
    });
  });

  describe('pkgInfo', () => {
    it('should fail properly', (done) => {
      utils.pkgInfo('baddir', function (err) {
        expect(err).to.exist;
        expect(err).to.be.an('Error');
        done();
      });
    });

    it('should read package.json', (done) => {
      utils.pkgInfo('.', function (err, data) {
        expect(err).to.not.exist;
        expect(data).to.be.an('object');
        expect(data.version).to.exist;
        done();
      });
    })
  });
});
