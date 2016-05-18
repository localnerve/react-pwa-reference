/**
 * Copyright (c) 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global after, describe, it, before, beforeEach */

const expect = require('chai').expect;
const testDom = require('test/utils/testdom');
const jsonToFluxible = require('utils').createFluxibleRouteTransformer({
  actions: require('application/actions/interface').getActions()
}).jsonToFluxible;

describe('application component', () => {
  let createMockComponentContext, context, appElement,
    ContentStore, RouteStore, ContactStore, BackgroundStore, ModalStore,
    serviceData, routesResponse, fluxibleRoutes, fluxibleApp,
    React, testUtils,
    routes;

  /**
   * OMG this sux. I'm disappointed in this development. :-(
   * This became required during the React 0.14 / Fluxible 1.0 update.
   * This could just mean the app is faster, but harder to test.
   * This could mean the mocks are now not "mocky" enough. (not fake/deep enough)
   *
   * NOTE: if timeout param approaches ~1500, then you have to this.timeout(),
   * a similar amount in the test. I'm not bumping it automagically in here.
   * (standard timeout is 2000)
   *
   * WHY:
   * This allows the app to perform async things it expects in a browser
   * environment (while jsdom is still around) for <timeout> seconds
   * before declaring the test done and allowing jsdom to be dismantled.
   *
   * exists to wrap timeout call in case more hackery required.
   */
  function settle (timeout, done) {
    setTimeout(done, timeout);
  }

  before('setup', (done) => {
    // We'll be rendering the isomorphic component, so set dom env for react here
    testDom.start();

    // Now proceed to load modules that might use React
    createMockComponentContext =
      require('fluxible/utils').createMockComponentContext;
    ContentStore =
      require('application/stores/ContentStore').ContentStore;
    RouteStore =
      require('application/stores/RouteStore').RouteStore;
    ContactStore =
      require('application/stores/ContactStore').ContactStore;
    BackgroundStore =
      require('application/stores/BackgroundStore').BackgroundStore;
    ModalStore = require('application/stores/ModalStore').ModalStore;
    serviceData = require('test/mocks/service-data');
    routesResponse = require('test/fixtures/routes-response');
    fluxibleRoutes = jsonToFluxible(routesResponse);
    fluxibleApp = require('application/app').default;
    React = require('react');
    testUtils = require('react-addons-test-utils');

    routes = {
      home: Object.assign({}, fluxibleRoutes.home, {
        url: '/',
        name: 'home',
        params: {},
        query: {}
      }),
      about: Object.assign({}, fluxibleRoutes.about, {
        url: '/about',
        name: 'about',
        params: {},
        query: {}
      }),
      contact: Object.assign({}, fluxibleRoutes.contact, {
        url: '/contact',
        name: 'contact',
        params: {},
        query: {}
      })
    };

    settle(250, done);
  });

  after(() => {
    testDom.stop();
  });

  function createContextAndApp (routeName, content, makePath) {
    context = createMockComponentContext({
      stores: [
        ContentStore,
        RouteStore,
        ContactStore,
        BackgroundStore,
        ModalStore
      ]
    });
    context.makePath = makePath;

    const routeStore = context.getStore(RouteStore);
    const contentStore = context.getStore(ContentStore);

    routeStore._handleReceiveRoutes(fluxibleRoutes);
    routeStore._handleNavigateStart(routes[routeName]);
    routeStore._handleNavigateSuccess(routes[routeName]);
    contentStore.receivePageContent(content);

    appElement = React.createElement(fluxibleApp.getComponent(), {
      context: context
    });
  }

  describe('home', () => {
    let homePage;

    function makeHomePath () {
      return '/';
    }

    before('home', () => {
      homePage = {
        resource: routesResponse.home.action.params.resource
      };

      serviceData.fetch(homePage, (err, data) => {
        if (err) {
          throw err;
        }
        homePage.data = data;
      });
    });

    beforeEach(() => {
      createContextAndApp('home', homePage, makeHomePath);
    });

    it('should render home content', (done) => {
      // Get composite component in document
      const app =
        testUtils.renderIntoDocument(appElement);

      const components =
        testUtils.scryRenderedDOMComponentsWithClass(app, 'page-content');

      // 'Home' content comes from service-data
      expect(components[0].textContent).to.match(/Welcome/i);

      settle(250, done);
    });

    it('should render home navigation', (done) => {
      const app =
        testUtils.renderIntoDocument(appElement);

      // throws if not exactly 1
      const component =
        testUtils.findRenderedDOMComponentWithClass(app, 'selected');

      expect(component.textContent).to.match(/Home/i);

      settle(250, done);
    });
  });

  describe('contact', () => {
    let contactPage;

    function makeContactPath () {
      return '/contact';
    }

    before('contact', () => {
      contactPage = {
        resource: routesResponse.contact.action.params.resource
      };

      serviceData.fetch(contactPage, (err, data) => {
        if (err) {
          throw err;
        }
        contactPage.data = data;
      });
    });

    beforeEach(() => {
      createContextAndApp('contact', contactPage, makeContactPath);
    });

    it('should render contact content', (done) => {
      const app =
        testUtils.renderIntoDocument(appElement);

      const component =
        testUtils.findRenderedDOMComponentWithClass(app, 'selected');

      expect(component.textContent).to.match(/Contact/i);

      settle(250, done);
    });

    it.skip('should respond to enter', (done) => {
      const app =
        testUtils.renderIntoDocument(appElement);

      const formInput =
        testUtils.findRenderedDOMComponentWithClass(app, 'form-value-element');

      formInput.value = 'test';

      testUtils.simulate.change(formInput);
      testUtils.simulate.keyDown(formInput, {
        key: 'Enter',
        keyCode: 13,
        which: 13
      });

      const listItem =
        testUtils.findRenderedDOMComponentWithClass(
          app, 'contact-steps current'
        );
      expect(listItem.textContent).to.match(/email/i);

      settle(250, done);
    });
  });
});
