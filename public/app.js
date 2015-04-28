var docW = angular.module('docW', []);

docW.directive('file', function(){
	return {
		scope: {
			file: '='
		},
		link: function(scope, el, attrs){
			el.bind('change', function(event){
				var files = event.target.files;
				var file = files[0];
				scope.file = file ? file.name : undefined;
				scope.$apply();
			});
		}
	};
});

docW.controller('mainController', ['$scope', '$http', function($scope, $http){
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
		$http({
			method: 'POST',
			url: '/uploads',
			headers:{
				'Content-Type':'undefined'
			},
			data:{
				file: $scope.doc.file,
				text: $scope.doc.name
			}
		});
	};
	
}]);