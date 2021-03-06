var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var _ = require('underscore');

var RowActionsBehavior = require('kiubi/behaviors/ui/row_actions.js');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var Forms = require('kiubi/utils/forms.js');
var format = require('kiubi/utils/format.js');

var NewRowView = Marionette.View.extend({
	template: require('../templates/taxes.new.html'),
	className: 'post-content post-list',

	behaviors: [RowActionsBehavior],

	ui: {
		'form': 'form[data-role="new"]',
		'errors': 'div[data-role="errors"]'
	},

	templateContext: function() {
		return {
			tax_id: 'new'
		};
	},

	onActionSave: function() {

		var m = new this.collection.model();
		return m.save(
				Forms.extractFields(['is_default', 'vat_rate'], this))
			.done(function() {
				this.getUI('form').hide();
				this.collection.add(m);
			}.bind(this))
			.fail(function(error) {
				Forms.displayErrors(error, this.getUI('errors'), this.el);
			}.bind(this));
	}

});

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
			vat_rate: format.formatFloat(this.model.get('vat_rate'))
		};
	},

	onActionDelete: function() {
		return this.model.destroy({
			wait: true
		}).fail(function(error) {
			var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
			navigationController.showErrorModal(error);
		});
	},

	onActionSave: function() {

		return this.model.save(
			Forms.extractFields(['vat_rate', 'is_default'], this), {
				patch: true,
				wait: true
			}
		).fail(function(error) {
			Forms.displayErrors(error, this.getUI('errors'), this.el);
		}.bind(this));
	}

});

var ListView = require('kiubi/core/views/ui/list.js');

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

		// Handle collection refetch if default tax change
		this.listenTo(this.collection, 'change', function(model, options) {

			if (options.merge) {
				// onchange event due to collection fetch
				return;
			}
			if (model.hasChanged('is_default')) {
				this.collection.fetch({
					reset: true
				});
			}
		});
		this.listenTo(this.collection, 'add', function(model, options) {
			if (model.hasChanged('tax_id') && model.get('is_default')) this.collection.fetch({
				reset: true
			});
		});
		this.listenTo(this.collection, 'remove', function(model, options) {
			if (model.get('is_default')) this.collection.fetch({
				reset: true
			});
		});
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
				newRowView: NewRowView,

				title: 'Liste des taxes'
			}));
		}
	},

	onSave: function() {

		var data = Forms.extractFields(this.fields, this);
		data.display_taxes = (data.display_taxes == '1');

		return this.model.save(
			data, {
				patch: true
			}
		).done(function() {
			this.render();
		}.bind(this));
	}

});
