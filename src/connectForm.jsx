import React from 'react';
import { connect } from 'react-redux';

import { fieldUpdate, fieldValidateFailure, fieldValidateSuccess, formInit } from './formActions';

const PT = React.PropTypes;

export default setup => WrappedComponent => {
	class ReactReduxForm extends React.Component {
		static propTypes = {
			dispatch: PT.func.isRequired,

			options: PT.shape({
				fields: PT.object.isRequired,
				name: PT.string.isRequired,
			}).isRequired,

			// eslint-disable-next-line react/forbid-prop-types
			values: PT.object.isRequired,
		}

		/**
		 * Initialise the form.
		 */
		constructor() {
			super();
			this.inputCache = {};
			this.formValidate = this.formValidate.bind(this);
		}

		/**
		 * Ensure the form is present in redux upon mounting
		 */
		componentWillMount() {
			const { dispatch, options } = this.props;

			dispatch(formInit(
				options.name,
				Object.keys(options.fields),
				options.values || {},
			));
		}

		/**
		 * Create a change handler for the given field
		 *
		 * @param {String} fieldName
		 */
		createChangeHandler(fieldName) {
			const { dispatch, options } = this.props;

			return value => {
				dispatch(fieldUpdate(options.name, fieldName, value));
			};
		}

		/**
		 * Create a validation handler for the given field
		 *
		 * @param {String} fieldName
		 * @param {Array} validators
		 */
		createValidateHandler(fieldName, validators) {
			return value => {
				this.fieldValidate(fieldName, validators, value);
			};
		}

		/**
		 * Create field components for each desired field
		 */
		createFields() {
			const { options: { fields, inputTypes, name } } = this.props;
			const fieldComponents = {};

			Object.keys(fields).forEach(fieldName => {
				if (this.inputCache[fieldName]) {
					fieldComponents[fieldName] = this.inputCache[fieldName];
					return;
				}

				const { validators, ...field } = fields[fieldName];
				const InputType = inputTypes[field.type];

				const ConnectedInput = connect(state => ({
					error: state.form[name].fields[fieldName].error,
					value: state.form[name].values[fieldName],
				}), () => ({}))(InputType);

				this.inputCache[fieldName] = fieldComponents[fieldName] = fieldProps => (
					<ConnectedInput
						{...field}
						{...fieldProps}
						name={fieldName}
						change={this.createChangeHandler(fieldName)}
						validate={this.createValidateHandler(fieldName, validators)}
					/>
				);
			});

			return fieldComponents;
		}

		/**
		 * Validate given field
		 *
		 * @param {String} fieldName
		 * @param {Function[]} validators
		 * @param {Mixed} value
		 */
		fieldValidate(fieldName, validators, value) {
			if (!validators || !validators.length) return Promise.resolve(value);

			const { dispatch, options: { name: formName } } = this.props;

			const [fv, ...v] = validators;

			return v.reduce((a, b) => a.then(b), fv(value || ''))
				.then(finalValue => {
					dispatch(fieldValidateSuccess(formName, fieldName));
					return Promise.resolve(finalValue);
				})
				.catch(err => {
					dispatch(fieldValidateFailure(formName, fieldName, err));
					return Promise.reject(err);
				});
		}

		/**
		 * Validate all fields in the form
		 */
		formValidate() {
			const { options: { fields }, values } = this.props;

			return Promise.all(Object.keys(fields).map(fieldName => (
				this.fieldValidate(fieldName, fields[fieldName].validators, values[fieldName])
			)))
				.then(() => Promise.resolve(values));
		}

		/**
		 * Render the form
		 */
		render() {
			const { ...props } = this.props;

			delete props.dispatch;
			delete props.options;

			return (
				<WrappedComponent
					{...props}
					fields={this.createFields()}
					formValidate={this.formValidate}
				/>
			);
		}
	}

	return connect((state, props) => {
		const options = setup(state, props);
		return {
			options,
			values: (state.form[options.name] || { values: {} }).values,
		};
	})(ReactReduxForm);
};
