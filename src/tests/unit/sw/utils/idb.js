/***
 * Copyright (c) 2016 - 2021 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global after, afterEach, before, describe, it */

import { expect } from 'chai';
import mocks from 'test/mocks';

describe('sw/utils/idb', () => {
  let treoMock, idb;

  before('setup sw/utils/idb', function () {
    this.timeout(5000);

    mocks.swUtilsIdbTreo.begin();

    idb = require('application/client/sw/node_modules/sw/utils/idb');
    treoMock = require('treo');
    treoMock.setValue('some value');
  });

  after(() => {
    mocks.swUtilsIdbTreo.end();
  });

  it('should export expected things', () => {
    expect(idb.stores).to.be.an('object').that.is.not.empty;
    expect(idb).to.respondTo('all');
    expect(idb).to.respondTo('batch');
    expect(idb).to.respondTo('del');
    expect(idb).to.respondTo('get');
    expect(idb).to.respondTo('put');
  });

  describe('method', () => {
    const method = 'get';
    let storeName;

    before(() => {
      storeName = Object.keys(idb.stores)[0];
    });

    afterEach(() => {
      expect(treoMock.status.getCloseCount()).to.equal(1);
    });

    it('should execute successfully', (done) => {
      idb[method](storeName).then((value) => {
        expect(value).to.be.a('string').that.is.not.empty;
        done();
      });
    });

    it('should fail successfully', (done) => {
      idb[method](storeName, 'emulateError')
        .then(() => {
          done(new Error('expected failure'));
        })
        .catch((error) => {
          expect(error.message).to.be.an('string').that.is.not.empty;
          done();
        });
    });
  });
});
