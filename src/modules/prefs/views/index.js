var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var FilePickerView = require('kiubi/modules/media/views/file.picker.js');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var Forms = require('kiubi/utils/forms.js');

var Session = Backbone.Radio.channel('app').request('ctx:session');

module.exports = Marionette.View.extend({
	template: require('../templates/index.html'),
	className: 'container',
	service: 'prefs',

	regions: {
		logo: {
			el: "div[data-role='logo']",
			replaceElement: true
		}
	},

	behaviors: [FormBehavior],

	site_fields: [
		'site_title',
		'is_site_open',
		'is_contact_enabled',
		'is_blog_enabled',
		'is_catalog_enabled',
		'is_checkout_enabled',
		'is_api_enabled',
		'front_login',
		'front_password',
		'breadcrumb'
	],

	theme_fields: [
		'site_excerpt',
		'is_excerpt_visible',
		'site_description',
		'is_description_visible',
		'logo_media_id',
		'is_logo_visible'
	],

	initialize: function(options) {
		this.mergeOptions(options, ['site', 'theme']);

		this.listenTo(this.site, 'sync', function(model) {
			// Update current session
			Session.site.set('name', model.get('site_title'));
		}.bind(this));
	},

	onRender: function() {
		this.showChildView('logo', new FilePickerView({
			fieldname: 'logo_media_id',
			fieldLabel: 'Logo du site Internet',
			comment: 'Le logo peut être utilisé dans tous les templates du site Internet, dans les emails, le bloc-marque et le détail des commandes.',
			type: 'image',
			value: this.theme.get('logo_media_id')
		}));
	},

	templateContext: function() {
		return {
			domain: Session.site.get('domain'),
			site: this.site.toJSON(),
			theme: this.theme.toJSON()
		};
	},

	onSave: function() {
		return Backbone.$.when(
			this.site.save(
				Forms.extractFields(this.site_fields, this), {
					patch: true
				}
			),
			this.theme.save(
				Forms.extractFields(this.theme_fields, this), {
					patch: true
				}
			)
		);
	}

});
