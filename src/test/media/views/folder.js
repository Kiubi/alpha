var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var SelectView = require('../../../views/ui/select');

var FormBehavior = require('../../../behaviors/simple_form');
var Forms = require('../../../utils/forms');

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
				patch: true
			}
		);
	},

	onDelete: function() {
		return this.model.destroy().done(function() {
			this.trigger('delete:folder');
		}.bind(this));
	}

});
