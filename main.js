async function submitURL(event) {
	event.preventDefault();

	const url = './api/url';
	const data = new FormData(event.target);
	const objectData = {};
	data.forEach((value, key) => objectData[key] = value);

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