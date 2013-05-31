// js files configuration
requirejs.config({
	baseUrl: 'components',
	paths: {
		d3: 'd3/d3',
		dataset: 'miso.dataset/dist/miso.ds.deps.min.0.4.1',
		parcoords: 'parallel-coordinates/d3.parcoords',
		// console log wrapper - read http://patik.com/blog/detailed-console-logging/
		log: 'console.log-wrapper/consolelog'
	},
	shim: {
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
	var data = new Miso.Dataset({
		url: "data/world_databank_health_indicators.csv",
		delimiter: ","
	});

	data.fetch({
		success: function() {
			log(data.columnNames());
			log(data.column("Country Code").data);
			log(data.column("2012").data);
		},

		error: function() {
			log('Failed to load data');
		}
	});
});