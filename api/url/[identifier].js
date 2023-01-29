import test from '../../js/serverErrorHandling.mjs';

require('dotenv').config();
const mysql = require('mysql2/promise');

export default async function helper(req, res) {
	test();
	if(req.method !== 'GET') 
		return res.status(404).json({
			'status': 'error', 
			'message': 'Usage GET /url/:slug'
		});

	const identifier = req.query.identifier;

	const connection = await mysql.createConnection(process.env.DATABASE_URL);
	connection.connect();

	let data;
	try {
		const [rows] = await connection.execute(
			'SELECT * FROM `links` WHERE `identifier` = ?',
			[identifier],
		)

		data = rows;
	} catch(err) {
		console.error(err);		

		return res.json({
			'status': 'error',
			'message': 'Failed to fetch url'
		})
	}
	
	connection.end();
	return res.json({
		'status': 'ok',
		'message': 'Succesfully got link',
		'data': { 'link': data[0].link}
	});
}