import * as dotenv from 'dotenv';
dotenv.config();
import mysql from 'mysql2/promise';
import  getErrorObject from '../../js/serverErrorHandling.mjs';

export default async function helper(req, res) {
	let databaseConnection;

	const identifier = req.query.identifier;
	const dataOrigin = {
		host: req.headers.origin,
		ip : req.connection.remoteAddress,
		method: req.method,
		path: `api/url/${identifier}`
	}

	try {
		if(req.method !== 'GET') throw 'RESOURCE_NOT_FOUND';

		const databaseConnection = await mysql.createConnection(process.env.DATABASE_URL);
		databaseConnection.connect();

		let data;
		try {
			const [rows] = await databaseConnection.execute(
				'SELECT * FROM `links` WHERE `identifier` = ?',
				[identifier],
			)

			data = rows;
			
		} catch(err) {
			console.error(err);		

			switch(err.code) {
				default:
					throw 'UNEXPECTED_ERROR';
			}
		}
		
		if(data.length === 0) throw 'DATABASE_LINK_NOT_FOUND';

		await fetch(`https://cloud.axiom.co/api/v1/datasets/vercel/ingest`, {
			method: 'POST',
			body: JSON.stringify([{request: dataOrigin, details: data[0]}]),
			headers: {
				'Authorization': `Bearer ${process.env.AXIOM_KEY}`,
				'Content-Type': 'application/json'
			},
		});

		databaseConnection.end();
		return res.json({
			'status': 'ok',
			'message': 'Succesfully got link',
			'data': { 'link': data[0].link}
		});
	} catch(error) {
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