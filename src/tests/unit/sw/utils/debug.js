/***
 * Copyright (c) 2016, 2017 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global before, beforeEach, after, describe, it */

import { expect } from 'chai';
import mocks from 'test/mocks';

describe('sw/utils/debug', () => {
  let debugLib, treoMock;
  const debugKey = 'debug';
  const mockValue = 'mock value';
  const unexpectedFlowError = new Error('unexpected flow');

  before('setup debug', function () {
    this.timeout(5000);

    mocks.swUtilsIdbTreo.begin();
    mocks.swData.begin();
    treoMock = require('treo');
    treoMock.setValue(mockValue);
    debugLib =
      require('application/client/sw/node_modules/sw/utils/debug').default;
  });

  after(() => {
    mocks.swData.end();
    mocks.swUtilsIdbTreo.end();
  });

  describe('load', () => {
    let calledGet;

    beforeEach(() => {
      calledGet = 0;
      treoMock.setReporter((method, key) => {
        if (method === 'get' && key === debugKey) {
          calledGet++;
        }
      });
    });

    it('should call idb get', (done) => {
      debugLib.load()
        .then((namespace) => {
          expect(namespace).to.equal(mockValue);
          expect(calledGet).to.equal(1);
          done();
        })
        .catch((error) => {
          done (error || unexpectedFlowError);
        });
    });
  });

  describe('save', () => {
    let calledDel, calledPut;

    beforeEach(() => {
      calledDel = calledPut = 0;
      treoMock.setReporter((method, key) => {
        if (method === 'del' && key === debugKey) {
          calledDel++;
        }
        if (method === 'put' && key === debugKey) {
          calledPut++;
        }
      });
    });

    it('should call del if input undefined', (done) => {
      debugLib.save()
        .then(() => {
          expect(calledDel).to.equal(1);
          expect(calledPut).to.equal(0);
          done();
        })
        .catch((error) => {
          done(error || unexpectedFlowError);
        });
    });

    it('should call put if input non-null', (done) => {
      debugLib.save('*')
        .then(() => {
          expect(calledPut).to.equal(1);
          expect(calledDel).to.equal(0);
          done();
        })
        .catch((error) => {
          done(error || unexpectedFlowError);
        });
    });
  });
});
