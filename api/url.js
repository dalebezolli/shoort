require('dotenv').config();
const mysql = require('mysql2/promise');

export default async function helper(req, res) {
	const RANDOM_IDENTIFIER_SIZE = 5;

	if(req.method !== 'POST') {
		return res.status(404).json({
			'status': 'error', 
			'message': 'Usage POST /url'
		});
	}

	if(req.body === undefined || Object.keys(req.body).length === 0) {
		return res.status(400).json({
			'status': 'error', 
			'message': 'Data was not specified'
		});
	}
	const data = req.body;

	const urlRegex = RegExp('(https?:\/\/)?[^\s]+(\.[^\s]+)+', 'i');
	if(urlRegex.test(data.link) === false) {
		return res.status(400).json({
			'status': 'error', 
			'message': 'The input specificed is not a url'
		});
	}

	if(data.identifier.includes(" ")) {
		return res.status(400).json({
			'status': 'error', 
			'message': 'The name specified contains whitespace'
		});
	}

	const connection = await mysql.createConnection(process.env.DATABASE_URL);
	connection.connect();

	if(data.identifier === '') {
		const [rows] = await connection.execute(`SELECT LEFT(MD5(RAND()), ${RANDOM_IDENTIFIER_SIZE})`);
		data.identifier = Object.values(rows[0])[0];
	}

	try {
		const [rows] = await connection.execute(
			'INSERT INTO `links` (link, identifier) VALUES (?, ?)',
			[data.link, data.identifier]
		)

		console.log(rows);
	} catch(err) {
		let errorMessage;
		console.log(err);

		switch(err.code) {
			case 'ER_DUP_ENTRY':
				errorMessage = 'This name is already in use';
				break;
			default:
				errorMessage = 'Failed to create the short link';
		}

		return res.status(400).json({
			'status': 'error',
			'message': errorMessage,
		})
	}

	connection.end();
	return res.json({
		'status': 'ok',
		'message': 'Created link',
		'data': { 'identifier': data.identifier}
	});
}