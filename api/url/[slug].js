export default function helper(req, res) {
	if(req.method !== 'GET') 
		return res.status(404).json({
			'status': 'error', 
			'message': 'Usage GET /url/:slug'
		});

	const slug = req.query.slug;

	return res.json({
		'status': 'ok',
		'message': `Fetched ${slug}` 
	});
}