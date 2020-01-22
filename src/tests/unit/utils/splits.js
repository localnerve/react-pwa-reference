/**
 * Copyright (c) 2016 - 2020 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global before, describe, it */

import { expect } from 'chai';
import { createMockActionContext } from 'fluxible/utils';
import { splitHandlers as splits } from 'utils/splits';

describe('splits', () => {
  it('should expose settings split', () => {
    expect(splits).to.respondTo('settings');
  });

  describe('settings', () => {
    let context;
    const payload = {
      action: {
        name: 'settings'
      },
      component: 'settings'
    };
    const action = (context, payload, done) => {
      expect(context).to.respondTo('dispatch');
      expect(context).to.respondTo('getStore');
      expect(context).to.respondTo('executeAction');
      if (payload.emulateError) {
        return done(new Error('mock'));
      }
      return done();
    };

    before(() => {
      context = createMockActionContext();
    });

    it('should resolve successfully', (done) => {
      splits.settings(context, payload, action).then(() => {
        done();
      }).catch((error) => {
        done(error);
      });
    });

    it('should reject as expected', (done) => {
      payload.emulateError = true;

      function complete (error) {
        delete payload.emulateError;
        done(error);
      }

      splits.settings(context, payload, action).then(() => {
        complete(new Error('should have thrown an error'));
      }).catch(() => {
        complete();
      });
    });
  });
});
