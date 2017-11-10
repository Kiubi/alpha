var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var _string = require('underscore.string');

var RowActionsBehavior = require('kiubi/behaviors/ui/row_actions.js');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var Forms = require('kiubi/utils/forms.js');

var RowView = Marionette.View.extend({
	template: require('../templates/taxes.row.html'),
	className: 'list-item',

	behaviors: [RowActionsBehavior],

	ui: {
		'list': 'div[data-role="list"]',
		'form': 'form[data-role="edit"]',
		'errors': 'div[data-role="errors"]'
	},

	templateContext: function() {
		return {
			vat_rate_formatted: _string.numberFormat(parseFloat(this.model.get('vat_rate')), 2, ',', ' ')
		};
	},

	onActionDelete: function() {
		return this.model.destroy();
	},

	onActionEdit: function() {
		this.getUI('list').hide();
		this.getUI('form').show();

	},

	onActionCancel: function() {
		this.getUI('form').hide();
		this.getUI('list').show();
	},

	onActionSave: function() {
		Forms.clearErrors(this.getUI('errors'), this.el);

		return this.model.save(
				Forms.extractFields(['vat_rate', 'is_default'], this), {
					patch: true,
					wait: true
				}
			)
			.done(function() {
				this.model.collection.fetch();
			}.bind(this))
			.fail(function(xhr) {
				Forms.displayErrors(xhr, this.getUI('errors'), this.el);
			}.bind(this));
	}

});

var ListView = require('kiubi/views/ui/list.js');

module.exports = Marionette.View.extend({
	template: require('../templates/taxes.html'),
	className: 'container',
	service: 'catalog',
	behaviors: [FormBehavior],

	fields: [
		'display_taxes',
		'is_duty_free'
	],

	initialize: function(options) {
		this.mergeOptions(options, ['collection', 'model']);
	},

	regions: {
		list: {
			el: "article[data-role='list']",
			replaceElement: true
		}
	},

	onRender: function() {
		if (!this.model.get('is_duty_free')) {
			this.collection.fetch();
			this.showChildView('list', new ListView({
				collection: this.collection,
				rowView: RowView,

				title: 'Liste des taxes'
			}));
		}
	},

	onSave: function() {
		return this.model.save(
			Forms.extractFields(this.fields, this), {
				patch: true
			}
		).done(function() {
			this.render();
		}.bind(this));
	}

});
