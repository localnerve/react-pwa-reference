/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
 /* global it */
'use strict';

var test = require('./sauce-travis');

var timeoutLink = 150;

it('should get home page and navigate to others', function(done) {
  test.state.browser
    .get(test.baseUrl)
    .title()
    .should.eventually.include('Example')
    .elementByTagName('h2')
    .text()
    .should.eventually.include('Welcome')
    .elementByLinkText('About')
    .click()
    .waitForElementByCss('#page1 h2', timeoutLink)
    .text()
    .should.eventually.include('About')
    .title()
    .should.eventually.include('About')
    .elementByLinkText('Contact')
    .click()
    .waitForElementByCss('#page2 h2', timeoutLink)
    .text()
    .should.eventually.include('Contact')
    .title()
    .should.eventually.include('Contact')
    .nodeify(done);
});

it('should get about page and navigate to others', function(done) {
  test.state.browser
    .get(test.baseUrl+'/about')
    .title()
    .should.eventually.include('About')
    .elementByTagName('h2')
    .text()
    .should.eventually.include('About')
    .elementByLinkText('Home')
    .click()
    .waitForElementByCss('#page0 h2', timeoutLink)
    .text()
    .should.eventually.include('Welcome')
    .title()
    .should.eventually.include('Example')
    .elementByLinkText('Contact')
    .click()
    .waitForElementByCss('#page2 h2', timeoutLink)
    .text()
    .should.eventually.include('Contact')
    .title()
    .should.eventually.include('Contact')
    .nodeify(done);
});

it('should get contact page and navigate to others', function(done) {
  test.state.browser
    .get(test.baseUrl+'/contact')
    .title()
    .should.eventually.include('Contact')
    .elementByTagName('h2')
    .text()
    .should.eventually.include('Contact')
    .elementByLinkText('Home')
    .click()
    .waitForElementByCss('#page0 h2', timeoutLink)
    .text()
    .should.eventually.include('Welcome')
    .title()
    .should.eventually.include('Example')
    .elementByLinkText('About')
    .click()
    .waitForElementByCss('#page1 h2', timeoutLink)
    .text()
    .should.eventually.include('About')
    .title()
    .should.eventually.include('About')
    .nodeify(done);
});
