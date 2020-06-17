var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var SelectifyBehavior = require('kiubi/behaviors/selectify.js');

var Layouts = require('../models/layouts');
var Builder = require('../models/builder');

module.exports = Marionette.View.extend({
	template: require('../templates/layout.selector.html'),
	tagName: 'article',
	className: 'post-article',
	behaviors: [SelectifyBehavior],

	ui: {
		'select': "select",
		'create': "a[data-role='create']"
	},

	events: {
		'change @ui.select': 'selectLayout',
		'click @ui.create': 'willCreate'
	},

	initialize: function(options) {
		this.apply = null;
		this.mergeOptions(options, ['layout_id', 'type', 'apply', 'applyName']);
		this.collection = new Layouts();
		this.collection.fetch({
			data: {
				page: this.type
			}
		}).done(function() {
			this.render();
		}.bind(this));
	},

	templateContext: function() {
		return {
			page: this.type,
			layouts: this.collection.toJSON(),
			layout_id: this.layout_id,
			structure: this.getStructure(this.layout_id)
		};
	},

	/**
	 * Get HTML structure of the layout
	 *
	 * @param {int} layout_id
	 * @returns {String}	HTML table
	 */
	getStructure: function(layout_id) {
		var m = this.collection.findWhere({
			layout_id: layout_id
		});

		if (!m || !m.get('model') || !m.get('model').structure) {
			return '';
		}

		return m.get('model').structure.replace('<table>',
			'<table class="template">');
	},

	selectLayout: function() {
		this.layout_id = parseInt(this.getUI('select').val());
		this.render();
		this.triggerMethod('change:layout', this.layout_id, this.collection.findWhere({
			layout_id: this.layout_id
		}));
	},

	willCreate: function() {
		var m = new Builder({
			layout_id: parseInt(this.getUI('select').val()),
			page: this.type,
			name: this.applyName || ''
		});
		var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
		m.save().done(function() {
			var apply = this.apply != null ? '?apply=' + this.apply : '';
			navigationController.navigate('/appearance/drafts/' + m.get('draft_id') + apply);
		}.bind(this)).fail(function(error) {
			navigationController.showErrorModal(error);
		}.bind(this));
	}

});
