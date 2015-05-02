var docW = angular.module('docW', []);

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
	this.uploadFileToUrl = function(file, name, uploadUrl) {
		var fd = new FormData();
		fd.append('file', file);
		fd.append('name', name);
		$http.post(uploadUrl, fd, {
			transformRequest: angular.identity,
			headers: {'Content-Type': undefined}
		})
		.success(function(data) {
			console.log('Upload success!')
		})
		.error(function(data) {
			console.log('Error: ' + data);
		});
	}
}]);

docW.service('getFile', ['$http', function($http) {
	this.getIt = function(filename, uploadUrl) {
		var fd = new FormData();
		fd.append('filename', filename);
		$http.post(uploadUrl, fd, {
			transformRequest: angular.identity,
			headers: {'Content-Type': undefined}
		})
		.error(function(data) {
			console.log('Error: ' + data);
		});
	}
}]);

docW.controller('mainController', ['$scope', '$http', 'fileUpload', 'getFile', function($scope, $http, fileUpload, getFile){
	$scope.test = "it works!";
	$scope.doc = {};
	
	$http.get('/api/docList')
		.success(function(data){
			$scope.doc = data;
			console.log(data);
		})
		.error(function(data){
			console.log('Error: ' + data);
		});
		
		$scope.uploadFile = function() {
			var file = $scope.file;
			var uploadUrl = "/uploads";
			var name = $scope.name;
			fileUpload.uploadFileToUrl(file, name, uploadUrl);
			$scope.file = "";
			$scope.name = "";
		};
		
		$scope.download = function() {
			var filename = $scope.filename;
			console.log("Trying to get file: " + filename);
			var uploadUrl = "/api/file";
			getFile.getIt(filename, uploadUrl);
		};
	
}]);