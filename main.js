const form = document.getElementById('link-shortener-form');
const formElements = Array.from(form.elements);

function checkFormValidationAndUpdateUser() {
	if(!form) return;
	form.setAttribute('novalidate', '');

	formElements.forEach(field => {
		if(field.tagName !== 'INPUT') return;

		field.addEventListener('invalid', _ => {
			toggleErrorBox(field, false);
		});

		field.addEventListener('blur', event => {
			const isValid = field.checkValidity();
			if(isValid) toggleErrorBox(field, true);
		});
	})
}

function toggleErrorBox(field, isValid, customErrorMessage) {
	const errorMessageContainer = document.getElementById(`${field.name}-error`);
	const errorInputToggleGroup = document.getElementById(`${field.name}-toggle-group`);

	if(!isValid) {
		if(errorInputToggleGroup) errorInputToggleGroup.style.height = 'max-content';
		const errorMessage = customErrorMessage || getErrorMessage(field) || field.validationMessage;
		errorMessageContainer.style.display = 'flex';
		errorMessageContainer.innerHTML = `
		<svg width="18" height="18" viewBox="0 0 18 18" fill="none">
			<path d="M9.87 5.73L9.67 10.52H8.22L8.02 5.73H9.87ZM8.97 13.08C8.67 13.08 8.42333 12.9933 8.23 12.82C8.04333 12.64 7.95 12.42 7.95 12.16C7.95 11.8933 8.04333 11.67 8.23 11.49C8.42333 11.31 8.67 11.22 8.97 11.22C9.26333 11.22 9.50333 11.31 9.69 11.49C9.88333 11.67 9.98 11.8933 9.98 12.16C9.98 12.42 9.88333 12.64 9.69 12.82C9.50333 12.9933 9.26333 13.08 8.97 13.08Z" fill="#E03800"/>
			<rect x="0.5" y="0.5" width="17" height="17" rx="8.5" stroke="#E03800"/>
		</svg>` + errorMessage;
		errorMessageContainer.removeAttribute('hidden');
	} else {
		errorMessageContainer.style.display = 'none';
		errorMessageContainer.setAttribute('hidden', '');
		errorMessageContainer.textContent = '';
	}

	function getErrorMessage(field) {
		if(field.validity.patternMismatch) {
			if(field.name === 'identifier') return 'Please enter a custom name without spaces.'
		}
	}
}

function setGlobalError(errorMessage) {
	const generalErrorContainer = document.querySelector('.general-error-container');
	const generalErrorMessage = document.querySelector('.general-error-container__message');

	generalErrorMessage.textContent = errorMessage;
	generalErrorContainer.classList.add('general-error-container--show');
}

function toggleCaptchaVerificationBox(event, visible) {
	if(event) event.preventDefault();

	const captcha = document.querySelector('.captcha-shadow');
	if(visible) {
		captcha.classList.add('captcha--show');
	} else {
		captcha.classList.remove('captcha--show');
	}
}

function generateCaptchaWidget() {
	grecaptcha.render('recaptcha', {
		'sitekey': '6LcEdiwkAAAAAKRKlYksI7YRzHv4nk-RzxiHgsJu',
		'theme': 'dark',
		'callback': 'submitURL'
	});
}

async function submitURL(userCaptchaResponse) {
	toggleCaptchaVerificationBox(null, false);
	const submitButton = document.getElementById('link-shortener-submit');
	submitButton.disabled = 'disabled';

	const isFormValid = form.checkValidity();
	if(!isFormValid) return;

	submitButton.setAttribute('data-state', 'loading');

	const url = './api/url';
	const data = new FormData(form);
	const  dataObject = {};
	data.forEach((value, key) => dataObject[key] = value);
	dataObject['g-recaptcha-response'] = userCaptchaResponse;

	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(dataObject)
	});
	const responseData = await response.json();

	if(response.status !== 200) {
		switch(responseData.type) {
			case 'INPUT_ERROR':
				if(responseData.inputName === 'captcha') {
					setGlobalError(responseData.message);
					break;
				}

				const field = document.querySelector(`input[name='${responseData.inputName}']`);
				toggleErrorBox(field, false, responseData.message);
				break;

			case 'INTERNAL_ERROR':
				setGlobalError(responseData.message);
				break;

			default:
				console.error(responseData);
		}

		submitButton.disabled = '';
		submitButton.setAttribute('data-state', 'default');
		return;
	}

	submitButton.disabled = '';
	sessionStorage.setItem('identifier', responseData.identifier);
	window.location.assign('/success.html');
}

function toggleControl(event, inputId) {
	const customNameInputField = document.querySelector(`input[name="${inputId}"]`);
	const customNameErrorMessageContainer = document.getElementById(`${inputId}-error`);
	const customNameInputContainer = document.getElementById(`${inputId}-container`);
	const customNameInputToggleGroup = document.getElementById(`${inputId}-toggle-group`);

	if(customNameInputToggleGroup) {
		if(event.target.checked) {
			customNameInputToggleGroup.style.height = '6.25rem';
		} else {
			customNameInputToggleGroup.style.height = '';
		}
	}

	if(event.target.checked) {
		customNameInputContainer.classList.remove('link-shortener-form__input-border--hidden');
		customNameInputField.setAttribute('required', '');
	} else {
		customNameInputContainer.classList.add('link-shortener-form__input-border--hidden');
		customNameInputField.value = '';
		customNameInputField.removeAttribute('required');
		customNameErrorMessageContainer.setAttribute('hidden', '');
		customNameErrorMessageContainer.textContent = '';
	}
}

function toggleCheckboxes() {
	document.querySelectorAll('input[type=\'checkbox\']').forEach(checkbox => checkbox.checked = false);
	document.querySelector('input[name="identifier"]').value = '';
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
	if(!response.data.link.startsWith('http')) response.data.link = 'https://' + response.data.link;
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

function copyUrlToClipboard(event) {
	const button = event.currentTarget;
	const generatedUrl = document.getElementById('shortened-url').textContent;

	navigator.clipboard.writeText(generatedUrl)
		.then(function() {
			button.setAttribute('data-state', 'active');
			console.log('Copied successfully');
		}, function(err) {
			console.error('Failed to copy text to clipboard');
		})
}

function goBackToRoot() {
	window.location.replace('/');
}

function handleOnMouseMoveFormHighlight(event) {
	const target = event.currentTarget;

	const rect = target.getBoundingClientRect();
	const highlightX = event.clientX - rect.left;
	const highlightY = event.clientY - rect.top;

	formElements.forEach(input => {
		if(input.tagName === 'BUTTON') return;

		const rect = input.parentElement.getBoundingClientRect();
		const highlightX = event.clientX - rect.left;
		const highlightY = event.clientY - rect.top;
		input.parentElement.style.setProperty('--highlight-X', highlightX + 'px');
		input.parentElement.style.setProperty('--highlight-Y', highlightY + 'px');
	});

	target.style.setProperty('--highlight-X', highlightX + 'px');
	target.style.setProperty('--highlight-Y', highlightY + 'px');
}

checkFormValidationAndUpdateUser();