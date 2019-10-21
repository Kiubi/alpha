var Backbone = require('backbone');
var CollectionUtils = require('kiubi/utils/collections.js');
var moment = require('moment');


module.exports = CollectionUtils.KiubiModel.extend({

	url: 'sites/@site/stats/graphs',

	isNew: function() {
		return false;
	},

	defaults: {
		"top": {},
		"summary": {},
		"days": []
	},

	/**
	 * 
	 * @param {moment} firstDate
	 * @param {moment} secDate
	 * @param {Number} interval
	 * @param {Array} data
	 * @returns {*}
	 */
	compare: function(firstDate, secDate, interval, data) {

		var hier = moment().add(-1, 'days');
		var firstEnd = firstDate.clone().add(interval, 'days');
		var secEnd = secDate.clone().add(interval, 'days');

		firstEnd = hier.diff(firstEnd, 'days') >= 0 ? firstEnd : hier;
		secEnd = hier.diff(secEnd, 'days') >= 0 ? secEnd : hier;

		data = data || {};
		data.start_date = firstDate.format('DD/MM/YYYY');
		data.end_date = firstEnd.format('DD/MM/YYYY');
		data.compare_date = secDate.format('DD/MM/YYYY');

		return Backbone.ajax({
			url: this.url,
			data: data
		}).then(function(data, meta) {
			this.set(data);
			return data;
		}.bind(this));
	}

});
