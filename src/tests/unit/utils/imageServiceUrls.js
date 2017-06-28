/**
 * Copyright (c) 2016, 2017 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global before, describe, it */

import { expect } from 'chai';
import imageServiceUrls from 'utils/imageServiceUrls';

describe('imageServiceUrls', () => {
  it('should export expected operations', () => {
    expect(imageServiceUrls).to.respondTo('buildImageUrl');
  });

  describe('buildImageUrl', () => {
    let buildImageUrl, url;

    before('buildImageUrl', () => {
      buildImageUrl = imageServiceUrls.buildImageUrl;
    });

    it('should fail for non-supported service', () => {
      expect(() => {
        buildImageUrl('https://notsupported.net', {});
      }).to.throw(Error);
    });

    describe('lorempixel', () => {
      const serviceUrl = 'https://lorempixel.com';
      const width = 10;
      const height = 20;

      /**
       * Test the buildImageUrl function with a different name input.
       * @param {String} name - The image name.
       * @param {Boolean} contains - true if url should contain name.
       */
      function testImageName (name, contains) {
        url = buildImageUrl(serviceUrl, {
          width: width,
          height: height,
          name: name,
          serviceOptions: {}
        });

        expect(url).to.match(new RegExp('^' + serviceUrl));
        expect(url).to.contain(width);
        expect(url).to.contain(height);
        if (contains) {
          expect(url).to.contain(name);
        } else {
          expect(url).to.not.contain(name);
        }
        expect(url).to.match(/[1-9]\/$/);
      }

      it('should build a lorempixel url with random numeric image', () => {
        testImageName('tester');
      });

      it('should build a lorempixel url from image base name, not zero', () => {
        testImageName('0.jpg');
      });

      it('should build a lorempixel url from image base name', () => {
        const imageName = '4';
        const name = `${imageName}.jpg`;

        testImageName(name);
        expect(url).to.match(new RegExp(imageName + '/$'));
      });

      it('should build a lorempixel url from image name', () => {
        const name = '4';

        testImageName(name, true);
        expect(url).to.match(new RegExp(name + '/$'));
      });
    });

    describe('cloudinary', () => {
      const cloudName = 'cloud';
      const width = 100;
      const height = 200;
      const imageName = 'image';
      const cropMode = 'mymode';
      const serviceUrl = 'https://res.cloudinary.com';
      let matches;

      function basicTests (url) {
        // should start with the serviceUrl
        expect(url).to.match(new RegExp('^' + serviceUrl));

        // should be one occurrence of width in the request
        matches = url.match(new RegExp('([^\\d]'+width+'[^\\d])', 'g'));
        expect(matches || []).to.have.length(1);

        // should be one occurrence of height in the request
        matches = url.match(new RegExp('([^\\d]'+height+'[^\\d])', 'g'));
        expect(matches || []).to.have.length(1);

        expect(url).to.contain(imageName);
        expect(url).to.contain(cloudName);
      }

      it('should build a request, no cropMode', () => {
        url = buildImageUrl(serviceUrl, {
          serviceOptions: {
            cloudName: cloudName
          },
          width: width,
          height: height,
          name: imageName
        });

        basicTests(url);

        // should default to c_fill
        expect(url).to.contain('c_fill');
      });

      it('should build a request, with cropMode', () => {
        url = buildImageUrl(serviceUrl, {
          serviceOptions: {
            cloudName: cloudName,
            cropMode: cropMode
          },
          width: width,
          height: height,
          name: imageName
        });

        basicTests(url);

        expect(url).to.contain(cropMode);
      });

      it('should reduce size of jpgs', () => {
        url = buildImageUrl(serviceUrl, {
          serviceOptions: {
            cloudName: cloudName
          },
          width: width,
          height: height,
          name: 'name.jpg'
        });

        basicTests(url);

        expect(url).to.contain('fl_progressive');
        expect(url).to.contain('q_');
      });
    });
  });
});
