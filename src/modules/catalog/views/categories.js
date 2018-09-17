var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _string = require('underscore.string');

var RowActionsBehavior = require('kiubi/behaviors/ui/row_actions.js');

var Session = Backbone.Radio.channel('app').request('ctx:session');

var HomeRowView = Marionette.View.extend({
	template: require('../templates/categories.row.home.html'),
	className: 'list-item'
});

var RowView = Marionette.View.extend({
	template: require('../templates/categories.row.html'),
	className: 'list-item',
	templateContext: function() {
		return {
			plural: function(nb, singular, plural) {
				return (nb > 1 ? plural : singular).replace('%d', nb);
			},
			preview: Session.site.get('domain') + '/catalogue/' + this.model.get('slug') + '/', // TODO fix custom breadcrum
			convertMediaPath: Session.convertMediaPath.bind(Session),
			short_desc: _string.prune(_string.stripTags(this.model.get('description')), 120)
		};
	},

	behaviors: [RowActionsBehavior],

	onActionDelete: function() {
		return this.model.destroy();
	},

	onSortChange: function(data) {
		this.model.save(
			data, {
				patch: true
			}
		);
	}

});

var ListView = require('kiubi/views/ui/list.js');

module.exports = Marionette.View.extend({
	template: require('../templates/categories.html'),
	className: 'container-fluid',
	service: 'catalog',

	regions: {
		list: {
			el: "article[data-role='list']",
			replaceElement: true
		}
	},

	initialize: function(options) {
		this.mergeOptions(options, ['collection']);
	},

	onRender: function() {
		this.showChildView('list', new ListView({
			collection: this.collection,
			rowView: function(model) {
				return model.get('is_main') ? HomeRowView : RowView;
			},

			title: 'Liste des catégories',
			selection: [{
				title: 'Afficher',
				callback: this.showCategories.bind(this)
			}, {
				title: 'Masquer',
				callback: this.hideCategories.bind(this)
			}, {
				title: 'Supprimer',
				callback: this.deleteCategories.bind(this),
				confirm: true
			}]
		}));
	},

	start: function() {
		this.collection.fetch();
	},

	onSave: function() {
		return this.model.save(
			Forms.extractFields(this.fields, this), {
				patch: true,
				wait: true
			}
		);
	},

	showCategories: function(ids) {
		return this.collection.bulkShow(ids);
	},

	hideCategories: function(ids) {
		return this.collection.bulkHide(ids);
	},

	deleteCategories: function(ids) {
		return this.collection.bulkDelete(ids);
	}

});
