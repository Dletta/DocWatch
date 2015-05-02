/* Server-side Code for express server.
	Application : Document Watch,
	Desc: Document Control with GridFS and Express
	Author: Jachen Duschletta
	Version: alpha 0.0 04/25/2015
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
app.use(multer({
	dest: './uploads',
	rename: function(fieldname, filename, req, res){
		return filename
	},
	onFileUploadComplete: function (file, req, res) {
		var writestream = gfs.createWriteStream({filename: file.originalname, metadata:{ documentname: req.body.name}});
		fs.createReadStream(file.path).pipe(writestream);
		console.log(file.originalname + ' uploaded to DB from ' + file.path);
		gfs.files.find().toArray(function(err, files){
			res.send(files);
		});
	}

}));
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

app.post('/api/file', function (req, res){
	var filename = req.body.filename;
	res.end("<html>"+filename+"</html>");
});

app.post('/uploads', function(req, res) {
	console.log('Upload received, with name: ' + req.body.name)
});



/* Application init */

app.listen(8000);
console.log("Server running on: localhost:8000");