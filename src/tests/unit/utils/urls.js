/**
 * Copyright (c) 2016 - 2022 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global describe, it, before */

import { expect } from 'chai';
import urlm from 'utils/urls';

describe('urls', () => {
  describe('hostname method', () => {
    const sigRepl = 'SNAME';
    const hostRepl = 'HOST';
    const testUrlCount = 13;

    const hostTemplates = [
      'this.'+sigRepl+'.com',
      sigRepl+'.com',
      '123456.'+sigRepl+'.com',
      '123456.'+sigRepl+'.com',
      '123456.'+sigRepl+'.com',
      'this.'+sigRepl+'.com',
      'this.'+sigRepl+'.com',
      sigRepl,
      sigRepl,
      '123456.'+sigRepl+'.com',
      '123456.'+sigRepl+'.com:3000',
      '123456.'+sigRepl+'.com:3000',
      '123456.'+sigRepl+'.com'
    ];
    const testUrlTemplates = [
      'https://'+hostRepl+'/something/?',
      'http://'+hostRepl,
      'http://'+hostRepl,
      'http://'+hostRepl+'?q=r',
      'http://'+hostRepl+'#hash',
      'https://'+hostRepl+'/something/else',
      'https://'+hostRepl+'/something/else.html',
      'http://'+hostRepl,
      'http://'+hostRepl+'/',
      'https://'+hostRepl,
      '//'+hostRepl,
      '//'+hostRepl+'/something',
      'http://'+hostRepl+'/12x12/something/http://another.host.com/image/0.jpg'
    ];
    const significantNames = [];
    const hosts = [];
    const testUrls = [];

    before(() => {
      let i;

      for (i = 0; i < testUrlCount; i++) {
        significantNames.push('significant-'+i);
      }
      for (i = 0; i < testUrlCount; i++) {
        hosts.push(hostTemplates[i].replace(sigRepl, significantNames[i]));
      }
      for (i = 0; i < testUrlCount; i++) {
        testUrls.push(testUrlTemplates[i].replace(hostRepl, hosts[i]));
      }
    });

    describe('getHostname', () => {
      it('should retrieve hostname from urls', () => {
        testUrls.forEach((url, index) => {
          expect(urlm.getHostname(url)).to.eql(hosts[index].replace(/:.+$/, ''));
        });
      });
    });

    describe('getSignificantHostname', () => {
      it('should retrieve signicant hostname from urls', () => {
        testUrls.forEach((url, index) => {
          expect(urlm.getSignificantHostname(url)).to.eql(significantNames[index]);
        });
      });
    });
  });

  describe('path method', () => {
    const test1 = 'search';
    const test2 = 'search-item.html';
    const pathRepl = 'RPATH';
    const pathTemplates = [
      'https://www.google.com:3000/dir/1/2/RPATH?arg=0-a&arg1=1-b&arg3-c#hash',
      'https://www.google.com:3000/dir/1/2/RPATH/?arg=0-a&arg1=1-b&arg3-c#hash',
      'https://www.google.com:3000/dir/1/2/RPATH#hash',
      'https://www.google.com:3000/dir/1/2/RPATH',
      'https://www.google.com:3000/dir/1/2/RPATH/',
      '/dir/1/2/RPATH',
      '/dir/1/2/RPATH/',
      'dir/1/2/RPATH',
      'dir/1/2/RPATH/',
      'RPATH',
      'RPATH/'
    ];
    const paths1 = [];
    const paths2 = [];

    before(() => {
      pathTemplates.forEach((path) => {
        paths1.push(path.replace(pathRepl, test1));
      });
      pathTemplates.forEach((path) => {
        paths2.push(path.replace(pathRepl, test2));
      });
    });

    describe('getLastPathSegment', () => {
      it('should retrieve the last path segment from urls, paths, files: Simple segment', () => {
        paths1.forEach((path) => {
          const last = urlm.getLastPathSegment(path);
          expect(last).to.eql(test1);
        });
      });

      it('should retrieve the last path segment from urls, paths, files: Delimited segment', () => {
        paths2.forEach((path) => {
          const last = urlm.getLastPathSegment(path);
          expect(last).to.eql(test2);
        });
      });
    });
  });
});
