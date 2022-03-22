/***
 * Copyright (c) 2016 - 2022 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global after, before, beforeEach, describe, it */

import { expect } from 'chai';
import mocks from 'test/mocks';

describe('sw/utils/db', () => {
  let toolbox, db;

  before('setup sw/utils/db', function () {
    this.timeout(5000);

    mocks.swData.begin();
    mocks.swUtilsDb.begin();

    toolbox = require('sw-toolbox');
    toolbox.mockSetup();

    db = require('application/client/sw/node_modules/sw/utils/db').stores;
  });

  after(() => {
    toolbox.mockTeardown();
    mocks.swUtilsDb.end();
    mocks.swData.end();
  });

  it('should export expected methods', () => {
    expect(db).to.respondTo('init');
    expect(db).to.respondTo('requests');
  });

  describe('initStore', () => {
    let initStore;
    const keyName = 'someKey';

    beforeEach(() => {
      initStore = db.init({ key: keyName });
    });

    it('should construct DataWrapper properly', () => {
      expect(initStore.storeName).to.equal('init');
      expect(initStore.keyName).to.equal(keyName);
      expect(initStore.read).to.be.a('function');
      expect(initStore).to.respondTo('read');
      expect(initStore.update).to.be.a('function');
      expect(initStore).to.respondTo('update');
    });

    it('should read successfully', (done) => {
      initStore.read()
        .then((value) => {
          expect(value).to.be.a('string').that.is.not.empty;
          done();
        })
        .catch((error) => {
          done(error);
        });
    });

    it('should read unsuccessfully', (done) => {
      initStore = db.init({ key: keyName, emulateError: true });

      initStore.read()
        .then(() => {
          done(new Error('expected failure'));
        })
        .catch((error) => {
          expect(error.message).to.be.a('string');
          done();
        });
    });

    it('should update successfully', (done) => {
      initStore.update('someValue')
        .then(() => {
          done();
        })
        .catch((error) => {
          done(error);
        });
    });

    it('should update unsuccessfully', (done) => {
      initStore = db.init({ key: keyName, emulateError: true });

      initStore.update('someValue')
        .then(() => {
          done(new Error('expected failure'));
        })
        .catch(() => {
          done();
        });
    });
  });
});
