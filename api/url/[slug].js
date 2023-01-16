require('dotenv').config();
const mysql = require('mysql2');

export default function helper(req, res) {
	if(req.method !== 'GET') 
		return res.status(404).json({
			'status': 'error', 
			'message': 'Usage GET /url/:slug'
		});

	const slug = req.query.slug;

	const connection = mysql.createConnection(process.env.DATABASE_URL);
	connection.connect();

	connection.query(
		'SELECT * FROM `links` WHERE `name` = ?',
		[slug],
		function (err, rows) {
			if(err) {
				console.error(err);		

				return res.json({
					'status': 'error',
					'message': 'Failed to fetch url'
				})
			}

			return res.json({
				'status': 'ok',
				'message': rows 
			});
		}
	);
	
	connection.end();
}