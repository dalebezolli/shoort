export default function helper(req, res) {
	if(req.method !== 'POST') 
		return res.status(404).json({
			'status': 'error', 
			'message': 'Usage POST /url'
		});

	if(req.body === undefined || Object.keys(req.body).length === 0) 
		return res.status(404).json({
			'status': 'error', 
			'message': 'Data was not specified'
		});


	return res.json({
		'status': 'ok',
		'message': 'Created link'
	});
}