import * as dotenv from 'dotenv';
dotenv.config();
import mysql from 'mysql2/promise';
import fetch from 'node-fetch';

// import('dotenv').then(val => val.config());
// const mysql = import('mysql2/promise');
// const fetch = import('node-fetch');

function getErrorObject(code) {
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

export default async function helper(req, res) {
	const RANDOM_IDENTIFIER_SIZE = 5;
	let databaseConnection;

	try {
		if(req.method !== 'POST') {
			throw 'RESOURCE_NOT_FOUND';
		}

		const data = req.body;

		if(data === undefined || Object.keys(data).length === 0 || data.link === '') {
			throw 'LINK_NOT_SPECIFIED';
		}

		const urlRegex = RegExp(/(https?:\/\/)?[^\s]+(\.[^\s]+)+/, 'i');
		if(urlRegex.test(data.link) === false) {
			throw 'LINK_WRONG_SYNTAX';
		}

		// TODO: DATABASE CONNECTION SHOULD BE RETRIED IF IT HAS FAILED;
		databaseConnection = await mysql.createConnection(process.env.DATABASE_URL);
		databaseConnection.connect();

		const isEmptyIdentifier = data.identifier === '';
		if(isEmptyIdentifier) {
			const [response] = await databaseConnection.execute(`SELECT LEFT(MD5(RAND()), ${RANDOM_IDENTIFIER_SIZE})`);
			const randomIdentifer = Object.values(response[0])[0];
			data.identifier = randomIdentifer;
		}

		const identifierRegex = RegExp(/^(-?[a-zA-Z0-9])+$/, 'i');
		if(identifierRegex.test(data.identifier) === false) {
			throw 'IDENTIFIER_WRONG_SYNTAX';
		}

		const recaptchaData = `secret=${process.env.RECAPTCHA_SECRET}&response=${data['g-recaptcha-response']}`;

		const recaptchaResponse = await fetch(`https://www.google.com/recaptcha/api/siteverify?${recaptchaData}`);
		if(recaptchaResponse.status !== 200) {
			throw 'CAPTCHA_CONNECTION_ERROR';
		}
		const responseData = await recaptchaResponse.json();
		if(!responseData.success) {
			throw 'CAPTCHA_WRONG';
		}

		try {
			const [rows] = await databaseConnection.execute(
				'INSERT INTO `links` (link, identifier) VALUES (?, ?)',
				[data.link, data.identifier]
			)
		} catch(err) {
			switch(err.code) {
				case 'ER_DUP_ENTRY':
					throw 'IDENTIFIER_NOT_UNIQUE';
				case 'ER_DATA_TOO_LONG':
					const error = err.sqlMessage.slice(err.sqlMessage.indexOf('desc'), err.sqlMessage.indexOf('('));
					throw (error.includes('link') ? 'LINK_DATA_TOO_LONG' : 'IDENTIFIER_DATA_TOO_LONG');
				default:
					throw 'UNIDENTIFIER_ERROR';
			}
		}

		databaseConnection.end();

		return res.json({
			'message': 'Created link',
			'identifier': data.identifier
		});
	} catch (error) {
		if(typeof error === 'object') {
			console.log(error);
			error = 'DATABASE_ERROR';		
		} else {
			if(databaseConnection) databaseConnection.end();
		}

		const [status, data] = getErrorObject(error);	
		return res.status(status).json(data);
	}
}