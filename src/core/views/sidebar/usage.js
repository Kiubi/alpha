var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var format = require('kiubi/utils/format.js');

var TooltipBehavior = require('kiubi/behaviors/tooltip');

var Usage = require('kiubi/core/models/usage');

module.exports = Marionette.View.extend({

	template: require('../../templates/sidebar/usage.html'),

	behaviors: [TooltipBehavior],

	initialize: function(options) {
		//this.mergeOptions(options, ['model']);
		this.model = new Usage();

		this.listenTo(this.model, 'sync', this.render);
	},

	templateContext: function() {

		var prct_medias = 0,
			prct_ftp = 0,
			prct_datas = 0,
			prct_free = 0,
			prct_products = 0,
			prct_users = 0,
			prct_forms = 0;

		if (this.model.get('space').total) {
			var total_used = Math.max(this.model.get('space').used, this.model.get('space').total);
			prct_medias = Math.round(this.model.get('space').medias * 100 / total_used);
			prct_ftp = Math.round(this.model.get('space').ftp * 100 / total_used);
			prct_datas = Math.round(this.model.get('space').datas * 100 / total_used);
		}
		if (this.model.get('products').total) {
			prct_products = Math.round(this.model.get('products').used * 100 / this.model.get('products').total);
		}
		if (this.model.get('users').total) {
			prct_users = Math.round(this.model.get('users').used * 100 / this.model.get('users').total);
		}
		if (this.model.get('forms').total) {
			prct_forms = Math.round(this.model.get('forms').used * 100 / this.model.get('forms').total);
		}

		return {
			formatBytes: format.formatBytes,
			prct_medias: prct_medias,
			prct_ftp: prct_ftp,
			prct_datas: prct_datas,
			prct_free: Math.max(0, 100 - prct_medias - prct_ftp - prct_datas),
			prct_products: prct_products,
			prct_users: prct_users,
			prct_forms: prct_forms
		};
	},

	fetch: function() {
		this.model.fetch({
			data: {
				extra_fields: 'forms,products,users'
			}
		});
	}

});
