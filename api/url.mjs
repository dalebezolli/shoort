import * as dotenv from 'dotenv';
dotenv.config();
import mysql from 'mysql2/promise';
import fetch from 'node-fetch';
import  getErrorObject from '../js/serverErrorHandling.mjs';

export default async function helper(req, res) {
	const RANDOM_IDENTIFIER_SIZE = 5;
	let databaseConnection;

	const dataOrigin = {
		host: req.headers.origin,
		ip : req.connection.remoteAddress,
		method: req.method,
		path: 'api/url'
	}

	try {
		if(req.method !== 'POST') {
			throw 'RESOURCE_NOT_FOUND';
		}

		const data = req.body;
		await fetch(`https://cloud.axiom.co/api/v1/datasets/vercel/ingest`, {
			method: 'POST',
			body: JSON.stringify([{request: dataOrigin, details: data}]),
			headers: {
				'Authorization': `Bearer ${process.env.AXIOM_KEY}`,
				'Content-Type': 'application/json'
			},
		});

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
		await fetch(`https://cloud.axiom.co/api/v1/datasets/vercel/ingest`, {
			method: 'POST',
			body: JSON.stringify([{request: dataOrigin, details: error}]),
			headers: {
				'Authorization': `Bearer ${process.env.AXIOM_KEY}`,
				'Content-Type': 'application/json'
			},
		});

		if(typeof error === 'object') {
			error = 'DATABASE_ERROR';		
		} else {
			if(databaseConnection) databaseConnection.end();
		}

		const [status, data] = getErrorObject(error);
		return res.status(status).json(data);
	}
}