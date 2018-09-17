var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');
var format = require('kiubi/utils/format.js');

var TagView = require('kiubi/views/ui/tag.search.js');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var Forms = require('kiubi/utils/forms.js');

function formatCategoriesTags(categories) {
	return _.map(categories, function(r) {
		return {
			label: r.name,
			value: r.category_id
		};
	});
}

module.exports = Marionette.View.extend({
	template: require('../templates/lengow.html'),
	className: 'container',
	service: 'modules',

	behaviors: [FormBehavior],

	regions: {
		categories: {
			el: "div[data-role='categories']",
			replaceElement: true
		}
	},

	fields: [
		'is_enabled',
		'id',
		'is_tracker_enabled'
	],

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'categories']);
	},

	templateContext: function() {
		return {
			last_export: this.model.get('last_export') ? format.formatDateTime(this.model.get('last_export')) : null
		};
	},

	onRender: function() {
		this.showChildView('categories', new TagView({
			searchPlaceholder: 'Recherche des catégories de produits',
			tags: formatCategoriesTags(this.model.get('categories')),
			inputName: 'categories'
		}));
	},

	onChildviewInput: function(term, view) {
		this.categories.suggest(term, 5, _.pluck(view.getTags(), 'value')).done(function(categories) {
			view.showResults(formatCategoriesTags(categories));
		}.bind(this));
	},

	onSave: function() {

		var data = Forms.extractFields(this.fields, this);

		var tags = this.getChildView('categories').getTags();
		if (tags.length == 0) {
			data.categories = ['']; // HACK : force empty array
		} else {
			data.categories = _.reduce(tags, function(memo, tag) {
				memo.push(tag.value);
				return memo;
			}, []);
		}

		return this.model.save(
			data, {
				patch: true,
				wait: true
			}
		);
	}

});
