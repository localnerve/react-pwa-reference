/**
 * Copyright (c) 2016 - 2019 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global describe, it, beforeEach */

import { expect } from 'chai';
import { createMockActionContext } from 'fluxible/utils';
import { init as initAction } from 'application/actions/init';
import { BackgroundStore } from 'application/stores/BackgroundStore';

describe('init action', function () {
  const params = {
    backgrounds: {
      serviceUrl: 'https://lorempixel.com',
      backgrounds: ['1', '2']
    }
  };
  let context;

  // create the action context wired to BackgroundStore
  beforeEach(() => {
    context = createMockActionContext({
      stores: [ BackgroundStore ]
    });
  });

  it('should update the background store', (done) => {
    context.executeAction(initAction, params, (err) => {
      if (err) {
        return done(err);
      }

      const store = context.getStore(BackgroundStore);

      expect(store.getImageServiceUrl()).to.equal(params.backgrounds.serviceUrl);
      expect(Object.keys(store.backgroundUrls)).to.have.length(2);

      done();
    });
  });
});
