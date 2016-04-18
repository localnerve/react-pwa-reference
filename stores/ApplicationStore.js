/***
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import { createStore } from 'fluxible/addons';

const applicationStore = createStore({
  storeName: 'ApplicationStore',

  handlers: {
    'INIT_APP': 'initApplication',
    'UPDATE_PAGE_TITLE': 'updatePageTitle'
  },

  initialize: function () {
    this.currentPageTitle = '';
    this.defaultPageName = '';
  },

  /**
   * INIT_APP handler.
   * Initialize application data from payload.page.
   *
   * @param {Object} payload - The INIT_APP action payload.
   * @param {Object} payload.page - Application data the ApplicationStore is interested in.
   * @param {String} payload.page.defaultPageName - The default page name.
   */
  initApplication: function (payload) {
    const init = payload.page;
    if (init) {
      this.defaultPageName = init.defaultPageName;
      this.emitChange();
    }
  },

  /**
   * UPDATE_PAGE_TITLE handler.
   * Update the application page title.
   *
   * @param {Object} page - The UPDATE_PAGE_TITLE action payload.
   * @param {String} page.title - The new page title.
   */
  updatePageTitle: function (page) {
    this.currentPageTitle = page.title;
    this.emitChange();
  },

  /**
   * @returns {String} The default page name for the application.
   */
  getDefaultPageName: function () {
    return this.defaultPageName;
  },

  /**
   * @returns {String} The current page title for the application.
   */
  getCurrentPageTitle: function () {
    return this.currentPageTitle;
  },

  /**
   * @returns {Object} The ApplicationStore state.
   */
  dehydrate: function () {
    return {
      pageTitle: this.currentPageTitle,
      defaultPageName: this.defaultPageName
    };
  },

  /**
   * Hydrate the ApplicationStore from the given state.
   *
   * @param {Object} state - The new ApplicationStore state.
   */
  rehydrate: function (state) {
    this.currentPageTitle = state.pageTitle;
    this.defaultPageName = state.defaultPageName;
  }
});

export const ApplicationStore = applicationStore;
export default ApplicationStore;
