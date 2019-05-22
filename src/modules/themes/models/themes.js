var Backbone = require('backbone');
var _ = require('underscore');

var Theme = Backbone.Model.extend({

	url: 'sites/@site/themes',

	idAttribute: 'code',

	parse: function(response) {
		if ('data' in response) {
			if (response.data === null) return {};
			return response.data;
		}
		return response;
	},

	defaults: {
		"code": null,
		"author_name": "",
		"author_email": "",
		"author_url": "",
		"is_current": false,
		"name": "",
		"style": "",
		"version": "",
		"date": null,
		"status": "",
		"variants": [
			/*
			 colors: {
			 	color1: "string", 
			 	color2: "string", 
			 	color3: "string", 
			 	color4: "string"
			 }
			 css: "string"
			 id: "string"
			*/
		]
	}

});

module.exports = Backbone.Collection.extend({
	url: 'sites/@site/themes',
	model: Theme,
	parse: function(response) {
		this.meta = response.meta;
		return response.data;
	},

	/**
	 * Create a custom theme
	 *
	 * @param {Object} data
	 * @returns {Promise} Theme
	 */
	createTheme: function(data) {
		return Backbone.ajax({
			url: this.url,
			method: 'POST',
			data: {
				name: data.name,
				code: data.code,
				reuse_layouts: data.reuse_layouts
			}
		}).then(function(response) {
			this.trigger('create');
			return new this.model(response.data);
		}.bind(this));
	},

	/**
	 * Change current theme
	 *
	 * @param {String} theme
	 * @returns {Promise} Theme
	 */
	changeTheme: function(theme) {
		return Backbone.ajax({
			url: this.url + '/current',
			method: 'PUT',
			data: {
				code: theme
			}
		}).then(function(response) {
			return new this.model(response.data);
		}.bind(this));
	},

	/**
	 * Get current theme
	 *
	 * @returns {Promise} Theme
	 */
	getCurrent: function() {
		return Backbone.ajax({
			url: this.url + '/current',
			method: 'GET'
		}).then(function(response) {
			return new this.model(response.data);
		}.bind(this));
	},

	/**
	 * Change  theme variants
	 *
	 * @param {String} variant
	 * @returns {Promise} Theme
	 */
	changeThemeVariants: function(variant) {
		return Backbone.ajax({
			url: this.url + '/current',
			method: 'PUT',
			data: {
				variant: variant
			}
		}).then(function(response) {
			//return new this.model(response.data);
		}.bind(this));
	}

});
