var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');
var _string = require('underscore.string');

var ScrollBehavior = require('kiubi/behaviors/infinite_scroll.js');
var Session = Backbone.Radio.channel('app').request('ctx:session');

var RowView = Marionette.View.extend({
	template: require('../templates/modal.categories.row.html'),
	className: 'list-item list-item-md',

	events: {
		'click a[data-role="select"]': function() {
			this.triggerMethod('select:category', this.model);
		}
	},

	initialize: function(options) {
		this.mergeOptions(options, ['selected']);
	},

	templateContext: function() {
		return {
			convertMediaPath: Session.convertMediaPath.bind(Session),
			short_desc: _string.prune(_string.stripTags(this.model.get('description')), 120),
			is_selected: _.indexOf(this.selected || [], this.model.get('category_id')) >= 0
		};
	}

});

var ListView = Marionette.CollectionView.extend({
	className: 'post-content post-list',
	childView: RowView,

	behaviors: [{
		behaviorClass: ScrollBehavior,
		contentEl: '.modal-body'
	}],

	// Proxy to parent view
	onChildviewSelectCategory: function(model) {
		this.triggerMethod('select:category', model);
	}

});

module.exports = Marionette.View.extend({
	template: require('../templates/modal.categories.html'),

	regions: {
		list: {
			el: "div[data-role='list']",
			replaceElement: true
		}
	},

	ui: {
		'term': 'input[name="term"]',
	},

	currentTerm: null,
	currentFetch: null,


	events: {
		'keyup @ui.term': _.debounce(function(e) {
			this.currentTerm = this.getUI('term').val();
			this.updateFilter();
		}, 300)
	},

	initialize: function(options) {

		this.mergeOptions(options, ['collection', 'selected']);

		this.currentTerm = null;
		this.currentFetch = null;

		this.start();
	},

	onRender: function() {

		this.showChildView('list', new ListView({
			collection: this.collection,
			childViewOptions: {
				selected: this.selected || []
			}
		}));
	},

	onChildviewChange: function(value, view) {
		this.getUI('term').val('');
		this.currentTerm = '';
		this.updateFilter();
	},

	updateFilter: function() {
		this.start(this.currentTerm);
	},

	start: function(term) {

		if (this.currentFetch) {
			this.currentFetch.abort();
		}

		this.collection.reset(); // immediately clear listing BEFORE request
		this.currentFetch = this.collection.fetch({
			reset: true, // require to resolve merging concurrent requests
			data: {
				term: term || '' // hack to hide catalog homepage
			}
		}).always(function() {
			this.currentFetch = null;
		}.bind(this));
	},

	onChildviewSelectCategory: function(model) {
		if (model.get('is_main')) return; // no homepage !

		this.triggerMethod('selected:modal', model.toJSON());
		this.triggerMethod('close:modal');
	}

});
