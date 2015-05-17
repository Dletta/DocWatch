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
var http = require('http');
var mongo = require('mongodb');
var io = require('socket.io')();

/* Setting up Socket Listener */
var server = http.Server(app);

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
app.use(function(err, req, res, next){
	console.log("Server Error: " + err);
	console.log("With Request " + util.inspect(req));
	res.send(err);
	next();
});

/* Global Variables */

var clientFiles = [];

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

app.get('/api/file/:filename', function(req, res){
	console.log("Requested File: " + req.params.filename);
	var fname = req.params.filename;
	console.log("Trying to read " + fname);
	db.open(function(err, db){
		var file = new GridStore(db, fname, 'r');
		file.open(function(err, file){
			file.seek(0, function() {
				file.read(function(err, data){
					fs.writeFile(__dirname+'/clientfiles/'+fname, data, function(err){
						console.log("Wrote File " + fname+ " with Error: " + err);
						fs.readFile(__dirname+'/clientfiles/'+fname, function(err, data){
							res.setHeader('Content-Disposition', 'attachment;filename='+fname);
							res.send(data);
							res.end();
							fs.unlink(__dirname+'/clientfiles/'+fname, function(err){
								console.log('deleted Filename: '+ fname);
							});
						});
					});
				});
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
						console.log("Data in Database");
							fs.unlink(__dirname + "/uploads/" + fileN, function(err){
								console.log("Server File Remove Error: " + err);
								if(!err){console.log("Deleted from Server Uploads Folder - " + fileN);}
							});
						db.close()
						db.open(function(err, db) {
							console.log("Database Error: " + err);
							var coll = db.collection('fs.files'); 
							coll.find().toArray(function(err, docs) {
								console.log("Query Error: " + err);
								console.log("Sending Updated List");
								io.sockets.emit('updateList', docs);
								db.close();
							});
						});	
					});
			});
		});
	});
});

/* Socket Event Listeners */
var users = [];

io.sockets.on('connection', function(socket){
	/* Connected User Events */
	console.log(socket.id + ' has connected!');
	users.push(socket.id);
	console.log('Users:' + users);
	
	/* Client Events */
	socket.on('fileRequest', function(file){
		console.log(util.inspect(file));
	});
	
	socket.on('update', function(){
		console.log(socket.id + " asked for an Update");
		db.open(function(err, db) {
			console.log("Database Error: " + err);
			var coll = db.collection('fs.files'); 
			coll.find().toArray(function(err, docs) {
				console.log("Query Error: " + err);
				console.log("Sending Updated List");
				io.sockets.emit('updateList', docs);
				db.close();
			});
		});	
	});

	/* End of Event Handling*/
});




io.sockets.on('diconnection', function(socket){
	/* Disconnect User Events */
	console.log(socket.id + ' has gone!');
	var index = users.indeOf(socket.id);
	if(index > -1){
		users.splice(index, 1);
	}
});

/* Application init */

server.listen('8000', function(){
	console.log('Server listening on Port 8000');
});
io.listen(server);