var Backbone = require('backbone');
var _ = require('underscore');
var CollectionUtils = require('kiubi/utils/collections.js');

module.exports = CollectionUtils.KiubiModel.extend({
	urlRoot: 'sites/@site/cms/pages',
	idAttribute: 'page_id',

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
		restrictions: [],
		service_path: ''
	},

	/**
	 * Return all iternal links target types
	 * 
	 * @returns {Promise} will return a SelectCollection
	 */
	getInternalLinkTypes: function(selected) {
		return Backbone.ajax({
			url: 'sites/@site/cms/internal_links/targets'
		}).then(function(data) {

			var c = new CollectionUtils.SelectCollection();
			c.add(_.map(data, function(type) {
				return {
					'value': type.type,
					'label': type.name,
					'selected': selected && selected == type.type
				};
			}));

			return c;
		});
	},

	/**
	 * * Return all iternal links targets from a type
	 * 
	 * @param {String} type
	 * @returns {Promise} will return a SelectCollection
	 */
	getInternalLinkTargets: function(type) {
		return Backbone.ajax({
			url: 'sites/@site/cms/internal_links/targets/' + type
		}).then(function(data) {
			return data;
		});
	},

	/**
	 * Duplicate current page
	 *
	 * @return {Promise} Will return new page_id
	 */
	duplicate: function() {

		return Backbone.ajax({
			url: 'sites/@site/cms/pages',
			method: 'POST',
			data: {
				page_id: this.get('page_id')
				// name : '...'
			}
		}).then(function(data, meta) {
			return data;
		});
	}

});
