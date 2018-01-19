var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

var Groups = require('kiubi/modules/customers/models/groups');
var Customers = require('kiubi/modules/customers/models/customers');

function formatCustomer(data, index) {
	return '<li data-role="selection" data-index="' + index + '"><a href="#">' + data.firstname + ' ' + data.lastname +
		'</a></li>';
}

function formatGroup(data, index) {
	return '<li data-role="selection" data-index="' + index + '"><a href="#">' + data.name + '</a></li>';
}

var TagView = Marionette.View.extend({
	template: _.template('<%- name %><span data-role="delete" class="md-icon md-close"></span>'),

	className: 'label label-extranet label-list',
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
			this.term = Backbone.$(event.currentTarget).val();
			this.triggerMethod('input:grp', this.term);
		}, 300),

		'keyup @ui.dropCust input': _.debounce(function(event) {
			this.term = Backbone.$(event.currentTarget).val();
			this.triggerMethod('input:cust', this.term);
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

	onInputGrp: function(term) {
		this.groups.fetch({
			data: {
				term: term,
				limit: 5
			}
		}).done(function() {
			this.showResults(this.groups.toJSON(), this.getUI('dropGrp'));
		}.bind(this)); // TODO fail
	},

	onInputCust: function(term) {
		this.customers.fetch({
			data: {
				term: term,
				limit: 5
			}
		}).done(function() {
			this.showResults(this.customers.toJSON(), this.getUI('dropCust'));
		}.bind(this)); // TODO fail
	},

	onSelectGrp: function(index) {
		if (index > this.groups.length) return;

		var selected = this.groups.at(index);
		if (!selected) return;

		this.selected_groups.add({
			name: selected.get('name'),
			id: selected.get('group_id')
		});
	},

	onSelectCust: function(index) {
		if (index > this.customers.length) return;

		var selected = this.customers.at(index);
		if (!selected) return;

		this.selected_customers.add({
			name: selected.get('firstname') + ' ' + selected.get('lastname'),
			id: selected.get('customer_id')
		});
	},

	showResults: function(results, $dd) {
		var list = '';
		if (results.length > 0) {
			list = _.reduce(results, function(acc, result, index) {
				return acc + (result.customer_id ? formatCustomer(result, index) : formatGroup(result, index));
			}, '');
		} else {
			list = '<li><a href="#">-- Aucun résultat --</a></li>';
		}
		$dd.children('ul').html(list);
		$dd.addClass('open'); // Force opening
	},

	initialize: function(options) {
		this.mergeOptions(options, []);

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
	},

	onRender: function() {

		this.showChildView('customers', new TagsView({
			collection: this.selected_customers
		}));

		this.showChildView('groups', new TagsView({
			collection: this.selected_groups
		}));
	},

	getRestrictions: function() {
		return {
			groups: this.selected_groups.pluck("id"),
			customers: this.selected_customers.pluck("id")
		};
	}

});
