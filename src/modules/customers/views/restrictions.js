var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

var Groups = require('kiubi/modules/customers/models/groups');
var Customers = require('kiubi/modules/customers/models/customers');
var SaveBehavior = require('kiubi/behaviors/save_detection.js');

function formatCustomer(data, index) {
	return '<li data-role="selection" data-index="' + index + '"><a class="dropdown-item" href="#">' + data.firstname +
		' ' + data.lastname +
		'</a></li>';
}

function formatGroup(data, index) {
	return '<li data-role="selection" data-index="' + index + '"><a class="dropdown-item" href="#">' + data.name +
		'</a></li>';
}

var TagView = Marionette.View.extend({
	template: _.template(
		'<span class="badge-content" title="<%- name %>"><%- name %></span><span data-role="delete" class="md-icon md-close"></span>'
	),

	className: 'badge badge-warning badge-list',
	tagName: 'span',

	ui: {
		'deleteBtn': 'span[data-role="delete"]'
	},

	events: {
		'click @ui.deleteBtn': function() {
			this.model.destroy();
		}
	}

});

var TagsView = Marionette.CollectionView.extend({
	className: '',
	// emptyView: EmptyView,
	childView: TagView
});

module.exports = Marionette.View.extend({
	template: require('../templates/restrictions.html'),
	className: 'row',

	behaviors: [SaveBehavior],

	regions: {
		'customers': {
			el: 'span[data-role="customers"]',
			replaceElement: true
		},
		'groups': {
			el: 'span[data-role="groups"]',
			replaceElement: true
		}
	},

	ui: {
		'dropGrp': '.dropdown[data-role="group"]',
		'dropCust': '.dropdown[data-role="customer"]',

		'selGrp': '.dropdown[data-role="group"] li[data-role="selection"]',
		'selCust': '.dropdown[data-role="customer"] li[data-role="selection"]'
	},

	events: {
		'keyup @ui.dropGrp input': _.debounce(function(event) {
			this.triggerInput(Backbone.$(event.currentTarget), 'grp');
		}, 300),

		'mousedown @ui.dropGrp input': _.debounce(function(event) {
			this.triggerInput(Backbone.$(event.currentTarget), 'grp');
		}, 300),

		'keyup @ui.dropCust input': _.debounce(function(event) {
			this.triggerInput(Backbone.$(event.currentTarget), 'cust');
		}, 300),

		'mousedown @ui.dropCust input': _.debounce(function(event) {
			this.triggerInput(Backbone.$(event.currentTarget), 'cust');
		}, 300),

		'click @ui.selGrp': function(event) {
			var index = parseInt(Backbone.$(event.currentTarget).data('index'));
			if (isNaN(index)) return;
			this.triggerMethod('select:grp', index);
		},

		'click @ui.selCust': function(event) {
			var index = parseInt(Backbone.$(event.currentTarget).data('index'));
			if (isNaN(index)) return;
			this.triggerMethod('select:cust', index);
		}
	},

	term: null,

	initialize: function(options) {
		this.mergeOptions(options, []);

		this.term = {
			'cust': null,
			'grp': null
		};

		var tag = Backbone.Model.extend({
			defaults: {
				name: '',
				id: null
			},
			isNew: function() {
				return true;
			}
		});

		this.customers = new Customers();
		this.groups = new Groups();

		this.selected_groups = new Backbone.Collection();
		this.selected_customers = new Backbone.Collection();
		this.selected_groups.model = this.selected_customers.model = tag;

		this.suggestions_groups = [];
		this.suggestions_customers = [];

		var customers = _.filter(this.getOption('restrictions'), function(restriction) {
			return restriction.customer_id;
		});
		customers = _.map(customers, function(customer) {
			return {
				id: customer.customer_id,
				name: customer.customer_firstname + ' ' + customer.customer_lastname
			};
		});
		this.selected_customers.add(customers);

		var groups = _.filter(this.getOption('restrictions'), function(restriction) {
			return restriction.group_id;
		});
		groups = _.map(groups, function(group) {
			return {
				id: group.group_id,
				name: group.group_name
			};
		});
		this.selected_groups.add(groups);

		this.listenTo(this.selected_customers, 'update', function() {
			this.triggerMethod('field:change');
		}.bind(this));
		this.listenTo(this.selected_groups, 'update', function() {
			this.triggerMethod('field:change');
		}.bind(this));
	},

	onRender: function() {

		this.showChildView('customers', new TagsView({
			collection: this.selected_customers
		}));

		this.showChildView('groups', new TagsView({
			collection: this.selected_groups
		}));
	},

	triggerInput: function(target, type) {
		if (target.val() === this.term[type]) return;

		this.term[type] = target.val();
		this.triggerMethod('input:' + type, this.term[type], this);
	},

	onInputGrp: function(term) {
		this.groups.suggest(term, 5, this.selected_groups.pluck('id')).done(function(groups) {
			this.suggestions_groups = groups;
			this.showResults(groups, this.getUI('dropGrp'));
		}.bind(this)); // TODO fail
	},

	onSelectGrp: function(index) {
		if (index > this.suggestions_groups.length) return;

		var selected = this.suggestions_groups[index];
		if (!selected) return;

		this.selected_groups.add({
			name: selected.name,
			id: selected.group_id
		});
	},

	onInputCust: function(term) {
		this.customers.suggest(term, 5, this.selected_customers.pluck('id')).done(function(customers) {
			this.suggestions_customers = customers;
			this.showResults(customers, this.getUI('dropCust'));
		}.bind(this)); // TODO fail
	},

	onSelectCust: function(index) {
		if (index > this.suggestions_customers.length) return;

		var selected = this.suggestions_customers[index];
		if (!selected) return;

		this.selected_customers.add({
			name: selected.firstname + ' ' + selected.lastname,
			id: selected.customer_id
		});
	},

	showResults: function(results, $dd) {
		var list = '';
		if (results.length > 0) {
			list = _.reduce(results, function(acc, result, index) {
				return acc + (result.customer_id ? formatCustomer(result, index) : formatGroup(result, index));
			}, '');
		} else {
			list =
				'<li><span class="dropdown-item dropdown-item-empty"><span class="md-icon md-no-result"></span> Aucun résultat</span></li>';
		}
		$dd.children('ul').html(list);
		$dd.addClass('show'); // Force opening
	},

	getRestrictions: function() {
		return {
			groups: this.selected_groups.pluck("id"),
			customers: this.selected_customers.pluck("id")
		};
	}

});
