/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import React from 'react';
import cx from 'classnames';
import noop from 'lodash/noop';

const ContactSteps = React.createClass({
  propTypes: {
    steps: React.PropTypes.array.isRequired,
    stepCurrent: React.PropTypes.number.isRequired,
    stepFinal: React.PropTypes.number.isRequired,
    failure: React.PropTypes.bool.isRequired,
    resultMessage: React.PropTypes.string,
    retry: React.PropTypes.func.isRequired
  },

  shouldComponentUpdate: function (nextProps) {
    return nextProps.stepCurrent !== this.props.stepCurrent ||
           nextProps.failure !== this.props.failure;
  },

  render: function () {
    const contactSteps = this.renderContactSteps();
    return (
      <ul className="contact-steps">
        {contactSteps}
      </ul>
    );
  },

  renderContactSteps: function () {
    if (this.props.stepCurrent === this.props.stepFinal) {
      return (
        <li className={cx({
          'result-message': true,
          failure: this.props.failure
        })} onClick={this.props.failure ? this.props.retry : noop}>
          <span>{this.props.resultMessage}</span>
        </li>
      );
    } else {
      return this.props.steps
        .sort(function (a, b) {
          return a.step - b.step;
        })
        .map(function (input) {
          const classNames = cx({
            complete: input.step < this.props.stepCurrent,
            current: input.step === this.props.stepCurrent,
            incomplete: input.step > this.props.stepCurrent,
            hide: input.step === this.props.stepFinal
          });
          return (
            <li className={classNames} key={input.name}>
              <span>{input.name}</span>
            </li>
          );
        }, this);
    }
  }
});

export default ContactSteps;
