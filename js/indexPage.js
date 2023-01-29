window.addEventListener('DOMContentLoaded', (event) => {
	const target = this.document.querySelector('#input-url');

	target.textContent = `${window.location.host}/`;
});

function generateCaptchaWidget() {
	try {
		grecaptcha.render('recaptcha', {
			'sitekey': '6LcEdiwkAAAAAKRKlYksI7YRzHv4nk-RzxiHgsJu',
			'theme': 'dark',
			'callback': 'submitURL'
		});
	} catch(err) {
		grecaptcha.reset();
	}
}