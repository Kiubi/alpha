var Marionette = require('backbone.marionette');

var $ = require('jquery');

var Cache = (function() {
	var memory = {};
	return {
		clear: function() {
			memory = {};
		},
		set: function(key, value) {
			memory[key] = value;
		},
		get: function(key) {
			if (typeof(memory[key]) != 'undefined') {
				return memory[key];
			}
			return false;
		}
	};
})();

var Translate = Marionette.Object.extend({
	initialize: function(options) {
		this.mergeOptions(options, ['lang']);

		switch (this.lang) {
			case 'fr':
				var moment = require('moment');
				moment.defineLocale(this.lang, require('kiubi/locales/fr/moment.js'));
				moment.locale(this.lang);
				break;
			default:
				break;
		}
	},
	/**
	 * Load locales
	 * @param {String} lg language
	 */
	load: function(lg) {
		var locales = Cache.get('locales_' + lg);
		if (locales === false) {
			try {
				locales = require('locales_' + lg + '/messages');
			} catch (e) {
				locales = {};
			}
			Cache.set('locales_' + lg, locales);
		}
		return locales;
	},
	translate: function(key, comment) {

		var locales = this.load(this.lang);
		if (locales[key]) {
			return locales[key][1];
		}
		/*
		// Fallback en anglais
		else if(lang != "en") {
			locales = this.load("en");
			if(locales[key]) return locales[key][1];
		} //*/

		return key;
	},
	format_price: function(amount, currency) {
		if (!$.isNumeric(amount)) return amount;
		if (currency == "EUR") {
			return amount.toFixed(2) + "€";
		}
		return amount.toFixed(2) + " " + currency;
	},
});

var sharedInstance = new Translate({
	"lang": ($('html').attr('lang') || "en")
});

module.exports = sharedInstance;
// Exposition de quelques helpers utiles
module.exports.translate = Translate.prototype.translate.bind(sharedInstance);
module.exports.format_price = Translate.prototype.format_price.bind(
	sharedInstance);
// permet d'ecrire var __ = require('path/to/translate').translate;
module.exports.Translate = Translate; // test unitaire ? :)

// pour changer la langue au vol de la sharedInstance
// require('path/to/translate').initialize({lang:"es"});
