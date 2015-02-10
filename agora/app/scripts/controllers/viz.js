'use strict';

/**
 * @ngdoc function
 * @name agoraApp.controller:VizCtrl
 * @description
 * # VizCtrl
 * Controller of the agoraApp
 */
angular.module('agoraApp').controller('VizCtrl', function($scope, $routeParams) {

	// $scope.h1 = $routeParams.reportname;

	

	$scope.breadCrumbs = $routeParams; 



	$scope.showMegaBox = function() {
		console.log('clicked on the mega menu'); 
	}; 

	var refreshScopeVars = function() {
		$scope.$apply(function() {
			$scope.h1 = agora.vizfuncs.h1;
			$scope.h2 = agora.vizfuncs.h2;
			$scope.reportUrl = agora.vizfuncs.reportUrl;
			$scope.pages = agora.vizfuncs.pages;
			$scope.url = agora.vizfuncs.url;
		});
	}



	// agora.vizfuncs.testSetH1('ABCDE'); 

	// refreshPageHeadings(); 


	var getReportUrl = function() {

		var group = $routeParams.report,
			cName = $routeParams.id;

		var result = $.grep(pagesObj.repGroup, function(e) {
			return e.groupName == cName;
		});

		if (typeof result[0] == "undefined") {
			// redirect to 404
			console.log('not found');
			return false;
		}

		$scope.pages = result;
		// console.log(result[0].pages[group][0].pageSubheading); 
		$scope.h1 = result[0].pages[group][0].pageHeading;
		$scope.h2 = result[0].pages[group][0].pageSubheading;

		$routeParams.reportname = $scope.h1; 
		return pagesObj.reportsBaseUrl + result[0].pages[group][0].url;
	};




	// VizFuncs.setReportTitle('PRU1'); 

	// VizFuncs.renderViz(getReportUrl()); 

	agora.vizfuncs.renderViz($routeParams, $scope);
	agora.vizfuncs.addEventListeners();
	getReportUrl(); 
	// VizFuncs.addEventListeners(); 

	
	Object.observe(agora.vizfuncs, function(changes){
		console.log('changes'); 
		refreshScopeVars(); 
	}); 


});