/**
 * Copyright (c) 2016 - 2021 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global before, describe, it */

import { expect } from 'chai';

describe('data/utils', () => {
  let utils;

  before('utils', () => {
    utils = require('application/server/services/data/utils');
  });

  describe('objContains', () => {
    const testKey = 'testKey';
    const testValue = 'testValue';
    const test = {
      some: 'string'
    };
    const object = {
      other: {
        test: {
          some: 'string'
        }
      },
      test: {}
    };

    before('objContains', () => {
      test[testKey] = testValue;
      object.test = Object.assign(object.test, test);
    });

    it('should retrieve test object', () => {
      const result = utils.objContains(testKey, testValue, object);
      expect(result).to.eql(test);
    });

    it('should returned undefined if not found', () => {
      const result = utils.objContains('nope', 'nothing', object);
      expect(result).to.be.undefined;
    });
  });
});
