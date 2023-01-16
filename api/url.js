require('dotenv').config();
const mysql = require('mysql2');

export default function helper(req, res) {
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

	const connection = mysql.createConnection(process.env.DATABASE_URL);
	connection.connect();

	connection.query(
		'INSERT INTO `links` (link, name) VALUES (?, ?)',
		[data['link'], data['custom-name']],
		function (err) {
			if(err) {
				console.error(err);		

				return res.json({
					'status': 'error',
					'message': 'Failed to save url'
				})
			}

			return res.json({
				'status': 'ok',
				'message': 'Created link'
			});
		}
	);
	
	connection.end();
}