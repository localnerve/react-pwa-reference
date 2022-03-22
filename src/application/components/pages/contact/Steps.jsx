/**
 * Copyright (c) 2016 - 2022 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';

class ContactSteps extends React.Component {
  static get propTypes () {
    return {
      steps: PropTypes.array.isRequired,
      stepCurrent: PropTypes.number.isRequired,
      stepFinal: PropTypes.number.isRequired,
      failure: PropTypes.bool.isRequired,
      resultMessage: PropTypes.string,
      retry: PropTypes.func.isRequired
    };
  }

  shouldComponentUpdate (nextProps) {
    return nextProps.stepCurrent !== this.props.stepCurrent ||
           nextProps.failure !== this.props.failure;
  }

  render () {
    const contactSteps = this.renderContactSteps();
    return (
      <ul className="contact-steps">
        {contactSteps}
      </ul>
    );
  }

  renderContactSteps () {
    if (this.props.stepCurrent === this.props.stepFinal) {
      return (
        <li className={cx({
          'result-message': true,
          failure: this.props.failure
        })} onClick={this.props.failure ? this.props.retry : ()=>{}}>
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
}

export default ContactSteps;
