var CollectionUtils = require('kiubi/utils/collections.js');
var _ = require('underscore');

var Domain = CollectionUtils.KiubiModel.extend({
	urlRoot: 'sites/@site/domains',
	idAttribute: 'domain_id',

	defaults: {
		domain_id: null,
		is_main: false,
		is_provided: false,
		is_https_certified: false,
		name: '',
		https_status: null
	}
});

module.exports = CollectionUtils.KiubiCollection.extend({

	url: 'sites/@site/domains',

	model: Domain

});
