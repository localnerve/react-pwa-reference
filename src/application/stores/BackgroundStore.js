/***
 * Copyright (c) 2016, 2017 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import { createStore } from 'fluxible/addons';
import debounce from 'lodash/debounce';
import { buildImageUrl } from 'utils/imageServiceUrls';

export const BackgroundStore = createStore({
  storeName: 'BackgroundStore',

  handlers: {
    'UPDATE_SIZE': 'updateSize',
    'INIT_APP': 'initBackgrounds',
    'NAVIGATE_SUCCESS': 'updateBackground'
  },

  /**
   * Set initial store state.
   * Wire up debounced sizeChange handler.
   */
  initialize: function () {
    this.width = 0;
    this.height = 0;
    this.top = 0;
    this.currentBackground = '';
    this.imageServiceUrl = '';
    this.imageServiceOptions = {};
    this.backgroundUrls = {};

    /**
     * Emits size change updates (debounced).
     */
    this.sizeChange = debounce(function sizeChange () {
      this.updateBackgroundUrls({
        backgrounds: Object.keys(this.backgroundUrls)
      });
      this.emitChange();
    }.bind(this), 50);
  },

  /**
   * UPDATE_SIZE action handler.
   *
   * @param {Object} payload - The payload for the update size action.
   * @param {Boolean} [payload.accumulate] - Boolean indicating the size updates are additive.
   * @param {Number} [payload.width] - The width dimension of the size update.
   * @param {Number} [payload.height] - The height dimension of the size update.
   * @param {Number} [payload.top] - The top measurement of the size update.
   */
  updateSize: function (payload) {
    if (payload.accumulate) {
      this.width += payload.width || 0;
      this.height += payload.height || 0;
    } else {
      this.width = payload.width || 0;
      this.height = payload.height || 0;
    }
    if (payload.top) {
      this.top = payload.top;
    }
    this.sizeChange();
  },

  /**
   * INIT_APP action handler.
   *
   * @param {Object} payload - The payload for the init app action.
   * @param {Object} payload.backgrounds - The part of the payload this Store is interested in.
   * @param {String} payload.backgrounds.serviceUrl - The protocol and host of the image service.
   * @param {String} payload.backgrounds.currentBackground - The name of the current background.
   * @param {Object} payload.backgrounds.serviceOptions - service specific options.
   */
  initBackgrounds: function (payload) {
    const init = payload.backgrounds;
    if (init) {
      this.imageServiceUrl = init.serviceUrl;
      this.imageServiceOptions = init.serviceOptions || {};
      this.currentBackground = init.currentBackground;
      this.updateBackgroundUrls(init);
      this.emitChange();
    }
  },

  /**
   * NAVIGATE_SUCCESS action handler.
   * Updates the current background name.
   *
   * @param {Object} navigate - A fluxible navigate object.
   * @param {Object} navigate.route - The current route object.
   */
  updateBackground: function (navigate) {
    if (this.currentBackground !== navigate.route.background) {
      this.currentBackground = navigate.route.background;
      this.emitChange();
    }
  },

  /**
   * Updates the private background urls collection.
   * The private background urls are full urls including a width and height
   *  to the image service.
   *
   * @param {Object} payload - The update backgrounds payload.
   * @param {Array} payload.backgrounds - An array of background names.
   * @private
   */
  updateBackgroundUrls: function (payload) {
    payload.backgrounds.forEach(function (key) {
      if (key) {
        this.backgroundUrls[key] = buildImageUrl(
          this.imageServiceUrl, {
            width: this.width,
            height: this.height,
            name: key,
            serviceOptions: this.imageServiceOptions
          }
        );
      }
    }, this);
  },

  /**
   * @returns {String} The image service url.
   */
  getImageServiceUrl: function () {
    return this.imageServiceUrl;
  },

  /**
   * @returns {Number} The top measurement
   */
  getTop: function () {
    return this.top;
  },

  /**
   * @returns {Number} The height dimension.
   */
  getHeight: function () {
    return this.height;
  },

  /**
   * @returns {Array} The backgroundUrls that are not the current background.
   */
  getNotCurrentBackgroundUrls: function () {
    return Object.keys(this.backgroundUrls).filter(function (key) {
      return key !== this.currentBackground;
    }, this).map(function (notCurrent) {
      return this.backgroundUrls[notCurrent];
    }, this);
  },

  /**
   * @returns {String} The current backgroundUrl.
   */
  getCurrentBackgroundUrl: function () {
    if (this.width && this.height) {
      return this.backgroundUrls[this.currentBackground];
    }
    return null;
  },

  /**
   * Reduce this store to state.
   *
   * @returns {Object} This store as state.
   */
  dehydrate: function () {
    return {
      width: this.width,
      height: this.height,
      top: this.top,
      currentBackground: this.currentBackground,
      imageServiceUrl: this.imageServiceUrl,
      imageServiceOptions: this.imageServiceOptions,
      backgroundUrls: this.backgroundUrls
    };
  },

  /**
   * Hydrate this store from state.
   *
   * @param {Object} state - That state to hydrate this store from.
   */
  rehydrate: function (state) {
    this.width = state.width;
    this.height = state.height;
    this.top = state.top;
    this.currentBackground = state.currentBackground;
    this.imageServiceUrl = state.imageServiceUrl;
    this.imageServiceOptions = state.imageServiceOptions;
    this.backgroundUrls = state.backgroundUrls;
  }
});

export default BackgroundStore;
