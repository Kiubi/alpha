var Backbone = require('backbone');

module.exports = Backbone.Model.extend({

	url: 'sites/@site/stats/report',

	parse: function(response) {
		if ('data' in response) {
			if (response.data === null) return {};
			return response.data;
		}
		return response;
	},

	isNew: function() {
		return false;
	},

	defaults: {
		"start_date": "string",
		"end_date": "string",
		"visitors": "integer",
		"pageviews": "integer",
		"api_hits": "integer",
		"sales": null,
		"sales_label": null,
		"days": [
			/*{
			 "date": "string",
			 "date_f": "string",
			 "hits": "integer",
			 "visits": "integer",
			 "api_pfo": "integer",
			 "sales": "integer"
			 }*/
		]
	},

	/**
	 * 
	 * @param {moment} firstDate
	 * @param {moment} secDate
	 * @param {Number} interval
	 * @returns {*}
	 */
	compare: function(firstDate, secDate, interval) {

		return Backbone.$.when(
			Backbone.ajax({
				url: this.url,
				data: {
					start_date: firstDate.format('DD/MM/YYYY'),
					end_date: firstDate.clone().add(interval, 'days').format('DD/MM/YYYY')
				}
			}),
			Backbone.ajax({
				url: this.url,
				data: {
					start_date: secDate.format('DD/MM/YYYY'),
					end_date: secDate.clone().add(interval, 'days').format('DD/MM/YYYY')
				}
			})
		).then(function(firstResponse, secResponse) {

			return [
				this.parse(firstResponse[0]),
				this.parse(secResponse[0])
			];
		}.bind(this));
	}

});
