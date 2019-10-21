var CollectionUtils = require('kiubi/utils/collections.js');
var Backbone = require('backbone');
var _ = require('underscore');

var Theme = CollectionUtils.KiubiModel.extend({

	url: 'sites/@site/themes',

	idAttribute: 'code',

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

module.exports = CollectionUtils.KiubiCollection.extend({
	url: 'sites/@site/themes',
	model: Theme,

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
		}).then(function(data) {
			this.trigger('create');
			return new this.model(data);
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
		}).then(function(data) {
			return new this.model(data);
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
		}).then(function(data) {
			return new this.model(data);
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
		}).then(function(data) {
			//return new this.model(data);
		}.bind(this));
	}

});
