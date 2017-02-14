/***
 * Copyright (c) 2016, 2017 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import { createStore } from 'fluxible/addons';

export const ContactStore = createStore({
  storeName: 'ContactStore',

  handlers: {
    'UPDATE_CONTACT_FIELDS': 'updateContactFields',
    'CREATE_CONTACT_SUCCESS': 'clearContactFields',
    'CREATE_CONTACT_FAILURE': 'setContactFailure'
  },

  /**
   * Set ContactStore initial state.
   */
  initialize: function () {
    this.name = '';
    this.email = '';
    this.message = '';
    this.failure = false;
  },

  /**
   * UPDATE_CONTACT_FIELDS action handler.
   *
   * @param {Object} fields - The contact fields.
   */
  updateContactFields: function (fields) {
    this.name = fields.name || '';
    this.email = fields.email || '';
    this.message = fields.message || '';
    this.emitChange();
  },

  /**
   * CREATE_CONTACT_SUCCESS action handler.
   */
  clearContactFields: function () {
    this.initialize();
    this.emitChange();
  },

  /**
   * CREATE_CONTACT_FAILURE action handler.
   */
  setContactFailure: function () {
    this.failure = true;
    this.emitChange();
  },

  /**
   * @returns {Boolean} true if contact failed, false otherwise.
   */
  getContactFailure: function () {
    return this.failure;
  },

  /**
   * @returns {Object} Contact field object with name, email, and message.
   */
  getContactFields: function () {
    return {
      name: this.name,
      email: this.email,
      message: this.message
    };
  },

  /**
   * Reduce this store to state.
   *
   * @returns {Object} This store as serializable state.
   */
  dehydrate: function () {
    const state = this.getContactFields();
    state.failure = this.failure;
    return state;
  },

  /**
   * Hydrate this store from state.
   *
   * @param {Object} state - The new ContactStore state.
   */
  rehydrate: function (state) {
    this.name = state.name;
    this.email = state.email;
    this.message = state.message;
    this.failure = state.failure;
  }
});

export default ContactStore;
