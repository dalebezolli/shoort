const form = document.getElementById('link-shortener-form');

function checkFormValidationAndUpdateUser() {
	if(!form) return;
	form.setAttribute('novalidate', '');

	Array.from(form.elements).forEach(field => {
		const errorMessageContainer = document.getElementById(`${field.name}-error`);

		field.addEventListener('invalid', _ => {
			const errorMessage = getErrorMessage(field);
			errorMessageContainer.textContent = errorMessage || field.validationMessage;
			errorMessageContainer.removeAttribute('hidden');
		});

		field.addEventListener('blur', _ => {
			const isFormValid = field.checkValidity();
			if(isFormValid) {
				errorMessageContainer.setAttribute('hidden', '');
				errorMessageContainer.textContent = '';
			}
		});

		function getErrorMessage(field) {
			if(field.validity.patternMismatch) {
				if(field.name === 'custom-name') return 'Please enter a custom name without spaces.'
			}
		}
	})
}

async function submitURL(event) {
	const submitButton = event.target;
	submitButton.disabled = 'disabled';

	const isFormValid = form.checkValidity();
	if(!isFormValid) {
		event.preventDefault();
		return;
	}

	const url = './api/url';
	const data = new FormData(form);
	const objectData = {};
	data.forEach((value, key) => objectData[key] = value);

	const response = await (await fetch(url, {
		method: 'POST',
		body: JSON.stringify(objectData)
	})).json();

	if(response.status === 'error') {
		form.checkValidity();
		return;
	}

	submitButton.disabled = '';
	localStorage.setItem('identifier', response.data.identifier);
	window.location.replace('/sucess.html');
}

function toggleControl(event, inputId) {
	const customNameInputField = document.querySelector('input[name="custom-name"]');
	const customNameErrorMessageContainer = document.getElementById('custom-name-error');

	if(event.target.checked) {
		document.getElementById(inputId).classList.remove('link-shortener-form__input-border--hidden');
		customNameInputField.setAttribute('required', '');
	} else {
		document.getElementById(inputId).classList.add('link-shortener-form__input-border--hidden');
		customNameInputField.value = '';
		customNameInputField.removeAttribute('required');
		customNameErrorMessageContainer.setAttribute('hidden', '');
		customNameErrorMessageContainer.textContent = '';
	}
}

function toggleCheckboxes() {
	document.querySelectorAll('input[type=\'checkbox\']').forEach(checkbox => checkbox.checked = false);
	document.querySelector('input[name="custom-name"]').value = '';
}

async function handleRouting() {
	const searchParams = window.location.search;
	if(searchParams === '') return;

	const identifier = searchParams.split('=')[1];
	const url = `./api/url/${identifier}`;

	const response = await (await fetch(url, {method: 'GET'})).json();
	window.location.replace(response.data.link);
}

function loadUrlFromLocalStorage() {
	const domain = 'localhost:3000';
	const savedUrlPath = localStorage.getItem('identifier');
	const shortenedUrlParagraph = document.getElementById('shortened-url');
	if(!savedUrlPath) {
		console.error('Error: Falied to get identifier from localstorage');
		return;
	}

	shortenedUrlParagraph.textContent = `${domain}/l/${savedUrlPath}`;
}

function copyUrlToClipboard() {
	const generatedUrl = document.getElementById('shortened-url').textContent;
	navigator.clipboard.writeText(generatedUrl)
		.then(function() {
			console.log('Copied successfully');
		}, function(err) {
			console.error('Failed to copy text to clipboard');
		})
}

function goBackToRoot() {
	window.location.replace('/');
}

checkFormValidationAndUpdateUser();