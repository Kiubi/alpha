var Backbone = require('backbone');
var _ = require('underscore');

var Field = Backbone.Model.extend({

	urlRoot: function() {
		return 'sites/@site/forms/' + this.get('form_id') + '/fields';
	},

	idAttribute: 'field_id',

	parse: function(response) {
		if ('data' in response) {
			if (response.data === null) return {};
			if (_.isNumber(response.data)) {
				return {
					field_id: response.data
				};
			}

			return response.data;
		}
		return response;
	},

	defaults: {
		"field_id": null,
		"form_id": null,
		"name": "",
		"type": "",
		"use_for_exp": false,
		"is_in_subject": false,
		"is_enabled": false,
		"is_required": false,
		"values": [],
		"help": "",
		"position": 0,
		"creation_date": "",
		"modification_date": ""
	},

	getTypes: function() {
		return [{
				'type': "text",
				label: 'Texte'
			},
			{
				'type': "textarea",
				label: 'Texte multiligne'
			},
			{
				'type': "date",
				label: 'Date'
			},
			{
				'type': "datetime",
				label: 'Date et heure'
			},
			{
				'type': "numbers",
				label: 'Que des chiffres'
			},
			{
				'type': "letters",
				label: 'Que des lettres'
			},
			{
				'type': "email",
				label: 'Email'
			},
			{
				'type': "gender",
				label: 'Civilité'
			},
			{
				'type': "select",
				label: 'Liste déroulante'
			},
			{
				'type': "checkbox",
				label: 'Cases à cocher'
			},
			{
				'type': "radio",
				label: 'Boutons radio'
			},
			{
				'type': "fieldset",
				label: 'Groupe de champs (fieldset)'
			},
			{
				'type': "upload",
				label: 'Fichier à envoyer'
			},
			{
				'type': "department",
				label: 'Département'
			},
			{
				'type': "region",
				label: 'Région'
			},
			{
				'type': "country",
				label: 'Pays'
			}
		];
	}
});

module.exports = Backbone.Collection.extend({

	url: function() {
		return 'sites/@site/forms/' + this.form_id + '/fields';
	},

	form_id: null,

	model: Field,

	parse: function(response) {
		this.meta = response.meta;

		// Setup missing form_id for each field
		_.each(response.data, function(field) {
			field.form_id = this.form_id;
		}.bind(this));

		return response.data;
	},

	reOrder: function(list) {
		return Backbone.ajax({
			url: this.url(),
			method: 'PUT',
			data: {
				order: list
			}
		});
	}

});
