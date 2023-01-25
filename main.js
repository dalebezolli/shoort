const form = document.getElementById('link-shortener-form');

function checkFormValidationAndUpdateUser() {
	if(!form) return;
	form.setAttribute('novalidate', '');

	Array.from(form.elements).forEach(field => {
		const errorMessageContainer = document.getElementById(`${field.name}-error`);

		field.addEventListener('invalid', _ => {
			const errorMessage = getErrorMessage(field);
			errorMessageContainer.style.display = 'flex';
			errorMessageContainer.innerHTML = `
			<svg width="18" height="18" viewBox="0 0 18 18" fill="none">
				<path d="M9.87 5.73L9.67 10.52H8.22L8.02 5.73H9.87ZM8.97 13.08C8.67 13.08 8.42333 12.9933 8.23 12.82C8.04333 12.64 7.95 12.42 7.95 12.16C7.95 11.8933 8.04333 11.67 8.23 11.49C8.42333 11.31 8.67 11.22 8.97 11.22C9.26333 11.22 9.50333 11.31 9.69 11.49C9.88333 11.67 9.98 11.8933 9.98 12.16C9.98 12.42 9.88333 12.64 9.69 12.82C9.50333 12.9933 9.26333 13.08 8.97 13.08Z" fill="#E03800"/>
				<rect x="0.5" y="0.5" width="17" height="17" rx="8.5" stroke="#E03800"/>
			</svg>` + (errorMessage || field.validationMessage);
			errorMessageContainer.removeAttribute('hidden');
		});

		field.addEventListener('blur', _ => {
			const isFormValid = field.checkValidity();
			if(isFormValid) {
				errorMessageContainer.style.display = 'none';
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
	event.preventDefault();
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
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(objectData)
	})).json();

	if(response.status === 'error') {
		form.checkValidity();
		return;
	}

	submitButton.disabled = '';
	sessionStorage.setItem('identifier', response.data.identifier);
	window.location.replace('/success.html');
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

function sendUserToRedirectEndpoint() {
	const searchParams = window.location.search;
	if(searchParams === '') return;

	const identifier = searchParams.split('=')[1];
	const url = `./api/url/${identifier}`;

	window.location.replace('/redirect.html');
	sessionStorage.setItem('apiQuery', url);
}

async function redirectToLink() {
	url = sessionStorage.getItem('apiQuery');
	if(!url) {
		window.location.assign('/');
	}

	const response = await (await fetch(url, {method: 'GET'})).json();
	window.location.replace(response.data.link);
}

function loadUrlFromLocalStorage() {
	const domain = window.location.host;
	const savedUrlPath = sessionStorage.getItem('identifier');
	const shortenedUrlParagraph = document.getElementById('shortened-url');
	if(!savedUrlPath) {
		window.location.assign('/');
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