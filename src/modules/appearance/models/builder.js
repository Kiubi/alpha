var Backbone = require('backbone');
var _ = require('underscore');

module.exports = Backbone.Model.extend({
	urlRoot: 'sites/@site/appearance/builder',
	idAttribute: 'draft_id',

	parse: function(response) {
		if ('data' in response) {
			if (response.data === null) return {};
			if (_.isNumber(response.data)) {
				return {
					draft_id: response.data
				};
			}
			return response.data;
		}
		return response;
	},

	defaults: {
		draft_id: null,
		layout_id: 0,
		type: null,
		name: '',
		model: null,
		tree: null
	},


	/**
	 * Describe a zone
	 *
	 * @param {String} zone_id
	 * @returns {Object|null}
	 */
	describeZone: function(zone_id) {
		return _.find(this.get('model').zones, function(zone) {
			return zone.id == zone_id;
		});
	},

	/**
	 * Return all widgets
	 *
	 * @param {String} page
	 *
	 * @returns {Promise}
	 */
	getWidgets: function(page) {
		// TODO : cache
		return Backbone.ajax({
			url: 'sites/@site/appearance/widgets.json?page=' + page
		}).then(function(response) {
			return response.data;
		});
	},

	/**
	 * Return all page types
	 *
	 * @returns {Promise}
	 */
	getModels: function() {
		return Backbone.ajax({
			url: 'sites/@site/appearance/models.json'
		}).then(function(response) {
			return _.map(response.data, function(model) {
				return {
					id: model.id,
					name: model.name,
					structure: model.structure
				};
			});
		});
	},

	/**
	 * Add a bloc
	 *
	 * @param {String} zone
	 * @param {String} type
	 *
	 * @returns {Promise}
	 */
	addBloc: function(zone, type) {
		return Backbone.ajax({
			url: 'sites/@site/appearance/builder/' + this.get('draft_id') + '/blocs.json',
			method: 'POST',
			data: {
				nb_col: type,
				zone: zone
			}
		}).then(function(response) {
			// TODO : update tree ? get all tree back ?
			// Bloc returned
			return response.data;
		});
	},

	/**
	 * Remove a bloc
	 *
	 * @param {Number} bloc_id
	 *
	 * @returns {Promise}
	 */
	removeBloc: function(bloc_id) {
		return Backbone.ajax({
			url: 'sites/@site/appearance/builder/' + this.get('draft_id') + '/blocs/' + bloc_id + '.json',
			method: 'DELETE'
		}).then(function(response) {
			// TODO : update tree ? get all tree back ?
			return null;
		});
	},

	/**
	 * Remove a widget
	 *
	 * @param {Number} widget_id
	 *
	 * @returns {Promise}
	 */
	removeWidget: function(widget_id) {
		return Backbone.ajax({
			url: 'sites/@site/appearance/builder/' + this.get('draft_id') + '/widgets/' + widget_id + '.json',
			method: 'DELETE'
		}).then(function(response) {
			// TODO : update tree ? get all tree back ?
			return null;
		});
	},

	/**
	 * Add a widget
	 *
	 * @param {String} widget
	 * @param {Number} cell_id
	 * @param {Object} position
	 *
	 * @returns {Promise}
	 */
	addWidget: function(widget, cell_id, position) {
		return Backbone.ajax({
			url: 'sites/@site/appearance/builder/' + this.get('draft_id') + '/widgets.json',
			method: 'POST',
			data: {
				widget: widget,
				cell_id: cell_id,
				position: position.position,
				sibling_id: position.sibling_id
			}
		}).then(function(response) {
			// Widget returned
			return response.data;
		});
	},

	/**
	 * Move a widget
	 *
	 * @param {Number} widget_id
	 * @param {Number} cell_id
	 * @param {Object} position
	 *
	 * @returns {Promise}
	 */
	moveWidget: function(widget_id, cell_id, position) {
		return Backbone.ajax({
			url: 'sites/@site/appearance/builder/' + this.get('draft_id') + '/widgets/' + widget_id + '.json',
			method: 'PUT',
			data: {
				cell_id: cell_id,
				position: position.position,
				sibling_id: position.sibling_id
			}
		}).then(function(response) {
			// Widget returned
			return response.data;
		});
	},

	/**
	 * Get a widget
	 *
	 * @param {Number} widget_id
	 *
	 * @returns {Promise}
	 */
	getWidget: function(widget_id) {
		return Backbone.ajax({
			url: 'sites/@site/appearance/builder/' + this.get('draft_id') + '/widgets/' + widget_id + '.json'
		}).then(function(response) {
			// Widget returned
			return response.data;
		});
	},

	/**
	 * Configure a widget
	 *
	 * @param {Number} widget_id
	 * @param {Object} settings
	 * @param {Object} values
	 *
	 * @returns {Promise}
	 */
	setWidgetSettings: function(widget_id, settings, values) {

		var data = {};

		_.each(values, function(value, key) {

			if (!settings[key] || !settings[key].type) return;

			switch (settings[key].type) {

				case 1: // string
				default:
					value = '' + value;
					break;

				case 2: // boolean
					value = (value == '1');
					break;

				case 3: //integer
					value = value === '' ? null : parseInt(value);
					break;

				case 4: //array
					if (!_.isArray(value)) value = [value];
					break;
			}

			data[key] = value;
		});

		return Backbone.ajax({
			url: 'sites/@site/appearance/builder/' + this.get('draft_id') + '/widgets/' + widget_id + '.json',
			method: 'PUT',
			data: {
				settings: data
			}
		}).then(function(response) {
			// Widget returned
			return response.data;
		});
	}

});
