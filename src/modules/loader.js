module.exports = function() {

	var CMSRoute = require('./cms/router');
	new CMSRoute();

	var BlogRoute = require('./blog/router');
	new BlogRoute();

	var CatalogRoute = require('./catalog/router');
	new CatalogRoute();

	var CheckoutRoute = require('./checkout/router');
	new CheckoutRoute();

	var AppearanceRoute = require('./appearance/router');
	new AppearanceRoute();

	var MediaRoute = require('./media/router');
	new MediaRoute();

	var CustomersRoute = require('./customers/router');
	new CustomersRoute();

	var FormsRoute = require('./forms/router');
	new FormsRoute();

	var ModulesRoute = require('./modules/router');
	new ModulesRoute();

	var PrefsRoute = require('./prefs/router');
	new PrefsRoute();

	var ThemesRoute = require('./themes/router');
	new ThemesRoute();

	var GA = require('./ga/init');
	new GA();

};
