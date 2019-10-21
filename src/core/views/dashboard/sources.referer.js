var Marionette = require('backbone.marionette');
var _ = require('underscore');
var format = require('kiubi/utils/format.js');

module.exports = Marionette.View.extend({
	template: require('../../templates/dashboard/sources.referer.html'),

	className: 'post-article dashboard-referer w-100',
	tagName: 'article',

	initialize: function(options) {

		this.mergeOptions(options, ['report']);

		this.listenTo(this.report, 'report', this.render);

	},

	templateContext: function() {

		var hasData = false;
		var referer = null;
		if (this.report.get('summary') && this.report.get('summary').referer) {
			referer = this.report.get('summary').referer;
			hasData = this.report.get('summary').referer.search != null;
		}

		return {
			referer: referer,
			hasData: hasData,
			formatPrct: function(number) {
				return format.formatFloat(number, 2, '');
			},
			formatNumber: function(number) {
				return format.formatFloat(number, 0, ' ');
			}
		};
	}

});
