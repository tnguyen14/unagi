// js files configuration
requirejs.config({
	baseUrl: 'components',
	paths: {
		d3: 'd3/d3',
		dataset: 'miso.dataset/dist/miso.ds.deps.0.4.1',
		parcoords: 'parallel-coordinates/d3.parcoords',
		// console log wrapper - read http://patik.com/blog/detailed-console-logging/
		log: 'console.log-wrapper/consolelog'
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
		}
	}
});

require(['d3', 'dataset', 'parcoords', 'log'], function(d3, dataset, parcoords, log){

	console = window.console || (console = { log: function(){} });
	// get data
	var derived,
		dataURI = "data/world_databank_health_indicators.csv",
		data = new Miso.Dataset({
			url: dataURI,
			delimiter: ","
		}),
		// initialize `parcoords`
		parcoords = d3.parcoords()("#health-viz")
			.alpha(0.4)
			.height(1000)
			.margin({top: 50, right: 10, bottom: 50, left: 10});

	// get data using Miso dataset
	data.fetch({
		success: function() {
			derived = data.countBy("Indicator Name", ["Country Name", "2011"]);
			// log(derived.column("count").data);
		},

		error: function() {
			log('Failed to load data');
		}
	});

	// get data using d3
	var d3data = d3.csv(dataURI, function(data){
		var processedData = rearrangeIndicatorData(data);
		log(processedData);
		parcoords
			.data(processedData)
			.mode("queue")
			.render()
			.createAxes()
			.brushable();
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
				row["Country Code"] = data[i]["Country Code"];
				row["Year"] = years[j];
				// loop through each indicator
				for (var k = 0; k < numIndicators; k++) {
					rowIndex = i + (k * numCountries);
					indicator = data[rowIndex]["Indicator Name"];
					row[indicator] = data[rowIndex][years[j]];
				}
				d.push(row);
			}
		}
		return d;
	}
});