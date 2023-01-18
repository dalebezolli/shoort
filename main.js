async function submitURL(event) {
	event.preventDefault();

	const url = './api/url';
	const data = new FormData(event.target);
	const objectData = {};
	data.forEach((value, key) => objectData[key] = value);

	const urlRegex = RegExp('https?:\/\/(.*)*', 'i');
	if(urlRegex.test(objectData.link) === false) {
		console.log('The input specificed is not a url');
		return;
	}

	if(objectData['custom-name'].includes(" ")) {
		console.log('The name specified contains whitespace');
		return;
	}

	const response = await fetch(url, {
		method: 'POST',
		body: JSON.stringify(objectData)
	});

	console.log((await response.text()));
}

function toggleControl(event, inputId) {
	if(event.target.checked) {
		document.getElementById(inputId).classList.remove("link-shortener-form__input-border--hidden");
	} else {
		document.getElementById(inputId).classList.add("link-shortener-form__input-border--hidden");
	}
}

function toggleCheckboxes() {
	document.querySelectorAll('input[type=\'checkbox\']').forEach(checkbox => checkbox.checked = false);
}

async function handleRouting() {
	const searchParams = window.location.search;
	if(searchParams === '') return;

	const identifier = searchParams.split('=')[1];
	const url = `./api/url/${identifier}`;

	const response = await (await fetch(url, {method: 'GET'})).json();
	console.log(response);
}