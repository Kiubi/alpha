// Configuration
var Config = require('kiubi/core/models/config');

var Cfg = new Config();

Cfg.set('api', 'https://api.srv1.kiubi-devadmin.com');
Cfg.set('account', 'https://www.srv1.kiubi-devadmin.com');

//Cfg.set('api', 'https://api.kiubi-maqadmin.com');
//Cfg.set('account', 'https://www.kiubi-maqadmin.com');

//Cfg.set('api', 'https://api.srv9.kiubi-devadmin.com');
//Cfg.set('account', 'https://www.srv9.kiubi-devadmin.com');

module.exports = Cfg;
