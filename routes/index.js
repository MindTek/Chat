const express = require('express');
const router = express.Router();

const testController = require('./controllers/test');

router.get('/', testController);

module.exports = router;