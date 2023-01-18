require('dotenv').config();
const mysql = require('mysql2/promise');

export default async function helper(req, res) {
	if(req.method !== 'POST') {
		return res.status(404).json({
			'status': 'error', 
			'message': 'Usage POST /url'
		});
	}

	if(req.body === undefined || Object.keys(req.body).length === 0) {
		return res.status(404).json({
			'status': 'error', 
			'message': 'Data was not specified'
		});
	}
	const data = JSON.parse(req.body);

	const connection = await mysql.createConnection(process.env.DATABASE_URL);
	connection.connect();

	try {
		await connection.execute(
			'INSERT INTO `links` (link, name) VALUES (?, ?)',
			[data['link'], data['custom-name']]
		)
	} catch(err) {
		let errorMessage;

		switch(err.code) {
			case 'ER_DUP_ENTRY':
				errorMessage = 'This name is already in use';
				break;
			default:
				errorMessage = 'Failed to create the short link';
		}

		return res.json({
			'status': 'error',
			'message': errorMessage,
		})
	}

	connection.end();
	return res.json({
		'status': 'ok',
		'message': 'Created link',
		'data': { 'identifier': data['custom-name']}
	});
}