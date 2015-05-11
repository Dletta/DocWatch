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

docW.controller('mainController', ['$scope', '$http', 'fileUpload', function($scope, $http, fileUpload){
	$scope.test = "running!";
	$scope.docs = {};
	
	$http.get('/api/docList')
		.success(function(data){
			$scope.docs = data;
			console.log(data);
			console.log("Received response with " + data);
		})
		.error(function(data){
			console.log('Error: ' + data);
		});
		
	$scope.send = function() {
		var file = $scope.file;
		var name = $scope.name;
		var type = $scope.type;
		var url = "/uploadFile";
		$scope.docs = fileUpload.uploadFileToUrl(file, name, type, url);
	};
	
	$scope.select = function(filename) {
		console.log("Requesting: " + filename);
		$http.post("/api/file", {msg:filename}).
		success(function(data){
			console.log("Response Data" + util.inspect(data));
		}).
		error(function(err){
			console.log("Response Error: " + err);
		});
	}
}]);