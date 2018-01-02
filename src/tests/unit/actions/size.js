/**
 * Copyright (c) 2016 - 2018 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global describe, it, beforeEach */

import { expect } from 'chai';
import { createMockActionContext } from 'fluxible/utils';
import { updateSize as sizeAction } from 'application/actions/size';
import { BackgroundStore } from 'application/stores/BackgroundStore';

describe('size action', () => {
  const params = {
    width: 1,
    height: 2,
    top: 3,
    accumulate: false
  };
  let context;

  // create the action context wired to BackgroundStore
  beforeEach(() => {
    context = createMockActionContext({
      stores: [ BackgroundStore ]
    });
  });

  it('should update the background store', (done) => {
    // TODO: add listener to store to get the whole story
    context.executeAction(sizeAction, params, (err) => {
      if (err) {
        return done(err);
      }

      const store = context.getStore(BackgroundStore);
      expect(store.getTop()).to.equal(params.top);

      done();
    });
  });
});
