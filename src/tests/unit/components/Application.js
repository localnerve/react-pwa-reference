/**
 * Copyright (c) 2016, 2017 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global Promise, require, after, describe, it, before, beforeEach */
import { expect } from 'chai';
import { start as testDomStart, stop as testDomStop } from 'test/utils/testdom';
import { createFluxibleRouteTransformer } from 'utils';
import { getActions } from 'application/actions/interface';

const jsonToFluxible = createFluxibleRouteTransformer({
  actions: getActions()
}).jsonToFluxible;

describe('application component', () => {
  let componentContext, appElement,
    createMockActionContext, createMockComponentContext, MockService,
    serviceMail, serviceData,
    ContentStore, RouteStore, ContactStore, BackgroundStore, ModalStore,
    SettingsStore,
    routesResponse, fluxibleRoutes, fluxibleApp,
    React, testUtils;

  const unexpectedFlowError = new Error('unexpected execution flow');

  /**
   * OMG this sux. I'm disappointed in this development. :-(
   * This became required during the React 0.14 / Fluxible 1.0 update.
   * This could just mean the app is faster, but harder to test.
   * This could mean the mocks are now not "mocky" enough. (not fake/deep enough)
   * This definitely means that the React Test Utils need to be used with async
   * code in mind -
   * It's not exactly clear to me yet which async thing needs waiting for.
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
    testDomStart();

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
    SettingsStore =
      require('application/stores/SettingsStore').SettingsStore;
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
      require('react-dom/test-utils');

    settle(250, done);
  });

  after(() => {
    testDomStop();
  });

  function createContextAndApp (routeName, content, path) {
    const navigate = Object.assign({}, fluxibleRoutes[routeName], {
      url: fluxibleRoutes[routeName].path
    });

    componentContext = createMockComponentContext({
      stores: [
        ContentStore,
        RouteStore,
        ContactStore,
        BackgroundStore,
        ModalStore,
        SettingsStore // this is NOT how this gets set in the real code
      ]
    });
    componentContext.makePath = () => {
      return path;
    };

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

  function createPageContent (page) {
    const pageContent = {
      resource: routesResponse[page].action.params.resource
    };

    return new Promise((resolve, reject) => {
      serviceData.fetch(pageContent, (err, data) => {
        if (err) {
          return reject(err);
        }
        pageContent.data = data;
        resolve(pageContent);
      });
    });
  }

  describe('home', () => {
    let homePage;

    before('home', (done) => {
      createPageContent('home')
        .then((pageContent) => {
          homePage = pageContent;
          done();
        })
        .catch((error) => {
          done(error || unexpectedFlowError);
        });
    });

    beforeEach(() => {
      createContextAndApp('home', homePage, '/');
    });

    it('should render home content', (done) => {
      // Get composite component in document
      const app =
        testUtils.renderIntoDocument(appElement);

      const components =
        testUtils.scryRenderedDOMComponentsWithClass(app, 'page-content');

      // first page-content component should be home
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

    before('contact', (done) => {
      createPageContent('contact')
        .then((pageContent) => {
          contactPage = pageContent;
          done();
        })
        .catch((error) => {
          done(error || unexpectedFlowError);
        });
    });

    beforeEach(() => {
      createContextAndApp('contact', contactPage, '/contact');

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

    describe('settings', () => {
      let savedExecuteAction, ReactModal;

      before('settings', () => {
        savedExecuteAction = componentContext.executeAction;
        ReactModal = require('react-modal');
      });

      after('settings', () => {
        componentContext.executeAction = savedExecuteAction;
      });

      beforeEach('settings', () => {
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
          actionContext.service.setService('page',
          (method, params, ...args) => {
            const callback = args[args.length - 1];

            expect(method).to.equal('read');
            expect(params).to.be.an('object').that.is.not.empty;
            expect(callback).to.be.a('function');

            serviceData.fetch(params, callback);
          });

          action(actionContext, payload, ()=>{});
        }
      });

      it('should open settings dialog', function (done) {
        const app =
          testUtils.renderIntoDocument(appElement);

        // Set ReactModal appElement here, componentDidMount will not be called.
        // This will throw if not exactly 1 app-block.
        const appEl = testUtils.findRenderedDOMComponentWithClass(
          app, 'app-block'
        );
        ReactModal.setAppElement(appEl);

        const settingsLink =
          testUtils.scryRenderedDOMComponentsWithClass(
            app, 'settings-link'
          ).filter((settingElement) => {
            return settingElement.tagName &&
              settingElement.tagName.toLowerCase() === 'a';
          })[0];

        expect(settingsLink).to.exist;

        testUtils.Simulate.click(settingsLink);

        settle(250, () => {
          // This is the best we can do for now.
          // Would rather test for .settings, but ReactModal doesn't do it
          // in a render method.
          // TODO: look at packaging bootstrap/overlays for modal.
          const modalBodyEl = global.document.querySelector(
            '.ReactModal__Body--open'
          );
          expect(modalBodyEl).to.exist;
          done();
        });
      });
    });
  });
});
