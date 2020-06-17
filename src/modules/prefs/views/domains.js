var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

var Session = Backbone.Radio.channel('app').request('ctx:session');

var RowActionsBehavior = require('kiubi/behaviors/ui/row_actions.js');
var Forms = require('kiubi/utils/forms.js');

var NewRowView = Marionette.View.extend({
	template: require('../templates/domains.new.html'),
	className: 'post-content post-list',

	behaviors: [RowActionsBehavior],

	ui: {
		'form': 'form[data-role="new"]',
		'errors': 'div[data-role="errors"]',
		'name': 'input[name="name"]',
		'sub': 'span[data-role="sub"]'
	},

	events: {
		'keyup @ui.name': function(event) {
			var name = this.getUI('name').val();
			this.getUI('sub').text(name.indexOf('www.') == 0 ? name.substr(4) : 'www.' + name);
		}
	},

	onActionSave: function() {
		var data = Forms.extractFields(['name', 'sub'], this);

		var promise;
		if (data.sub == '1') {
			var m1 = new this.collection.model();
			var m2 = new this.collection.model();

			var sub = data.name.indexOf("www.") == 0 ? data.name.substr(4) : 'www.' + data.name;

			promise = Backbone.$.when(
				m1.save({
					name: data.name,
					is_main: false
				}, {
					patch: true,
					wait: true
				}),
				m2.save({
					name: sub,
					is_main: false
				}, {
					patch: true,
					wait: true
				})
			).done(function() {
				this.getUI('form').hide();
				this.collection.add([m1, m2]);
			}.bind(this));
		} else {
			var m = new this.collection.model();
			promise = m.save({
				name: data.name,
				is_main: false
			}, {
				patch: true,
				wait: true
			}).done(function() {
				this.getUI('form').hide();
				this.collection.add(m);
			}.bind(this));
		}

		return promise.fail(function(error) {
			Forms.displayErrors(error, this.getUI('errors'), this.el, {
				showErrors: true
			});
		}.bind(this));
	}

});

var RowView = Marionette.View.extend({
	template: require('../templates/domains.row.html'),
	className: 'list-item',

	behaviors: [RowActionsBehavior],

	ui: {
		'list': 'div[data-role="list"]'
	},

	templateContext: function() {
		var actions = [];

		if (!this.model.get('is_main')) {
			actions.push({
				label: 'Rendre principal',
				action: 'main',
				confirm: ''
			});
		}
		if (!this.model.get('is_main') && !this.model.get('is_provided')) {
			actions.push({
				label: 'Supprimer',
				action: 'delete',
				confirm: 'warning'
			});
		}

		return {
			actions: actions,
			is_https_enabled: this.model.collection.meta && this.model.collection.meta.is_https_enabled
		};
	},

	onActionDelete: function() {
		if (this.model.get('is_main')) {
			var collection = this.model.collection;
			return this.model.destroy().done(function() {
				collection.fetch();
			});
		} else {
			return this.model.destroy();
		}
	},

	onActionMain: function() {
		return this.model.save({
				is_main: true
			}, {
				patch: true,
				wait: true
			}).done(function() {
				// Remove main status for the previous main
				_.each(this.model.collection.where({
					is_main: true
				}), function(model) {
					if (this.model != model) {
						model.set('is_main', false);
						model.trigger('sync'); // trigger sync to trigger rowView render
					}
				}.bind(this));
				// Main domain has changed, refetch site to get the definitive main domain with scheme
				Session.site.fetch();
			}.bind(this))
			.fail(function(error) {
				var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
				navigationController.showErrorModal(error);
			}.bind(this));
	}

});

var ListView = require('kiubi/core/views/ui/list.js');

module.exports = Marionette.View.extend({
	template: require('../templates/domains.html'),
	className: 'container',
	service: 'prefs',

	regions: {
		list: {
			el: "article[data-role='list']",
			replaceElement: true
		}
	},

	ui: {
		'ip': '[data-role="ip"]'
	},

	initialize: function(options) {
		this.mergeOptions(options, ['collection']);
	},

	start: function() {
		this.collection.fetch().done(function(data, meta) {
			if (meta.domain_IP) {
				this.getUI('ip').text(meta.domain_IP);
			}
		}.bind(this));
	},

	onRender: function() {
		this.showChildView('list', new ListView({
			collection: this.collection,
			rowView: RowView,
			newRowView: NewRowView,

			title: 'Liste des noms de domaine'
		}));
	},

	templateContext: function() {
		return {
			domain: Session.site.get('domain')
		};
	}

});
