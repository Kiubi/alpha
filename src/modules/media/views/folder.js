var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var SelectView = require('kiubi/views/ui/select.js');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var Forms = require('kiubi/utils/forms.js');

module.exports = Marionette.View.extend({
	template: require('../templates/folder.html'),
	className: 'container',
	service: 'media',

	behaviors: [FormBehavior],

	regions: {
		folder: {
			el: "select[data-role='folder']",
			replaceElement: true
		}
	},

	fields: [
		'name',
		'parent_folder_id'
	],

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'folders']);
	},

	onRender: function() {
		if (this.model.get('parent_folder_id') > 0) {
			this.showChildView('folder', new SelectView({
				collection: this.folders,
				selected: this.model.get('parent_folder_id'),
				name: 'parent_folder_id'
			}));
		}
	},

	onSave: function() {
		return this.model.save(
			Forms.extractFields(this.fields, this), {
				patch: true,
				wait: true
			}
		).done(function() {
			if (this.model.get('parent_folder_id') > 0 && this.model.hasChanged('parent_folder_id')) {
				// Re-fetch folder select
				this.folders.fetch({
					data: {
						extra_fields: 'recursive'
					}
				});
			}
		}.bind(this));
	},

	onDelete: function() {
		return this.model.destroy({
			wait: true
		});
	}

});
