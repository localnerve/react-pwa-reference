/**
 * Copyright (c) 2016 - 2021 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global describe, it, before, beforeEach, after, afterEach */
import { expect } from 'chai';
import { BackgroundStore } from 'application/stores/BackgroundStore';

describe('Background store', () => {
  let onChange, storeInstance;
  const route = {
    background: '2'
  };
  const navigatePayload = {
    route: route
  };
  const initPayload = {
    backgrounds: {
      serviceUrl: 'https://lorempixel.com',
      serviceOptions: {
        host: 'amazonaws.amazon.com',
        ssl: true,
        path: '/some/bucket'
      },
      backgrounds: ['1', '2']
    }
  };

  beforeEach(() => {
    storeInstance = new BackgroundStore();
  });

  afterEach(() => {
    if (onChange) {
      storeInstance.removeChangeListener(onChange);
      onChange = null;
    }
  });

  it('should instantiate correctly', () => {
    expect(BackgroundStore.storeName).to.equal('BackgroundStore');
    expect(storeInstance).to.be.an('object');
    expect(storeInstance.width).to.equal(0);
    expect(storeInstance.height).to.equal(0);
    expect(storeInstance.top).to.equal(0);
    expect(storeInstance.currentBackground).to.equal('');
    expect(storeInstance.imageServiceUrl).to.equal('');
    expect(storeInstance.imageServiceOptions).to.be.an('object').that.is.empty;
    expect(storeInstance.backgroundUrls).to.be.an('object').that.is.empty;
  });

  describe('de/rehydrate', () => {
    const dim = {
      width: 4,
      height: 5,
      top: 6
    };

    it('should dehydrate', (done) => {
      let callbacks = 0;
      function result () {
        if (++callbacks < 2) {
          return;
        }

        expect(callbacks).to.be.at.most(3);

        const state = storeInstance.dehydrate();

        expect(state.width).to.equal(dim.width);
        expect(state.height).to.equal(dim.height);
        expect(state.top).to.equal(dim.top);
        expect(state.currentBackground).to.contain(route.background);
        expect(state.imageServiceUrl).to.equal(initPayload.backgrounds.serviceUrl);
        expect(state.imageServiceOptions).to.eql(initPayload.backgrounds.serviceOptions);
        expect(Object.keys(state.backgroundUrls).length).to.equal(2);

        done();
      }

      storeInstance.addChangeListener(onChange = result);
      storeInstance.initBackgrounds(initPayload);
      storeInstance.updateSize(dim);
      storeInstance.updateBackground(navigatePayload);
    });

    it('should rehydrate', () => {
      const currentUrl = 'two/2';
      const notCurrentUrl = 'one/1';
      const state = Object.assign({}, dim, {
        currentBackground: route.background,
        imageServiceUrl: initPayload.backgrounds.serviceUrl,
        imageServiceOptions: initPayload.backgrounds.serviceOptions,
        backgroundUrls: { '1': notCurrentUrl, '2': currentUrl }
      });

      storeInstance.rehydrate(state);

      expect(storeInstance.width).to.equal(dim.width);
      expect(storeInstance.height).to.equal(dim.height);
      expect(storeInstance.getTop()).to.equal(dim.top);
      expect(storeInstance.getImageServiceUrl()).to.equal(initPayload.backgrounds.serviceUrl);
      expect(storeInstance.imageServiceOptions).to.eql(initPayload.backgrounds.serviceOptions);
      expect(storeInstance.getCurrentBackgroundUrl()).to.equal(currentUrl);
      expect(storeInstance.getNotCurrentBackgroundUrls()).to.have.length(1)
        .and.contain(notCurrentUrl);
    });
  });

  describe('init backgrounds', () => {
    it('should init background store as expected', (done) => {
      function result () {
        expect(storeInstance.getImageServiceUrl()).to.equal(initPayload.backgrounds.serviceUrl);
        expect(storeInstance.imageServiceOptions).to.eql(initPayload.backgrounds.serviceOptions);
        expect(Object.keys(storeInstance.backgroundUrls).length).to.equal(2);
        // Background names are the key and we expect them to be in the urls
        Object.keys(storeInstance.backgroundUrls).forEach(function (key) {
          expect(initPayload.backgrounds.backgrounds).to.contain(key);
          expect(storeInstance.backgroundUrls[key]).to.contain(key);
          // the width and height were not set, so there should be a couple zeros in there somewhere.
          expect(storeInstance.backgroundUrls[key]).to.contain('0');
        });
        done();
      }
      storeInstance.addChangeListener(onChange = result);
      storeInstance.initBackgrounds(initPayload);
    });
  });

  describe('update background', () => {
    beforeEach(() => {
      storeInstance.initBackgrounds(initPayload);
    });

    it('should be null when no width and height set', (done) => {
      function result () {
        expect(storeInstance.getCurrentBackgroundUrl()).to.be.null;
        done();
      }
      storeInstance.addChangeListener(onChange = result);
      storeInstance.updateBackground(navigatePayload);
    });

    it('should update current background', (done) => {
      let callbacks = 0;
      const dimension = 5;

      function result () {
        if (++callbacks < 2) {
          // first time, its for updateSize
          storeInstance.updateBackground(navigatePayload);
          return;
        }

        // sanity
        expect(callbacks).to.be.at.most(2);

        // second time, its for updateBackground
        const backgroundUrl = storeInstance.getCurrentBackgroundUrl();
        expect(backgroundUrl).to.contain(initPayload.backgrounds.serviceUrl);
        expect(backgroundUrl).to.contain(dimension);
        expect(backgroundUrl).to.contain(route.background);

        // also check non-current, should be the remainder of not route.get('background')
        const nonCurrent = storeInstance.getNotCurrentBackgroundUrls();
        expect(nonCurrent.length).to.equal(1);
        expect(nonCurrent[0]).to.contain('1');

        done();
      }

      storeInstance.addChangeListener(onChange = result);
      storeInstance.updateSize({ width: dimension, height: dimension });
    });
  });

  describe('update size', () => {
    // separate instance because of accumulating
    let sizeInstance;

    before(() => {
      sizeInstance = new BackgroundStore();
    });

    const payloads = [{
      width: 100,
      height: 100
    }, {
      height: 10,
      top: 10,
      accumulate: true
    }, {
      width: 200,
      height: 200
    }, {
      height: 100,
      top: 200
    }, {
      width: 200,
      height: 200,
      accumulate: true
    }];

    it('should set a width and height', () => {
      sizeInstance.updateSize(payloads[0]);
      expect(sizeInstance.width).to.equal(100);
      expect(sizeInstance.height).to.equal(100);
      expect(sizeInstance.getTop()).to.equal(0);
    });

    it('should increment height and set a top', () => {
      sizeInstance.updateSize(payloads[1]);
      expect(sizeInstance.width).to.equal(100);
      expect(sizeInstance.height).to.equal(110);
      expect(sizeInstance.getTop()).to.equal(10);
    });

    it('should reset width and height', () => {
      sizeInstance.updateSize(payloads[2]);
      expect(sizeInstance.width).to.equal(200);
      expect(sizeInstance.height).to.equal(200);
      expect(sizeInstance.getTop()).to.equal(10);
    });

    it('should assign a height and top', () => {
      sizeInstance.updateSize(payloads[3]);
      expect(sizeInstance.width).to.equal(0);
      expect(sizeInstance.height).to.equal(100);
      expect(sizeInstance.getTop()).to.equal(200);
    });

    it('should increment height, keep top, and set width', () => {
      sizeInstance.updateSize(payloads[4]);
      expect(sizeInstance.width).to.equal(200);
      expect(sizeInstance.height).to.equal(300);
      expect(sizeInstance.getTop()).to.equal(200);
    });

    describe('cumulative change updates', () => {
      let onChange;

      before(() => {
        sizeInstance.initBackgrounds(initPayload);
      });

      after(() => {
        if (onChange) {
          sizeInstance.removeChangeListener(onChange);
          onChange = null;
        }
      });

      it('should accumulate and reflect in the properties and background urls', (done) => {
        // If this was called more than once the size properties would be wrong
        function result () {
          expect(sizeInstance.width).to.equal(200);
          expect(sizeInstance.height).to.equal(300);
          expect(sizeInstance.getTop()).to.equal(200);
          expect(Object.keys(sizeInstance.backgroundUrls).length).to.equal(2);

          Object.keys(sizeInstance.backgroundUrls).forEach((key) => {
            expect(sizeInstance.backgroundUrls[key]).to.contain(200);
            expect(sizeInstance.backgroundUrls[key]).to.contain(300);
          });

          done();
        }

        sizeInstance.addChangeListener(onChange = result);
        sizeInstance.updateBackgroundUrls({
          backgrounds: ['1', '2']
        });
        sizeInstance.updateSize(payloads[3]);
        sizeInstance.updateSize(payloads[4]);
      });
    });
  });
});
