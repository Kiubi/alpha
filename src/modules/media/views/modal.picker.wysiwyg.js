var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var format = require('kiubi/utils/format.js');
var Forms = require('kiubi/utils/forms.js');

var Session = Backbone.Radio.channel('app').request('ctx:session');

module.exports = Marionette.View.extend({
	template: require('../templates/modal.picker.wysiwyg.html'),

	ui: {
		'integration_type': '#integration_type'
	},

	integration: 'file', // file | inline

	events: {
		"change @ui.integration_type": function(event) {
			this.integration = Backbone.$(event.currentTarget).val() == 'inline' ?
				'inline' : 'file';
			this.render();
		}
	},

	initialize: function(options) {
		this.mergeOptions(options, ['model']);
		this.integration = this.model.get('type') == 'image' ? 'inline' : 'file';
	},

	templateContext: function() {
		return {
			integration: this.integration,
			last_date: format.formatDateTime(this.model.get('modification_date')),
			size: format.formatBytes(this.model.get('weight'), 2),
			convertMediaPath: Session.convertMediaPath.bind(Session)
			// TODO tailles de la mediatheque
		};
	},

	onActionModal: function() {

		var fields = [
			'title',
			'class',
			'xtra_name',
			'xtra_file',
			'xtra_weight',
			'xtra_modification',
			'xtra_author'
		];
		if (this.model.get('type') == 'image') {
			fields.push(
				'integration_type',
				'image_variant',
				'image_align',
				'alt',
				'margin_top',
				'margin_right',
				'margin_bottom',
				'margin_left',
				'image_width',
				'image_height',
				'xtra_size'
			);
		}

		var settings = Forms.extractFields(fields, this);

		this.triggerMethod('insert:file', settings);
		this.triggerMethod('close:modal');
	}

});
