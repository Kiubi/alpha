var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var format = require('kiubi/utils/format.js');
var moment = require('moment');


module.exports = Marionette.View.extend({
	template: require('../../templates/dashboard/plan.html'),

	events: {
		'click a[data-role="subscription"]': function() {
			window.open(this.session.autologBackLink('/comptes/formules/crediter.html'));
		},
		'click a[data-role="plan"]': function() {
			window.open(this.session.autologAccountLink('/sites/formule.html?code_site=' + this.session.site.get('code_site')));
		}
	},

	initialize: function(options) {
		this.mergeOptions(options, ['session']);
	},

	templateContext: function() {

		var plan = this.session.site.get('plan');
		var interval_closing, interval_trial;
		if (plan && plan.closing_date) {
			// +1 => site is closed at the end of the closing day
			interval_closing = Math.ceil(moment(plan.closing_date, 'YYYY-MM-DD').diff(moment(), 'days', true)) + 1;
		}
		if (plan && plan.endtrial_date) {
			// +1 => trail is ended at the end of end trial day
			interval_trial = Math.ceil(moment(plan.endtrial_date, 'YYYY-MM-DD').diff(moment(), 'days', true)) + 1;
		}

		return {
			site: this.session.site.toJSON(),
			user: this.session.user.toJSON(),
			endtrial_date: plan ? format.formatDate(plan.endtrial_date) : '',
			closing_date: plan ? format.formatDate(plan.closing_date) : '',
			interval_closing: interval_closing,
			interval_trial: interval_trial,
			plural: format.plural,
		};
	}

});
