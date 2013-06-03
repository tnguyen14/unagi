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
	});

	data.fetch({
		success: function() {
			derived = data.countBy("Indicator Name", ["Country Name", "2011"]);
			log(derived.column("count").data);
			// derived2 = data.groupBy("Indicator Name", ["Country Name", "2011"]);
			// log(derived2);
		},

		error: function() {
			log('Failed to load data');
		}
	});

	var d3data = d3.csv(dataURI, function(data){
		var processedData = rearrangeIndicatorData(data);
		log(processedData);
		var parcoords = d3.parcoords()("#parcoords")
			.data(processedData)
			.render()
			.createAxes();
	});

	// Rearrange data
	var rearrangeIndicatorData = function(data){
		var d = [],
			numRows = data.length,
			// assume 214 countries
			numCountries = 214,
			numIndicators = Math.floor(numRows / numCountries),
			years = ["2003", "2004", "2005", "2006", "2007", "2008", "2009", "2010", "2011", "2012"];


		for (var i = 0; i < numCountries; i++) {
			// loop through each year
			for (var j = 0; j < years.length; j++) {
				var row = {};
				row["Country Name"] = data[i]["Country Name"];
				row["Country Code"] = data[i]["Country Code"];
				for (var k = 0; k < numIndicators; k++) {
					rowIndex = i + (k * numCountries);
					row[data[rowIndex]["Indicator Name"]] = data[rowIndex][years[j]];
				}
				row["Year"] = years[j];
				d.push(row);
			}
		}
		return d;
	}
});