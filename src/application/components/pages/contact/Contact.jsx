/**
 * Copyright (c) 2016 - 2022 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import React from 'react';
import PropTypes from 'prop-types';
import CSSTransitionGroup from 'react-transition-group/CSSTransitionGroup';
import cx from 'classnames';
import contactAction from 'application/actions/contact';
import ContactSteps from './Steps';
import ContactNav from './Nav';
import { createContactElement } from './elements';
import Spinner from '../Spinner';

// manually keep in sync with value in _anim.scss
const animTimeout = 500;

class Contact extends React.Component {
  static get contextTypes () {
    return {
      getStore: PropTypes.func.isRequired,
      executeAction: PropTypes.func.isRequired
    };
  }

  static get propTypes () {
    return {
      name: PropTypes.string,
      spinner: PropTypes.bool,
      headingText: PropTypes.string,
      stepFinal: PropTypes.number,
      steps: PropTypes.array,
      resultMessageFail: PropTypes.string,
      resultMessageSuccess: PropTypes.string,
      navigation: PropTypes.object,
      models: PropTypes.object
    };
  }

  constructor (props, context) {
    super(props, context);
    const state = this.getStateFromStore();
    state.step = 0;
    state.stepped = false;
    state.direction = 'next';
    state.settled = true;
    this.state = state;

    this.onChange = this.onChange.bind(this);
    this.setInputElement = this.setInputElement.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handlePrevious = this.handlePrevious.bind(this);
    this.handleRetry = this.handleRetry.bind(this);
  }

  componentDidMount () {
    this.context.getStore('ContactStore').addChangeListener(this.onChange);
  }

  componentWillUnmount () {
    this.context.getStore('ContactStore').removeChangeListener(this.onChange);
  }

  componentWillReceiveProps () {
    this.setState({
      stepped: false
    }, this.setBlur);
  }

  render () {
    let content;

    if (this.props.spinner || !this.state.settled) {
      content = React.createElement(Spinner);
    } else {
      content = this.renderContact();
    }

    return (
      <div className="grid-container-center page-content">
        {content}
      </div>
    );
  }

  getStateFromStore () {
    const store = this.context.getStore('ContactStore');
    return {
      fields: store.getContactFields(),
      failure: store.getContactFailure()
    };
  }

  setInputElement (component) {
    if (component) {
      this.inputElement = component;
    }
  }

  renderContact () {
    if (!this.props.steps || this.props.steps.length === 0) {
      return null;
    }

    const step = this.props.steps[this.state.step];

    const contactElement = createContactElement(step.name, {
      fieldValue: this.state.fields[step.name] || null,
      setInputReference: this.setInputElement,
      label: step.label,
      key: step.name,
      message: step.message,
      business: this.props.models.LocalBusiness,
      failure: this.state.failure,
      failedMessage: this.state.fields.message,
      focus: this.props.name === 'contact' && this.state.stepped
    });

    return (
      <div key="contact">
        <h2>
          {this.props.headingText}
        </h2>
        <p className={cx({
          'contact-intro': true,
          hide: this.state.step === this.props.stepFinal
        })}>
          {step.introduction.text}
        </p>
        <ContactSteps
          steps={this.props.steps}
          stepCurrent={this.state.step}
          stepFinal={this.props.stepFinal}
          failure={this.state.failure}
          resultMessage={this.state.failure ? this.props.resultMessageFail :
            this.props.resultMessageSuccess}
          retry={this.handleRetry} />
        <form className="contact-form" onSubmit={this.handleSubmit}>
          <CSSTransitionGroup
            component="div"
            className={cx({
              'contact-anim-container': true,
              'final': this.state.step === this.props.stepFinal
            })}
            transitionEnterTimeout={animTimeout}
            transitionLeaveTimeout={animTimeout}
            transitionEnter={this.state.step < this.props.stepFinal}
            transitionLeave={false}
            transitionName={'contact-anim-' + this.state.direction}>
            <div className="contact-anim" key={step.name}>
              {contactElement}
            </div>
          </CSSTransitionGroup>
          <ContactNav
            stepCurrent={this.state.step}
            stepFinal={this.props.stepFinal}
            onPrevious={this.handlePrevious}
            nav={this.props.navigation} />
        </form>
      </div>
    );
  }

  setBlur () {
    setTimeout(function (self, final) {
      if (!final && self.inputElement) {
        self.inputElement.blur();
      }
    }, 0, this, this.state.step === this.props.stepFinal);
  }

  onChange () {
    const state = this.getStateFromStore();
    state.settled = true;
    this.setState(state);
  }

  saveFields (fields) {
    const complete = this.state.step === (this.props.stepFinal - 1);

    this.setState({
      settled: !complete
    }, function () {
      this.context.executeAction(contactAction, {
        fields: fields,
        complete: complete
      });
    });
  }

  nextStep () {
    this.setState({
      step: this.state.step + 1,
      direction: 'next',
      stepped: true
    });
  }

  prevStep () {
    this.setState({
      step: this.state.step - 1,
      direction: 'prev',
      stepped: true
    });
  }

  handleRetry () {
    this.setState({
      settled: false
    }, function () {
      this.context.executeAction(contactAction, {
        fields: this.state.fields,
        complete: true
      });
    });
  }

  handleSubmit (event) {
    event.preventDefault();
    const step = this.props.steps[this.state.step];

    const fieldValue = this.inputElement.value.trim();
    if (!fieldValue) {
      return;
    }

    const fields = this.state.fields;
    fields[step.name] = fieldValue;

    this.saveFields(fields);
    this.nextStep();
  }

  handlePrevious (event) {
    event.preventDefault();
    this.prevStep();
  }
}

export default Contact;
