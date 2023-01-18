async function submitURL(event) {
	event.preventDefault();

	const url = './api/url';
	const data = new FormData(event.target);
	const objectData = {};
	data.forEach((value, key) => objectData[key] = value);

	console.log({objectData, data});

	const urlRegex = RegExp('https?:\/\/(.*)*', 'i');
	if(urlRegex.test(objectData.link) === false) {
		console.log('The input specificed is not a url');
		return;
	}

	if(objectData['custom-name'].includes(" ")) {
		console.log('The name specified contains whitespace');
		return;
	}

	const response = await (await fetch(url, {
		method: 'POST',
		body: JSON.stringify(objectData)
	})).json();

	console.log(response);
}

function toggleControl(event, inputId) {
	if(event.target.checked) {
		document.getElementById(inputId).classList.remove('link-shortener-form__input-border--hidden');
	} else {
		document.getElementById(inputId).classList.add('link-shortener-form__input-border--hidden');
		document.querySelector('input[name="custom-name"]').value = '';
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