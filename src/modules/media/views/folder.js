var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var SelectView = require('kiubi/views/ui/select.js');
var RestrictionsView = require('kiubi/modules/customers/views/restrictions');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var Forms = require('kiubi/utils/forms.js');

var Restrictions = require('kiubi/modules/customers/models/restrictions');

module.exports = Marionette.View.extend({
	template: require('../templates/folder.html'),
	className: 'container',
	service: 'media',

	behaviors: [FormBehavior],

	regions: {
		folder: {
			el: "div[data-role='folder']",
			replaceElement: true
		},
		restrictions: {
			el: "div[data-role='restrictions']",
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
			if (this.getOption('enableExtranet')) {
				this.showChildView('restrictions', new RestrictionsView({
					restrictions: this.model.get('restrictions')
				}));
			}
		}
	},

	onChildviewChangeRestrictions: function() {
		this.triggerMethod('field:change');
	},

	onSave: function() {

		var data = Forms.extractFields(this.fields, this);

		if (this.model.get('parent_folder_id') > 0 && this.getOption('enableExtranet')) {
			var r = this.getChildView('restrictions').getRestrictions();
			var collection = new Restrictions();
			collection.setType('media/folders', this.model.get('folder_id'));
			collection.set('customer_id', r.customers);
			collection.set('group_id', r.groups);
			collection.save();
			data.has_restrictions = (r.customers.length + r.groups.length) > 0; // Trick to update sidebar
		}

		return this.model.save(
			data, {
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
		}).fail(function(xhr) {
			var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
			navigationController.showErrorModal(xhr);
		}.bind(this));
	}

});
