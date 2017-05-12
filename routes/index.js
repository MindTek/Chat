const express = require('express');
const router = express.Router();

router.get('/', function(req, res) {
  res.send('Ciao Matteo! La chiamata è giusta!');
});

router.post('/', function(req, res) {
	console.log(req.body);
	res.send(req.body);
});

module.exports = router;