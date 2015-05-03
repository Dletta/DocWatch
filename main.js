/* Server-side Code for express server.
	Application : Document Watch,
	Desc: Document Control with GridFS and Express
	Author: Jachen Duschletta
	Version: alpha 0.0 04/25/2015
*/

/* Dependencies */
var util = require('util');
var express = require('express');
var app = express();
var morgan = require('morgan');
var multer = require('multer');
var fs = require('fs');
var mongo = require('mongodb');

/* Database Setup */
var db = new mongo.Db('docW', new mongo.Server('localhost', 27017));
var GridStore = mongo.GridStore;


/* App Middleware */

app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use(multer({
	dest: './uploads'
}));
app.use(morgan('dev'));

/* http routes */

app.get('/', function (req, res) {
	res.sendFile(__dirname + '/public/index.html');
});

app.get('/api/docList', function (req, res) {
	db.open(function(err, db) {
		console.log("Database Error: " + err);
		var coll = db.collection('fs.files'); 
		coll.find().toArray(function(err, docs) {
			console.log("Query Error: " + err);
			res.send(docs);
			db.close();
		});
		
	});
});

app.post('/api/file', function (req, res){

});

app.post('/uploads', function(req, res) {
	console.log('Upload received, with name: ' + req.body.name);
});



/* Application init */

app.listen(8000);
console.log("Server running on: localhost:8000");