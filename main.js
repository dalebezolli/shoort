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