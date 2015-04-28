/* Server-side Code for express server.
	Application : Document Watch,
	Desc: Document Control with GridFS and Express
*/

/* Dependencies */
var express = require('express');
var app = express();
var morgan = require('morgan');
var mongoose = require('mongoose');
var multer = require('multer');
var fs = require('fs');
var Grid = require('gridfs-stream');

/* Connect to Database and define Schema */

var Schema = mongoose.Schema;
mongoose.connect('mongodb://localhost:27017/docW');
var conn = mongoose.connection;
Grid.mongo = mongoose.mongo;
var gfs = Grid(conn.db);

/* App Middleware */

app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use(multer({dest: './uploads',inMemory:"true" }));
app.use(morgan('dev'));

/* http routes */

app.get('/', function (req, res) {
	res.sendFile(__dirname + '/public/index.html');
});

app.get('/api/docList', function (req, res) {
	gfs.files.find().toArray(function(err, files){
		res.send(files);
	});
});

app.post('/api/docList', function (req, res) {
	console.log(req.params);
});

app.all('/uploads', function(req, res) {
	fs.writeFile('uploads/'+ req.files.filename, req.files.file );
	console.log(req.body);
});



/* Application init */

app.listen(8000);
console.log("Server running on: localhost:8000");