// js files configuration
requirejs.config({
	baseUrl: 'components',
	paths: {
		d3: 'd3/d3',
		dataset: 'miso.dataset/dist/miso.ds.deps.0.4.1',
		parcoords: 'parallel-coordinates/d3.parcoords',
		// console log wrapper - read http://patik.com/blog/detailed-console-logging/
		log: 'console.log-wrapper/consolelog',
		jquery: 'jquery/jquery.min',
		jqueryMigrate: 'jquery/jquery-migrate.min',
		jqueryDrag: 'slickgrid/lib/jquery.event.drag-2.0.min',
		slick: 'slickgrid/slick.core',
		slickDataview: 'slickgrid/slick.dataview',
		slickGrid: 'slickgrid/slick.grid',
		slickPager: 'slickgrid/controls/slick.pager'
	},
	shim: {
		"d3": {
			exports: "d3"
		},
		"divgrid": {
			deps: ['d3'],
			exports: "divgrid"
		},
		"parcoords": {
			deps: ['d3'],
			exports: "parcoords"
		},
		"log": {
			exports: "log"
		},
		"jquery": {
			exports: "jQuery"
		},
		"jqueryDrag": {
			deps: ["jquery"]
		},
		"jqueryMigrate": {
			deps: ["jquery"]
		},
		"slick": {
			deps: ["jquery", "jqueryMigrate", "jqueryDrag"],
			exports: "Slick"
		},
		"slickDataview": {
			deps: ["jquery", "slick"]
		},
		"slickPager": {
			deps: ["jquery", "slick"]
		},
		"slickGrid": {
			deps: ["jquery", "slick"]
		}
	}
});

require(['d3', 'dataset', 'parcoords', 'log', "jquery", "slick", "slickGrid", "slickDataview", "slickPager"], function(d3, dataset, parcoords, log){

	console = window.console || (console = { log: function(){} });
	// get data
	var derived,
		dataURI = "data/world_databank_health_indicators.csv",
		/*
		data = new Miso.Dataset({
			url: dataURI,
			delimiter: ","
		}),*/
		// initialize `parcoords`
		parcoords = d3.parcoords()("#health-viz")
			.alpha(0.4)
			.height(1000)
			.margin({top: 50, right: 10, bottom: 50, left: 10});

	// get data using Miso dataset
	/*
	data.fetch({
		success: function() {
			derived = data.countBy("Indicator Name", ["Country Name", "2011"]);
			// log(derived.column("count").data);
		},

		error: function() {
			log('Failed to load data');
		}
	});
*/

	// get data using d3
	var d3data = d3.csv(dataURI, function(data){
		var processedData = rearrangeIndicatorData(data);
		log(processedData);

		// slickgrid needs each data element to have an id
		processedData.forEach(function(d,i) { d.id = d.id || i; });

		parcoords
			.data(processedData)
			.mode("queue")
			.render()
			.createAxes()
			.reorderable()
			.brushable();

		/* Slick grid
		Copied from https://github.com/syntagmatic/parallel-coordinates/blob/master/examples/slickgrid.html
		*/
		// setting up grid
		var column_keys = d3.keys(processedData[0]);
		var columns = column_keys.map(function(key,i) {
			return {
				id: key,
				name: key,
				field: key,
				sortable: true
			}
		});

		var options = {
			enableCellNavigation: true,
			enableColumnReorder: false,
			multiColumnSort: false
		};

		var dataView = new Slick.Data.DataView();
		var grid = new Slick.Grid("#grid", dataView, columns, options);
		var pager = new Slick.Controls.Pager(dataView, grid, $("#pager"));

		dataView.setPagingOptions({pageSize: 50});

		// wire up model events to drive the grid
		dataView.onRowCountChanged.subscribe(function (e, args) {
			grid.updateRowCount();
			grid.render();
	 	});

		dataView.onRowsChanged.subscribe(function (e, args) {
			grid.invalidateRows(args.rows);
			grid.render();
		});

		// column sorting
		var sortcol = column_keys[0];
		var sortdir = 1;

		function comparer(a, b) {
			var x = a[sortcol], y = b[sortcol];
			return (x == y ? 0 : (x > y ? 1 : -1));
		}

		// click header to sort grid column
		grid.onSort.subscribe(function (e, args) {
			sortdir = args.sortAsc ? 1 : -1;
			sortcol = args.sortCol.field;

			if ($.browser.msie && $.browser.version <= 8) {
				dataView.fastSort(sortcol, args.sortAsc);
			} else {
				dataView.sort(comparer, args.sortAsc);
			}
		});

		// highlight row in chart
		grid.onMouseEnter.subscribe(function(e,args) {
			var i = grid.getCellFromEvent(e).row;
			var d = parcoords.brushed() || data;
			parcoords.highlight([d[i]]);
		});
		grid.onMouseLeave.subscribe(function(e,args) {
			parcoords.unhighlight();
		});

		// fill grid with data
		gridUpdate(processedData);

		// update grid on brush
		parcoords.on("brush", function(d) {
			gridUpdate(d);
		});

		function gridUpdate(data) {
			dataView.beginUpdate();
			dataView.setItems(data);
			dataView.endUpdate();
		};
		/*
		End Slickgrid
		*/
	});
	/*
	Rearrange data

	Original data format
	Indicator Name | Indicator Code | Country Name | Country Code | 2003 | 2004 | 2005 | ... | 2011 | 2012

	each indicator will have 214 rows for 214 countries

	Rearranged data format
	Country Name | Country Code | Year | Indicator1 | Indicator2 | Indicator3 | ... | Indicator-n
	*/
	var rearrangeIndicatorData = function(data){
		var d = [],
			numRows = data.length,
			// assume 214 countries
			// numCountries = 214,
			// for now, only work with a smaller subset of countries
			numCountries = 50,
			totalCountries = 214,
			// numIndicators = Math.floor(numRows / numCountries),
			// limit to 10 for now
			// @TODO: create a way to add/ remove columns
			numIndicators = 5,
			years = ["2003", "2004", "2005", "2006", "2007", "2008", "2009", "2010", "2011", "2012"];

		// loop through each country
		for (var i = 0; i < numCountries; i++) {
			// loop through each year
			for (var j = 0; j < years.length; j++) {
				var row = {};
				row["Country Name"] = data[i]["Country Name"];
				// row["Country Code"] = data[i]["Country Code"];
				row["Year"] = years[j];
				// loop through each indicator
				for (var k = 0; k < numIndicators; k++) {
					rowIndex = i + (k * totalCountries);
					indicator = data[rowIndex]["Indicator Name"];
					row[indicator] = data[rowIndex][years[j]];
				}
				d.push(row);
			}
		}
		window.data = d;
		return d;
	}
});