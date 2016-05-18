/**
 * Copyright (c) 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global require, after, describe, it, before, beforeEach */
import { expect } from 'chai';
import testDom from 'test/utils/testdom';
import { createFluxibleRouteTransformer } from 'utils';

const jsonToFluxible = createFluxibleRouteTransformer({
  actions: require('application/actions/interface').getActions()
}).jsonToFluxible;

describe('application component', () => {
  let componentContext, appElement,
    createMockActionContext, createMockComponentContext, MockService,
    serviceMail,
    ContentStore, RouteStore, ContactStore, BackgroundStore, ModalStore,
    serviceData, routesResponse, fluxibleRoutes, fluxibleApp,
    React, testUtils;

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
    createMockActionContext =
      require('fluxible/utils').createMockActionContext;
    MockService =
      require('fluxible-plugin-fetchr/utils/MockServiceManager');
    serviceMail =
      require('test/mocks/service-mail');
    ContentStore =
      require('application/stores/ContentStore').ContentStore;
    RouteStore =
      require('application/stores/RouteStore').RouteStore;
    ContactStore =
      require('application/stores/ContactStore').ContactStore;
    BackgroundStore =
      require('application/stores/BackgroundStore').BackgroundStore;
    ModalStore =
      require('application/stores/ModalStore').ModalStore;
    serviceData =
      require('test/mocks/service-data');
    routesResponse =
      require('test/fixtures/routes-response');
    fluxibleRoutes =
      jsonToFluxible(routesResponse);
    fluxibleApp =
      require('application/app').default;
    React =
      require('react');
    testUtils =
      require('react-addons-test-utils');

    settle(250, done);
  });

  after(() => {
    testDom.stop();
  });

  function createContextAndApp (routeName, content, makePath) {
    const navigate = Object.assign({}, fluxibleRoutes[routeName], {
      url: fluxibleRoutes[routeName].path
    });

    componentContext = createMockComponentContext({
      stores: [
        ContentStore,
        RouteStore,
        ContactStore,
        BackgroundStore,
        ModalStore
      ]
    });
    componentContext.makePath = makePath;

    const routeStore = componentContext.getStore(RouteStore);
    const contentStore = componentContext.getStore(ContentStore);

    routeStore._handleReceiveRoutes(fluxibleRoutes);
    routeStore._handleNavigateStart(navigate);
    routeStore._handleNavigateSuccess(navigate);
    contentStore.receivePageContent(content);

    appElement = React.createElement(fluxibleApp.getComponent(), {
      context: componentContext
    });
  }

  describe('home', () => {
    let homePage;

    function makeHomePath () {
      return '/';
    }

    before('home', (done) => {
      homePage = {
        resource: routesResponse.home.action.params.resource
      };

      serviceData.fetch(homePage, (err, data) => {
        if (err) {
          throw err;
        }
        homePage.data = data;
        done();
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

    before('contact', (done) => {
      contactPage = {
        resource: routesResponse.contact.action.params.resource
      };

      serviceData.fetch(contactPage, (err, data) => {
        if (err) {
          throw err;
        }
        contactPage.data = data;
        done();
      });
    });

    beforeEach(() => {
      createContextAndApp('contact', contactPage, makeContactPath);

      // Monkey Patch executeAction to inject MockActionContext with service.
      componentContext.executeAction = function (action, payload) {
        componentContext.executeActionCalls.push({
          action: action,
          payload: payload
        });
        const actionContext = createMockActionContext({
          dispatcherContext: componentContext.dispatcherContext
        });

        actionContext.service = new MockService();
        actionContext.service.setService('contact',
        (method, params, ...args) => {
          const callback = args[args.length - 1];

          expect(method).to.equal('create');
          expect(params).to.be.an('object').that.is.not.empty;
          expect(callback).to.be.a('function');

          serviceMail.send(params, callback);
        });

        action(actionContext, payload, ()=>{});
      }
    });

    function submitForm (app, inputId, reExpectedCurrent) {
      const form =
        testUtils.findRenderedDOMComponentWithClass(app, 'contact-form');

      const formInput =
        testUtils.scryRenderedDOMComponentsWithClass(app, 'form-value-element')
        .filter((component) => {
          return component.id === inputId;
        })[0];

      formInput.value = 'testvalue';
      testUtils.Simulate.change(formInput);

      testUtils.Simulate.submit(form);

      if (reExpectedCurrent) {
        const listItem =
          testUtils.findRenderedDOMComponentWithClass(
            app, 'current'
          );
        expect(listItem.textContent).to.match(reExpectedCurrent);
      }
    }

    it('should render contact content', (done) => {
      const app =
        testUtils.renderIntoDocument(appElement);

      const component =
        testUtils.findRenderedDOMComponentWithClass(app, 'selected');

      expect(component.textContent).to.match(/Contact/i);

      settle(250, done);
    });

    it('should respond to submit', (done) => {
      const app =
        testUtils.renderIntoDocument(appElement);

      submitForm(app, 'name-input', /email/i);

      settle(250, done);
    });

    it('should move back with previous', (done) => {
      const app =
        testUtils.renderIntoDocument(appElement);

      submitForm(app, 'name-input', /email/i);

      const previous =
        testUtils.scryRenderedDOMComponentsWithTag(app, 'button')
        .filter((button) => {
          return button.id === 'previous';
        })[0];

      testUtils.Simulate.click(previous);

      const listItem =
        testUtils.findRenderedDOMComponentWithClass(
          app, 'current'
        );
      expect(listItem.textContent).to.match(/name/i);

      settle(250, done);
    });

    it('should. go. all. the. way.', (done) => {
      let fields;

      const app =
        testUtils.renderIntoDocument(appElement);

      const contactStore =
        componentContext.getStore('ContactStore');

      submitForm(app, 'name-input', /email/i);
      fields = contactStore.getContactFields();
      expect(fields.name).to.not.be.empty;
      expect(fields.email).to.be.empty;
      expect(fields.message).to.be.empty;

      submitForm(app, 'email-input', /message/i);
      fields = contactStore.getContactFields();
      expect(fields.name).to.not.be.empty;
      expect(fields.email).to.not.be.empty;
      expect(fields.message).to.be.empty;

      submitForm(app, 'message-input');
      fields = contactStore.getContactFields();
      let failure = contactStore.getContactFailure();
      expect(failure).to.be.false;
      expect(fields.name).to.be.empty;
      expect(fields.email).to.be.empty;
      expect(fields.message).to.be.empty;

      settle(250, done);
    });
  });
});
