var docW = angular.module('docW', []);
var data = {};

docW.directive('fileModel', function($parse){
	return {
		restrict: 'A',
		link: function(scope, element, attrs) {
			var model = $parse(attrs.fileModel);
			var modelSetter = model.assign;
			
			element.bind('change', function() {
				scope.$apply(function() {
					modelSetter(scope, element[0].files[0]);
				});
			});
		}
	};
});

docW.service('fileUpload', ['$http', function($http) {
	this.uploadFileToUrl = function(file, name, type, uploadUrl) {
		var fd = new FormData();
		fd.append('file', file);
		fd.append('name', name);
		fd.append('type', type);
		$http.post(uploadUrl, fd, {
			transformRequest: angular.identity,
			headers: {'Content-Type': undefined}
		})
		.success(function(data) {
			console.log('Upload success!')
			return data;
		})
		.error(function(data) {
			console.log('Error: ' + data);
		});
	}
}]);

docW.controller('mainController', ['$scope', '$http', 'fileUpload', 'socket', function($scope, $http, fileUpload, socket){
	$scope.test = "running!";
	$scope.docs = {};
	
	socket.emit('update');
		
	$scope.send = function() {
		var file = $scope.file;
		var name = $scope.name;
		var type = $scope.type;
		var url = "/uploadFile";
		$scope.docs = fileUpload.uploadFileToUrl(file, name, type, url);
	};
	
	socket.on('updateList', function(docs){
		console.log('Received Updated List');
		$scope.docs = docs;
	});
	
}]);



/*Getting Socket Ready to be sued in the Scope Object*/
docW.factory('socket', function($rootScope){
	var socket = io.connect();
	return {
		on: function(eventName, callback) {
			socket.on(eventName, function() {
				var args = arguments;
				$rootScope.$apply(function() {
					callback.apply(socket, args);
				});
			});
		},
		emit: function(eventName, data, callback) {
			socket.emit(eventName, data, function() {
				var args = arguments;
				$rootScope.$apply(function() {
					if(callback) {
						callback.apply(socket, args);
					}
				});
			});
		}
	};
});