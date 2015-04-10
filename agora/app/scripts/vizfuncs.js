var agora = window.agora || {};

(function() {
	agora.vizfuncs = {

		reportUrl: '',
		h1: '',
		h2: '',
		help: '', 
		pages: '',
		url: '',
		mainViz: '',
		routeParams: '',
		vizParams: [],
		mainVizDiv: "#mainViz",
		div: '', 
		history: [],
		filters: {},
		customViewName: 0,
		counter: 0,
		filterCounter: 0,
		customUrl: '',
		historyCounter: 0,
		pageId: 'report',
		filterHistory: [],
		parameterHistory: [],
		tabHistory: [], 
		locked: false,
		goingBack: false, 
		routeParams: '', 
		help: '', 					
		tabName: '', 
		 	

		

		renderViz: function(routeParams){
			this.routeParams = routeParams; 
			this.dispose(); 
			
		}, 

		render: function() {

			var browserHeight = $(window).height(); 

			browserHeight = browserHeight - 125; 

  			$("#mainViz").css("min-height", browserHeight); 

			var routeParams = agora.vizfuncs.routeParams; 
			var placeholderDiv = document.getElementById("mainViz");
			
			agora.vizfuncs.customViewName = 0;
			agora.vizfuncs.routeParams = routeParams;
			agora.vizfuncs.getReportUrl(routeParams);

			// html structure to paint viz into
			agora.vizfuncs.div = $(agora.vizfuncs.mainVizDiv); 

			var mainWorkbookUrl = agora.vizfuncs.url;


			var vizOpts = {
				hideTabs: true,
				hideToolbar: true,
				width: agora.vizfuncs.div.parent().innerWidth() + "px",
				height: agora.vizfuncs.div.parent().innerHeight() + "px",
				onFirstInteractive: function() {
					mainWorkbook = agora.vizfuncs.mainViz.getWorkbook();
				}
			};
			
			var mainVizOptions = $.extend({}, vizOpts, agora.vizfuncs.getVizOptions());

			
    		agora.vizfuncs.mainViz = new tableauSoftware.Viz(placeholderDiv, mainWorkbookUrl, mainVizOptions);

    		
		},

		dispose: function(){
			if(typeof agora.vizfuncs.mainViz == 'object') {				
				this.mainViz.dispose(); 
				this.tabName = ""; 
				delete agora.vizfuncs.mainViz; 
				setTimeout(function(){
					agora.vizfuncs.renderViz(agora.vizfuncs.routeParams); 
					// agora.vizfuncs.addEventListeners();	
					// agora.vizfuncs.getReportUrl(agora.vizfuncs.routeParams); 
					agora.vizfuncs.vizEnhancement(); 
				}, 500); 
				

			} else {
				this.render(); 
				agora.vizfuncs.vizEnhancement(); 
				// agora.vizfuncs.addEventListeners();	
				// agora.vizfuncs.getReportUrl(agora.vizfuncs.routeParams); 
			}

			

			
		}, 
		

		vizEnhancement: function() {
			agora.vizfuncs.addEventListeners();	
			agora.vizfuncs.getReportUrl(agora.vizfuncs.routeParams); 
		}, 


		resizeViewButton: function() {			
			if($(".panel-body").length > 0) {				
				// Set view button width
	    		var buttonWidth = $(".panel-body").width(); 
	    		buttonWidth = buttonWidth + 30; 
	    		$(".get-started-bottom").width(buttonWidth); 	
			} else {				
				return; 
			}
			
		}, 
		
		/**
		 * TO DO
		 * @return {[type]} [description]
		 */
		resizeViz: function() {	
			// If we have the mainViz defined we don't need to 
			// resize the 'view' button on the reports page :) 
			if(typeof mainViz == "undefined") {								
				this.resizeViewButton(); 
				// No need to do any other resizing magic here
				return; 
			}


			// Calculate height based on if fullscreen or not as we 
			// take into account the headers
			var gap, 
				fullSize, 
				height, 
				width, 
				browserHeight = $(window).height();  
			if($("#fullScreen").hasClass("fullScreenButtonActive")) {
				
				gap = 20; 
			} 
			// When exiting fullscreen
			else {
				
				gap = 125; 			
				fullSize = 1; 
			}
			
			
			browserHeight = (browserHeight - gap); 
			

  			$("#mainViz").css("height", browserHeight); 

			height = $("#mainViz").height(); 
			width = $("#mainViz").width(); 

			// Compensate for scrollbars appearing
			if(fullSize) {		
				// commented out this line as original problem seems to have resolved
				// width = (width+16); 
			}
			
			agora.vizfuncs.mainViz.setFrameSize(width, height); 
		},


		showDownloadWorkbookDialog: function() {
			agora.vizfuncs.mainViz.showDownloadWorkbookDialog(); 
		}, 

		showExportPDFDialog: function() {
			agora.vizfuncs.mainViz.showExportPDFDialog(); 
		}, 

		showShareDialog: function() {
			agora.vizfuncs.mainViz.showShareDialog(); 
		}, 

		showExportDataDialog: function() {
			agora.vizfuncs.mainViz.showExportDataDialog(); 
		}, 

		showExportImageDialog: function() {
			agora.vizfuncs.mainViz.showExportImageDialog(); 
		}, 

		showExportCrossTabDialog: function() {
			agora.vizfuncs.mainViz.showExportCrossTabDialog(); 
		}, 
		
		revertAll: function() {						
			agora.vizfuncs.mainViz.revertAllAsync();
		}, 

		getVizOptions: function() {

			return this.vizParams;
		},

		setVizParams: function(key, value) {
			// this.vizParams[key] = value;
			var histObj = {};
			histObj[key] = value;
			agora.vizfuncs.vizParams.push(histObj);
		},

		/**
		 * Looks up the report details based on the url parameters
		 * and sets the page's h1 and h2 attributes
		 * @param  {[object]} routeParams [description]
		 */
		getReportUrl: function(routeParams) {			 
			var group = routeParams.report,
				cName = routeParams.id;

			var result = $.grep(pagesObj.repGroup, function(e) {
				return e.groupName == cName;
			});

			if (typeof result[0] == "undefined") {
				console.log('not found');
				return false;
			} else {				
				this.pages = result;
				this.h2 = result[0].pages[group][0].pageSubheading;
				this.url = pagesObj.reportsBaseUrl + result[0].pages[group][0].url;
				// Dynamically look up the help link if the tab has changed. 
				if(this.tabName.length == 0) { // Invoked if no tab change 					
					this.help = result[0].pages[group][0].help;						
				} else { // If tab change, get the link based on the tab name. 					
					if(this.tabName.length == 0) {
						this.help = result[0].pages[group][0].help;	
					} else {
						this.help = Mapper.getHelp(this.tabName); 						
					}
					
				}
			}
		},

		

		/**
		 * Sets the report title
		 * @param {[string]} reportName [description]
		 */
		setReportTitle: function(reportName) {
			this.getReportUrl(this.routeParams);

			var reports = [];
			$.each(this.pages[0].pages, function(index, value) {
				reports.push(value);
			});

			$.each(reports, function(index, value) {
				$.each(value, function(index, value) {
					if (value.pageId == reportName) {
						agora.vizfuncs.pageId = value.pageId;
						agora.vizfuncs.h1 = value.pageHeading;
						agora.vizfuncs.h2 = value.pageSubheading;
					}
				});
			});
		},

		addEventListeners: function() {			
			this.mainViz.addEventListener("tabswitch", this._ventOnTabSwitch);
			this.mainViz.addEventListener("parametervaluechange", this._ventOnParameterChanged);
			this.mainViz.addEventListener("filterchange", this._ventOnFilterChanged);
		},


		/**
		 * What to do when the tabs switch
		 */
		_ventOnTabSwitch: function(e) {
			// Get the previous tabname to record into history			
			// and write the old sheet name to history model
			agora.vizfuncs.recordLastTab(e.getOldSheetName()); 
			// Get the current tabname			
			agora.vizfuncs.tabName = agora.vizfuncs.mainViz.getWorkbook().getActiveSheet().getName();
			// Update the report titles with the new tab name
			agora.vizfuncs.setReportTitle(agora.vizfuncs.tabName);
			// Update the viz wrapper			
			agora.vizfuncs.onChange();		
			// Update the help link based on the tab name
			agora.vizfuncs.help = Mapper.getHelp(agora.vizfuncs.tabName); 

		},

		recordLastTab: function(tabName) {			
			var that = agora.vizfuncs; 			

			// If the user clicked on back, don't record the tab
			if(that.goingBack) {
				that.goingBack = false; 
				return; 
			}
			
		
			if(that.history.length == 0) {
				var histObj = {
					report: agora.vizfuncs.pageId,
					filters: agora.vizfuncs.filterHistory,
					params: agora.vizfuncs.parameterHistory
				};
				// Push the entire filters and params to history obj
				agora.vizfuncs.history.push(histObj);
				// Increment history counter; 
				agora.vizfuncs.historyCounter++;
			} 
				
			var lastObj = that.history[that.historyCounter - 1];	
			
			lastObj['tabName'] = tabName; 
			that.tabHistory.push(lastObj);
			that.goingBack = false;  
		}, 

		/**
		 * What to do when the parameters change
		 */
		_ventOnParameterChanged: function() {
			// Save the current state to history
			// agora.vizfuncs.recordHistory(); 
			// return; 
			// agora.vizfuncs._getParametersAsync();
			agora.vizfuncs.onChange();
		},



		/**
		 * What to do when the filters change
		 * @return {[type]} [description]
		 */
		_ventOnFilterChanged: function() {
			// To stop Tableau iterating over each listener event, we implement a
			// counter with a timeout. With the first iteration we set the counter to 1 
			// and subsequently return if greater than 0. The timeout resets the counter; 
			if (agora.vizfuncs.filterCounter > 0) {
				return;
			}

			// Save the current state to history
			// agora.vizfuncs.recordHistory(); 
			agora.vizfuncs.onChange();

			// agora.vizfuncs._getFiltersAsync();
			agora.vizfuncs.filterCounter++;

			setTimeout(function() {
				agora.vizfuncs.filterCounter--;
			}, 3000);
		},

		// Called on param or filter change, or tab change maybe??
		recordHistory: function() {
			var that = agora.vizfuncs;

			// var customName = that.createCustomViewName().toString(); 

			var customName = that.customViewName.toString();
			that.saveCustomView(customName);
			// increment the value
			that.customViewName++;
		},

		onBackOld: function() {
			var that = agora.vizfuncs;
			// var viewName = that.getCustomViewName(); 
			// Decrement viewname
			that.customViewName--;

			if (that.customViewName <= -0) {
				console.log('no more history');
				return;
			}
			console.log('View Name: ' + that.customViewName);

			that.showCustomView(that.customViewName.toString());
			// Remove previous custom view from server
			that.removeCustomView(that.customViewName);

		},



		applyParams: function(params) {
			mainWorkbook = agora.vizfuncs.mainViz.getWorkbook();			
			
			if(!params.length) {
				return; 
			} 
			
			$.each(params[0], function(k, v) {			
				mainWorkbook.changeParameterValueAsync(v.name, v.values[1]);
			});

		},

		applyFilters: function(filters) {
			mainWorkbook = agora.vizfuncs.mainViz.getWorkbook();
			var activeSheet = mainWorkbook.getActiveSheet(); 
			var worksheets = activeSheet.getWorksheets(); 
			var worksheet = worksheets[1]; 			

			var activeSheet = mainWorkbook.getActiveSheet();

			$.each(filters[0], function(k, v){
				// console.log(v.name);
				// console.log(v.values); 
				worksheet.applyFilterAsync(v.name, v.values, "REPLACE"); 
			});
		},


		getLastHistoryState: function() {
			var that = agora.vizfuncs;

			// Decrement the history counter
			that.historyCounter--;

			// var lastObj = that.history[Object.keys(that.history)[Object.keys(that.history).length - 2]]; 
			var lastObj = that.history[that.historyCounter - 1];

			return lastObj;
		},

		

		onBackAll: function() {

			console.log('going back');
			var that = agora.vizfuncs;
			that.locked = true;
			var lastStateObj = agora.vizfuncs.getLastHistoryState();

			that.applyParams(lastStateObj.params);
			that.applyFilters(lastStateObj.filters);
		},

		onBack: function() {
			var that = agora.vizfuncs; 
			that.locked = true; 
			that.goingBack	= true; 
			
			var lastTabHistory =  that.tabHistory[Object.keys(that.tabHistory)[Object.keys(that.tabHistory).length - 1]];

			that.tabHistory.pop();  

			that.changeTab(lastTabHistory); 

		}, 

		changeTab: function(lastTabHistory) {
			var that = agora.vizfuncs; 


			mainWorkbook = that.mainViz.getWorkbook();

			// that.mainViz.pauseAutomaticUpdatesAsync(); 

			var lastTabName = lastTabHistory.tabName; 
			var filters = lastTabHistory.filters; 
			var params = lastTabHistory.params; 

			

			mainWorkbook.activateSheetAsync(lastTabName); 
			that.applyParams(params); 
			that.applyFilters(filters); 

			// Remove the newly created entry after tab change 
			// as we're not interested in this one. 
			that.tabHistory.pop(); 
			// that.mainViz.resumeAutomaticUpdatesAsync(); 
		}, 

		onChange: function() {
			var that = agora.vizfuncs; 

			if (agora.vizfuncs.locked) {
				// var tabName = agora.vizfuncs.mainViz.getWorkbook().getActiveSheet().getName();
				// agora.vizfuncs.setReportTitle(tabName);
				// console.log('locked');
				agora.vizfuncs.locked = false;
				return;
			} else {
				// console.log('not locked');
			}

			if (agora.vizfuncs.counter <= 0) {
				// doing the onchange first time to get the tab title. 
				// Can be slow 
				
				setTimeout(function(){
					var tabName = agora.vizfuncs.mainViz.getWorkbook().getActiveSheet().getName();
					agora.vizfuncs.setReportTitle(tabName);
					agora.vizfuncs.counter++;
					agora.vizfuncs.tabName = tabName; 
				}, 1200); 

				
			}



			// Clear old filter and param arrays			
			agora.vizfuncs.filterHistory = [];
			agora.vizfuncs.parameterHistory = [];

			// Store the filters and parameters to history		

			agora.vizfuncs.getFilters();
			agora.vizfuncs.getParameters();
			var histObj = {
				report: agora.vizfuncs.pageId,
				filters: agora.vizfuncs.filterHistory,
				params: agora.vizfuncs.parameterHistory
			};
			// Push the entire filters and params to history obj
			agora.vizfuncs.history.push(histObj);
			// Increment history counter; 
			agora.vizfuncs.historyCounter++;
		},

		getParameters: function() {


			mainWorkbook = agora.vizfuncs.mainViz.getWorkbook();

			if(typeof mainWorkbook == "undefined") {
				return; 
			}

			var arrParams = [];
			var paramValues = [];
			var onSuccess = function(params) {

				window.params = params;

				$.each(params, function(k, v) {

					// console.log(v.getName()); 
					$.each(v.getCurrentValue(), function(key, val) {

						// console.log(val); 
						paramValues.push(val);
					});

					var paramObj = {
						name: v.getName(),
						values: paramValues
					};

					// console.log(paramObj); 

					paramValues = [];
					arrParams.push(paramObj);
				});

				agora.vizfuncs.parameterHistory.push(arrParams);
			};

			var onError = function(err) {
				console.log('Error!!');
			};

			mainWorkbook.getParametersAsync().then(onSuccess, onError);			
		},

		getFilters: function(currentKey, counter) {
			mainWorkbook = agora.vizfuncs.mainViz.getWorkbook();


			var arrFilters = [];
			var filterValues = [];
			var onSuccess = function(filters) {

				$.each(filters, function(k, v) {

					$.each(v.$C, function(key, val) {
						filterValues.push(val.formattedValue);
					});

					var filterObj = {
						name: v.$2,
						values: filterValues
					};

					filterValues = [];
					arrFilters.push(filterObj);
				});

				// console.log(arrFilters); 
				// console.log('Pusihing to filterHistory');
				agora.vizfuncs.filterHistory.push(arrFilters);
			};
			var onError = function(err) {
				console.log('Error!!');
			};

			setTimeout(function(){
				mainWorkbook.getActiveSheet().getWorksheets()[0].getFiltersAsync().then(onSuccess, onError);
				
			}, 300); 
			
		},



		// Should incorporate a guid but because I want to manually clean 
		// the custom views, not yet impletmented
		createCustomViewName: function() {
			var customName = this.customViewName;

			this.customViewName++;

			return customName;
		},

		// As this will be called on back button, 
		// we should decrement the view name
		getCustomViewName: function() {
			var that = agora.vizfuncs;

			// return that.customViewName -1; 
			return that.customViewName;
		},

		saveCustomView: function(name) {
			mainWorkbook = agora.vizfuncs.mainViz.getWorkbook();

			var onSuccess = function(view) {
				console.log('view: ' + view); 

				newCustomView = view;
			};

			var onError = function(err) {
				console.log('Error!!!');
			};

			// mainWorkbook.rememberCustomViewAsync(name).then(onSuccess, onError); 
		},

		showCustomView: function(name) {

			console.log('Showing: ' + name);
			mainWorkbook = agora.vizfuncs.mainViz.getWorkbook();

			mainWorkbook.showCustomViewAsync(name.toString()).then(onSuccess, onError);
		},

		generateLink: function() {
			newCustomView.saveAsync().then(function() {
				return newCustomView.getUrl();
			});
		},

		removeCustomView: function(name) {
			mainWorkbook = agora.vizfuncs.mainViz.getWorkbook();
			mainWorkbook.removeCustomViewAsync(name.toString());
		}
	}
})();