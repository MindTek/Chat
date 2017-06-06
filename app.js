/* MAIN */
const express = require('express');
const bodyParser = require('body-parser');
const {logger} = require('./helpers/init');
const app = express();
const api = require('./routes/api');
const hook = require('./routes/hook');
const port = 8080;

/* ROUTING INIT */
app.use(bodyParser.json());
app.use('/api', api);
app.use('/hook', hook);
app.listen(port, function () {
  logger.info('Listening on port ' + port +'...');
});