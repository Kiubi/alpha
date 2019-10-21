var Marionette = require('backbone.marionette');

var MobilityView = require('./sources.mobility.js');
var RefererView = require('./sources.referer.js');

module.exports = Marionette.View.extend({
	template: require('../../templates/dashboard/sources.html'),

	attributes: function() {
		return {
			class: 'col-12 col-lg-' + this.model.get('size') + ' order-lg-' + this.model.get('order') + ' d-flex flex-column'
		};
	},

	regions: {
		mobility: {
			el: "article[data-role='mobility']",
			replaceElement: true
		},
		referer: {
			el: "article[data-role='referer']",
			replaceElement: true
		}
	},

	initialize: function(options) {
		this.mergeOptions(options, ['report']);
	},

	onRender: function() {

		this.showChildView('mobility', new MobilityView({
			report: this.report
		}));

		this.showChildView('referer', new RefererView({
			report: this.report
		}));
	}

});
