# react-redux-formal

Long name, I know. But the name is supposed to convey that it's build on top of
both react and redux.

Formal came into life after I experimented with [redux-form][redux-form] but
found it a bit too "heavy" for most usecases I required. It came with slightly
too much out of the box so I decided to make a more lightweight alternative.

[redux-form]: https://github.com/erikras/redux-form


## Installation

As you'd expect, `react-redux-formal` is available on npm.

```bash
$ npm install --save react-redux-formal
```

As the name would suggest, `react-redux-formal` depends on `redux` as well as
`react-redux`, so you might need to issue

```bash
$ npm install --save redux react-redux
```


## Setup

After you've installed the package, you'll need to add the `formReducer` to your
store and expose the store to your app through `react-redux`'s `Provider`.

*Note:* `react-redux-formal` requires the formReducer to be mounted at
`state.form`.

```jsx
import { Provider } from 'react-redux';
import { formReducer } from 'react-redux-formal';
import { render } from 'react-dom';
import { combineReducers, createStore } from 'redux';

const store = createStore(combineReducers({
  form: formReducer,
}));

render((
  <Provider store={store}>
    <App />
  </Provider>
), document.getElementById('app-container')):
```


## Usage

With the reducer in place you can use the `connectForm` function to hook your
app up and have fields injected. For example, a simple login form component
might look something like this:

```jsx
import PropTypes from 'prop-types';
import React from 'react';
import { connectForm, validators } from 'react-redux-formal';

export class Signup extends React.Component {
	static propTypes = {
		fields: PropTypes.object.isRequired,
		formValidate: PropTypes.func.isRequired,
		getValues: PropTypes.func.isRequired,
	}

	constructor() {
		super();

		this.onSubmit = this.onSubmit.bind(this);
	}

	onSubmit(ev) {
		ev.preventDefault();

		this.props.formValidate()
			.then(values => {
				/* do stuff with values */
			})
			.catch(() => {});
	}

	render() {
		const { fields } = this.props;

		return (
			<form onSubmit={this.onSubmit}>
				<fields.username />
				<fields.email />
				<fields.password />

				<button type="submit">Sign up</button>
			</form>
		);
	}
}

export default connectForm(() => {
	name: 'signup',
	fields: {
		username: {
			type: 'text',
			label: 'Username',
			validators: [
				validators.required('Username is required'),
			],
		},
		email: {
			type: 'text',
			label: 'E-mail',
			validators: [
				validators.required('E-mail is required'),
			],
		},
		password: {
			type: 'text',
			label: 'Password',
			validators: [
				validators.required('Password is required'),
			],
		},
	},
})(Signup);
```


## API

### `connectForm(mapStateToOptions)(component)`

Generate fields that are injected into the wrapped component. Does not modify
the component passed to it. Instead it returns a new component which wraps the
original component which should be used instead.

- `mapStateToOptions` *(Function)*: A function which should return an object
  with options for your form. This gets passed the same arguments as redux
  `connect`'s `mapStateToProps`. The return `options` object can have the
  following keys:
  - `name` *(String)*: Name of the form, this is used to store the form in redux
    under its own namespace. Ensure this is unique for each form.
  - `fields` *(Object)*: Object containing field specifications. The key will be
    reused when injecting fields into your component.
  - [`values`] *(Object)*: Initial values to populate the fields with.
  - [`inputTypes`] *(Object)*: Custom input types. This can be used to specify
    your own input types if you don't want to use the ones provided.
- `component` *(Component)*: The component to wrap.


## License

MIT © [Chiel Kunkels](http://kunkels.me/)
