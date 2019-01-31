/***
 * Copyright (c) 2016 - 2019 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global Promise, before, after, describe, it */

import { expect } from 'chai';
import { start as testDomStart, stop as testDomStop } from 'test/utils/testdom';
import requestAPI from 'test/mocks/request';
import blobAPI from 'test/mocks/blob';
import {
  addOrReplaceUrlSearchParameter,
  stripSearchParameters,
  cacheBustRequest,
  dehydrateRequest,
  rehydrateRequest
} from 'application/client/sw/node_modules/sw/utils/requests';

describe('sw/utils/requests', () => {
  const absoluteUrlNoSearch = 'https://example.org/route';
  const absoluteUrlSearch = 'https://example.org/route?name=value';
  const relativeUrlNoSearch = '/test';
  const relativeUrlSearch = '/test?name=value';
  const newName = 'newName';
  const newValue = '123';

  function getSearch (url) {
    return url.split('?')[1];
  }

  function getValueByName (url, name) {
    const re = new RegExp('('+name+'=)([^&]+)');
    const m = re.exec(url, name);
    return m && m[2];
  }

  // test search and nv presence
  function queryStringTest (url, name, value) {
    const search = getSearch(url);
    const foundValue = getValueByName(search, name);
    if (value) {
      expect(foundValue).to.equal(value);
    } else {
      expect(foundValue).to.exist.and.not.be.false;
    }
  }

  describe('addOrReplaceUrlSearchParameter', () => {
    it('should add a search parameter to an absolute url without QS', () => {
      const result =
        addOrReplaceUrlSearchParameter(absoluteUrlNoSearch, newName, newValue);
      queryStringTest(result, newName, newValue);
    });

    it('should add a search parameter to an absolute url with QS', () => {
      const result =
        addOrReplaceUrlSearchParameter(absoluteUrlSearch, newName, newValue);
      queryStringTest(result, newName, newValue);
    });

    it('should add a search parameter to a relative url without QS', () => {
      const result =
        addOrReplaceUrlSearchParameter(relativeUrlNoSearch, newName, newValue);
      queryStringTest(result, newName, newValue);
    });

    it('should add a search parameter to a relative url with QS', () => {
      const result =
        addOrReplaceUrlSearchParameter(relativeUrlSearch, newName, newValue);
      queryStringTest(result, newName, newValue);
    });

    it('should replace a search parameter in an absolute url', () => {
      const replaceVal = 'oscarmeyer';
      const result = addOrReplaceUrlSearchParameter(
        addOrReplaceUrlSearchParameter(
          absoluteUrlNoSearch, newName, newValue
        ), newName, replaceVal
      );
      queryStringTest(result, newName, replaceVal);
    });

    it('should replace a search parameter in a relative url', () => {
      const replaceVal = 'oscarmeyer';
      const result = addOrReplaceUrlSearchParameter(
        addOrReplaceUrlSearchParameter(
          relativeUrlNoSearch, newName, newValue
        ), newName, replaceVal);
      queryStringTest(result, newName, replaceVal);
    });
  });

  describe('stripSearchParameters', () => {
    it('should remove query string for absolute url', () => {
      expect(absoluteUrlNoSearch).to.equal(stripSearchParameters(absoluteUrlNoSearch));
    });

    it('should remove query string for relative url', () => {
      expect(relativeUrlNoSearch).to.equal(stripSearchParameters(relativeUrlSearch));
    });
  });

  describe('cacheBustRequest', () => {
    it('should add a cache bust param to absolute url', () => {
      const result = cacheBustRequest(absoluteUrlNoSearch);
      queryStringTest(result, 'sw-cache');
    });

    it('should add a cache bust param to absolute url with search', () => {
      const result = cacheBustRequest(absoluteUrlSearch);
      queryStringTest(result, 'sw-cache');
    });

    it('should add a cache bust param to relative url', () => {
      const result = cacheBustRequest(relativeUrlNoSearch);
      queryStringTest(result, 'sw-cache');
    });

    it('should add cache bust param to relative url with search', () => {
      const result = cacheBustRequest(relativeUrlSearch);
      queryStringTest(result, 'sw-cache');
    });
  });

  describe('dehydrateRequest', () => {
    it('should return expected object', (done) => {
      const bodyType = 'json';
      const body = 'hello';
      const request = {
        method: 'GET',
        url: 'https://123.456',
        bodyType: bodyType,
        body: body
      };
      const expected = JSON.parse(JSON.stringify(request));

      request[bodyType] = () => Promise.resolve(body);

      dehydrateRequest(request, bodyType).then((actual) => {
        expect(actual).to.eql(expected);
        done();
      }).catch((error) => {
        done(error);
      });
    });
  });

  describe('rehydrateRequest', () => {
    before(() => {
      testDomStart();
      global.Request = requestAPI;
      global.Blob = blobAPI;
    });

    after(() => {
      testDomStop();
      delete global.Blob;
      delete global.Request;
    });

    it('should create a Request from state', (done) => {
      const state = {
        url: 'https://123.456',
        method: 'GET',
        bodyType: 'json',
        body: {
          context: {
            '_csrf': 'A1B2C3D3'
          }
        }
      };
      const apiInfo = {
        xhrContext: {
          '_csrf': 'A1B2C3D4'
        }
      };

      const result = rehydrateRequest(state, apiInfo);

      expect(result.method).to.equal(state.method);
      expect(result.url).to.contain(state.url);
      expect(result.url).to.contain(apiInfo.xhrContext._csrf);
      expect(result.credentials).to.equal('include');
      result.json().then((rawBody) => {
        const body = JSON.parse(rawBody);
        expect(body).to.be.an('object').that.is.not.empty;
        expect(body.context).to.be.an('object').that.is.not.empty;
        expect(body.context._csrf).to.equal('A1B2C3D4');
        done();
      });
    });
  });
});
