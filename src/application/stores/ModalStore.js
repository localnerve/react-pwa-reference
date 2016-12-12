/***
 * Copyright (c) 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import { createStore } from 'fluxible/addons';

export const ModalStore = createStore({
  storeName: 'ModalStore',

  handlers: {
    'MODAL_START': 'modalStart',
    'RECEIVE_PAGE_CONTENT': 'updateProps',
    'MODAL_COMPONENT': 'updateComponent',
    'MODAL_FAILURE': 'modalFailure',
    'MODAL_STOP': 'modalStop'
  },

  /**
   * Set inital store state.
   */
  initialize: function () {
    this.isOpen = false;
    this.currentComponent = '';
    this.components = {};
    this.failure = false;
    this.props = null;
  },

  /**
   * MODAL_START handler.
   * Start a modal dialog.
   *
   * @param {Object} payload - The MODAL_START action payload.
   * @param {Object} [payload.props] - The props for the UI component.
   * @param {String} payload.component- The UI component resource name.
   */
  modalStart: function (payload) {
    if (!this.isOpen) {
      this.props = payload.props;
      this.currentComponent = payload.component;
      this.isOpen = true;
      this.failure = false;
      this.emitChange();
    }
  },

  /**
   * RECEIVE_PAGE_CONTENT handler.
   * Updates the props for a modal dialog.
   *
   * @param {Object} payload - The RECEIVE_PAGE_CONTENT action payload.
   * @param {Object} payload.data - The props for the UI component.
   */
  updateProps: function (payload) {
    this.props = payload.data;
    this.emitChange();
  },

  /**
   * MODAL_COMPONENT handler.
   * Updates the component for the given resource.
   *
   * @param {Object} payload - The MODAL_COMPONENT action payload.
   * @param {String} payload.resource - The component resource to update.
   * @param {Object} payload.component - The new component.
   */
  updateComponent: function (payload) {
    if (!payload || !payload.hasOwnProperty('resource')) {
      return;
    }

    this.components[payload.resource] = payload.component;
    this.emitChange();
  },

  /**
   * MODAL_STOP handler.
   * Stop a modal dialog.
   */
  modalStop: function () {
    this.isOpen = false;
    this.currentComponent = '';
    this.props = null;
    this.failure = false;
    this.emitChange();
  },

  /**
   * MODAL_FAILURE handler.
   *
   * @param {Object} payload - the MODAL_FAILURE payload.
   * This is the current component props, typically just an Error object.
   */
  modalFailure: function (payload) {
    this.props = payload;
    this.failure = true;
    this.emitChange();
  },

  /**
   * @returns {Object} The current modal UI component.
   */
  getComponent: function () {
    return this.components[this.currentComponent];
  },

  /**
   * @returns {String} The current modal component name.
   */
  getComponentName: function () {
    return this.currentComponent;
  },

  /**
   * @returns {Boolean} The isOpen boolean.
   */
  getIsOpen: function () {
    return this.isOpen;
  },

  /**
   * @returns {Object} The modal UI component props.
   */
  getProps: function () {
    return this.props;
  },

  /**
   * @returns {Boolean} The failure boolean.
   */
  getFailure: function () {
    return this.failure;
  },

  /**
   * @returns {Object} The ModalStore state.
   */
  dehydrate: function () {
    return {
      currentComponent: this.currentComponent,
      components: this.components,
      props: this.props,
      isOpen: this.isOpen,
      failure: this.failure
    };
  },

  /**
   * Hydrate the ModalStore from the given state.
   *
   * @param {Object} state - The new ModalStore state.
   */
  rehydrate: function (state) {
    this.currentComponent = state.currentComponent;
    this.components = state.components;
    this.props = state.props;
    this.isOpen = state.isOpen;
    this.failure = state.failure;
  }
});

export default ModalStore;
