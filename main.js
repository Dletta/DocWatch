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
var events = require('events');
var mongo = require('mongodb');

/* Database Setup */
var db = new mongo.Db('docW', new mongo.Server('localhost', 27017));
var GridStore = mongo.GridStore;
var emitter =  new events.EventEmitter();


/* App Middleware */

app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use(multer({
	dest: './uploads',
	rename: function(fieldname, filename, req, res) {
		return filename;
	}
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

app.get('/api/file/:filename', function (req, res){
	console.log("Requested File: " + util.inspect(req.params.filename));
	db.open(function(err, db) {
		console.log("Database Error: " + err);
		var coll = db.collection('fs.files');
		var filename = req.params.filename;
		coll.findOne({'filename':filename}, {}, function(err, doc){
			GridStore.read(db, doc._id, function(err, buffer){
				console.log("Data read Error: " + err + " for doc " + util.inspect(doc.filename));
				res.setHeader('Content-Disposition', 'attachment;filename='+doc.filename);
				res.send(buffer);
				res.end();
				db.close();	
			});
			
		});
		
	});
});


app.post('/uploadFile', function(req, res) {
	console.log('Upload received, with name: ' + req.body.name);
	console.log("Filename: " + util.inspect(req.files.file.originalname));
	var fileN = req.files.file.originalname;
	db.open(function(err, db) {
		console.log("Database Error: " + err);
		var gFile = new GridStore(db, fileN, "w", {
			"metadata":{
				"author": req.body.name,
				"type": req.body.type
			}
		});
		gFile.open(function(err, gFile){
			console.log("Grid File Error: " + err);
			gFile.writeFile(__dirname + "/uploads/" + fileN, function(err, gFile){
				console.log("Writing to Database Error: " + err);
					gFile.close(function(err, result){
						console.log("Database Data flushed Error: " + err);
						console.log("Data in Database: " + result);
							fs.unlink(__dirname + "/uploads/" + fileN, function(err){
								console.log("Server File Remove Error: " + err);
								if(!err){console.log("Deleted from Server Uploads Folder - " + fileN);}
							});
						db.close()
					});
			});
		});
	});
});


/* Application init */

app.listen(8000);
console.log("Server running on: localhost:8000");