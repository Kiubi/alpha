var Backbone = require('backbone');
var _ = require('underscore');

module.exports = Backbone.Model.extend({
	urlRoot: 'sites/@site/cms/pages',
	idAttribute: 'page_id',

	previewLink: null,

	parse: function(response) {
		if ('data' in response) {
			if (response.data === null) return {};
			if (_.isNumber(response.data)) {
				return {
					page_id: response.data
				};
			}

			if (response.meta && response.meta.link && response.meta.link.preview) {
				this.previewLink = response.meta.link.preview;
			}

			return response.data;
		}
		return response;
	},

	defaults: {
		page_id: null,
		menu_id: null,
		page_type: '',
		page_parent_id: null,
		name: '',
		is_visible: false,
		is_home: false,
		slug: '',
		has_restrictions: false,
		meta_title: '',
		meta_description: '',
		meta_keywords: '',
		js_head: '',
		js_body: '',
		layout_id: null,
		target_type: '',
		target_page: '',
		target_key: '',
		url_target: '',
		restrictions: []
	},

	/**
	 * Return all iternal links target types, formatted like selectPayload
	 * 
	 * @returns {Promise}
	 */
	getInternalLinkTypes: function() {
		return Backbone.ajax({
			url: 'sites/@site/cms/internal_links/targets'
		}).then(function(response) {
			return _.map(response.data, function(type) {
				return {
					value: type.type,
					label: type.name
				};
			});
		});
	},

	/**
	 * * Return all iternal links targets from a type
	 * 
	 * @param {String} type
	 * @returns {Promise}
	 */
	getInternalLinkTargets: function(type) {
		return Backbone.ajax({
			url: 'sites/@site/cms/internal_links/targets/' + type
		}).then(function(response) {
			return response.data;
		});
	}

});
