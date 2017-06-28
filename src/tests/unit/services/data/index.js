/**
 * Copyright (c) 2016, 2017 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global before, after, beforeEach, describe, it */

import { expect } from 'chai';
import mocks from 'test/mocks';

describe('data/index', () => {
  let data, cache, fetchLib;

  before(function () {
    this.timeout(5000);

    mocks.fetch.begin();
    data = require('application/server/services/data');
    cache = require('./cache-interface');
    fetchLib = require('./fetch');
  });

  after(() => {
    mocks.fetch.end();
  });

  beforeEach(() => {
    cache.mockReset();
    fetchLib.mockReset();
  });

  describe('fetch', () => {
    it('should pull from cache if exists', (done) => {
      data.fetch({}, (err, res) => {
        if (err) {
          done(err);
        }

        expect(res).to.equal(cache.get());
        done();
      });
    });

    it('should fetch if not in cache', (done) => {
      data.fetch({ resource: 'miss' }, (err, res) => {
        if (err) {
          done(err);
        }

        expect(res).to.equal('fetch');
        done();
      });
    });

    it('should fetch using find spec if not in cache', (done) => {
      data.fetch({ resource: 'find' }, (err, res) => {
        if (err) {
          done(err);
        }

        const callCounts = cache.mockCounts();
        const params = fetchLib.mockParams();

        expect(callCounts.get).to.equal(1);
        expect(callCounts.find).to.equal(1);
        expect(params).to.equal(cache.find());
        expect(res).to.equal('fetch');
        done();
      });
    });
  });

  describe('initialize', () => {
    it('should initialize', (done) => {
      data.initialize(done);
    });
  });

  describe('update', () => {
    it('should update', (done) => {
      data.update(done);
    });
  });
});
