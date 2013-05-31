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
		data = new Miso.Dataset({
		url: "data/world_databank_health_indicators.csv",
		delimiter: ","
	});

	data.fetch({
		success: function() {
			derived = data.countBy("Indicator Name", ["Country Name", "2011"]);
			log(derived.column("Indicator Name").data);
			log(derived.column("count").data);
		},

		error: function() {
			log('Failed to load data');
		}
	});
});