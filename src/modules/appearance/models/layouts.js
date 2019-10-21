var CollectionUtils = require('kiubi/utils/collections.js');
var Backbone = require('backbone');

module.exports = CollectionUtils.KiubiCollection.extend({

	url: 'sites/@site/appearance/layouts',

	model: require('./layout')

});
