function generateCaptchaWidget() {
	grecaptcha.render('recaptcha', {
		'sitekey': '6LcEdiwkAAAAAKRKlYksI7YRzHv4nk-RzxiHgsJu',
		'theme': 'dark',
		'callback': 'submitURL'
	});
}