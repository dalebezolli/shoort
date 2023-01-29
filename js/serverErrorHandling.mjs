export default function getErrorObject(code) {
	let object;
	let status;

	switch(code) {
		// REQUEST ERRORS
		case 'RESOURCE_NOT_FOUND':
			status = 404;
			object = {
				type: 'REQUEST_ERROR',
				message: 'Resource does not exist.'
			}
			break;

		case 'DATABASE_ERROR':
			status = 500;
			object = {
				type: 'INTERNAL_ERROR',
				message: 'There has been an internal server error, the developers have been contacted and will fix it asap.'
			}
			break;
		
		case 'DATABASE_LINK_NOT_FOUND':
			status = 404;
			object = {
				type: 'LINK_NOT_FOUND',
				message: 'Link does not exist on the server'
			}
			break;

		// LINK ERRORS
		case 'LINK_NOT_SPECIFIED':
			status = 400;
			object = { 
				type: 'INPUT_ERROR',
				inputName: 'link',
				message: 'Please fill out the link field.' 
			};
			break;

		case 'LINK_WRONG_SYNTAX':
			status = 400;
			object = { 
				type: 'INPUT_ERROR',
				inputName: 'link',
				message: 'Please enter a URL.' 
			};
			break;

		case 'LINK_DATA_TOO_LONG':
			status = 400;
			object = { 
				type: 'INPUT_ERROR',
				inputName: 'link',
				message: 'The url must be 2048 characters long or less.' 
			};
			break;

		// IDENTIFIER ERRORS
		case 'IDENTIFIER_NOT_UNIQUE':
			status = 400;
			object = { 
				type: 'INPUT_ERROR',
				inputName: 'identifier',
				message: 'This identifier already exists' 
			};
			break;

		case 'IDENTIFIER_WRONG_SYNTAX':
			status = 400;
			object = { 
				type: 'INPUT_ERROR',
				inputName: 'identifier',
				message: 'The identifier must only contain characters, numbers and hyphens' 
			};
			break;

		case 'IDENTIFIER_DATA_TOO_LONG':
			status = 400;
			object = { 
				type: 'INPUT_ERROR',
				inputName: 'identifier',
				message: 'The identifier must be 16 characters long or less.' 
			}
			break;
		
		// CAPTCHA ERRORS
		case 'CATPCHA_CONNECTION_ERROR':
			status = 500;
			object = {
				type: 'INTERNAL_ERROR',
				message: 'Captcha connection error, try again later.'
			}
			break;

		case 'CAPTCHA_WRONG':
			status = 400;
			object = {
				type: 'INPUT_ERROR',
				inputName: 'captcha',
				message: 'Recaptcha thinks you are a robot.'
			}

		default:
			status = 500;
			object = { 
				type: 'INTERNAL_ERROR',
				message: 'The programmers are a bit too dumb.' 
			}
			break;
	}

	return [status, object];
}