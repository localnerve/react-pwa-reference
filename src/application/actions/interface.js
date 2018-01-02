/**
 * Copyright (c) 2016 - 2018 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * The actions that are eligible to be referenced from the backend data service.
 *
 * This interface can be (and is) augmented dynamically as the backend defines
 * lazy loaded actions (and components, etc) it is interested in using.
 * @see utils/splits.js
 * @see actions/modal.js
 */
import { page } from './page';

const actions = Object.create(null);
actions.page = page;

/**
 * Get all actions available for backend reference.
 *
 * @returns {Object} Action creators available for backend reference.
 */
export function getActions () {
  return actions;
}

/**
 * Add or replace an action to make it available to backend reference.
 *
 * @param {String} name - The public name of the action.
 * @param {Function} action - The action creator to add.
 */
export function putAction (name, action) {
  actions[name] = action;
}

export default {
  getActions,
  putAction
}
