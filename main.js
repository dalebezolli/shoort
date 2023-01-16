async function submitURL(event) {
	event.preventDefault();

	const url = './api/url';
	const data = new FormData(event.target);

	const response = await fetch(url, {
		method: 'POST',
		body: JSON.stringify(data)
	});

	console.log((await response.text()));
}