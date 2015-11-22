var mongodb = require('mongodb'),
    express = require('express'),
    _ = require("underscore"),
    app = express(),
    mongoUri = process.env.MONGOLAB_URI || 'mongodb://localhost/oli2';

app.set('port', (process.env.PORT || 3000));

app.use(express.static('ui'));

app.get('/api/maps', function (req, res) {
  console.log(mongoUri);
  res.send();
});

var server = app.listen(app.get('port'), function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Listening at http://%s:%s', host, port);
});
