const form = document.getElementById('link-shortener-form');
let formElements;
if(form) {
	 formElements = Array.from(form.elements);
}

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

function setFormPage(event, page) {
	if(event) event.preventDefault();

	const isFormValid = form.checkValidity();
	if(!isFormValid) return;

	form.style.height = `${form.clientHeight}px`;
	form.setAttribute('data-visible-page', page);

	if(page === 2) {
		generateCaptchaWidget();
	}
}

async function submitURL(userCaptchaResponse) {
	setFormPage(null, 3);
	const submitButton = document.getElementById('link-shortener-submit');
	submitButton.disabled = 'disabled';

	submitButton.setAttribute('data-state', 'loading');

	const url = './api/url';
	const data = new FormData(form);
	const  dataObject = {};
	data.forEach((value, key) => dataObject[key] = value);
	dataObject['g-recaptcha-response'] = userCaptchaResponse;

	console.log(dataObject);

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
				setFormPage(null, 1);
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

	const domain = window.location.host;
	const shortenedURL = `https://${domain}/${responseData.identifier}`;
	const qrCode = await generateQRCode(shortenedURL);

	document.title = 'Shoort - Success';
	const main = document.getElementsByTagName('main')[0];
	main.classList.remove('index__flex');
	main.classList.add('old-main');
	main.innerHTML = `
		<div>
			<header class="site-header">
				<h1 class="site-header__title">Shoort</h1>	
			</header>
			
			<main class="old-main">
				<article class="success-article">
					<header class="success-article__header">
						<h2 class="success-article__title">Great! Now you have a shorter url</h2>
						<p>Use the url or scan the QR code to visit your website</p>
					</header>

					${qrCode.outerHTML}

					<div class="shortened-url-block">
						<div class="shortened-url">
							<div class="shortened-url__wrapper">
								<p class="shortened-url__text" id="shortened-url">${shortenedURL}</p>
							</div>
						</div>
						<button class="copy-url-button" onmouseup="copyUrlToClipboard(event)" data-state="default">
							<div class="copy-url-button__default-state">
								<svg class="copy-url-button__icon" viewBox="0 0 24 24" height="18" width="18">
									<path d="M2 4C2 2.89543 2.89543 2 4 2H14C15.1046 2 16 2.89543 16 4V8H20C21.1046 8 22 8.89543 22 10V20C22 21.1046 21.1046 22 20 22H10C8.89543 22 8 21.1046 8 20V16H4C2.89543 16 2 15.1046 2 14V4ZM10 16V20H20V10H16V14C16 15.1046 15.1046 16 14 16H10ZM14 14V4L4 4V14H14Z"></path>
								</svg>
								Copy
							</div>

							<div class="copy-url-button__active-state">
								Copied !
							</div>
						</button>
					</div>

					<button class="go-back-button" onmouseup="goBackToRoot()">Shorten another url</button>
				</article>
			</main>

		</div>
	`;
}

async function redirectToLink() {
	const searchParams = window.location.search;
	const identifier = searchParams.split('=')[1];
	const url = `./api/url/${identifier}`;

	const request = await fetch(url, {method: 'GET'});
	const response = await request.json();
	if(request.status !== 200) {
		document.querySelector('#redirect-status').textContent = response.message;
		document.querySelector('#loading').remove();
		return;
	}

	if(!response.data.link.startsWith('http')) response.data.link = 'https://' + response.data.link;
	window.location.replace(response.data.link);
}

async function generateQRCode(url) {
	const request = await fetch(`https://qrapi.vercel.app/api/generate?text=${url}`);
	const response = await request.json();
	if(request.status !== 200) {
		console.error('Cannot fetch qr code');
	}

	const qrCode = document.createElement('img');
	qrCode.classList.add('success-article__qr-code');
	qrCode.width = 200;
	qrCode.height = 200;
	qrCode.src = response.code;

	return qrCode;
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
		const rect = input.parentElement.getBoundingClientRect();
		const highlightX = event.clientX - rect.left;
		const highlightY = event.clientY - rect.top;
		input.parentElement.style.setProperty('--highlight-X', highlightX + 'px');
		input.parentElement.style.setProperty('--highlight-Y', highlightY + 'px');
	});

	target.style.setProperty('--highlight-X', highlightX + 'px');
	target.style.setProperty('--highlight-Y', highlightY + 'px');
}

function focusInput(name) {
	document.querySelector(`input[name='${name}']`).focus();
}

checkFormValidationAndUpdateUser();