var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var Activities = require('../core/models/activities');

var NotificationModel = Backbone.Model.extend({

	defaults: {
		type: null,
		type_id: null,
		label: '',
		delay: 5000
	},

	getTitle: function() {
		switch (this.get('type')) {
			case 1:
				return 'Nouvelle commande à traiter';
			case 2:
				return 'Nouveau commentaire dans le blog';
			case 3:
				return 'Nouvelle évaluation de produit';
			case 4:
				return 'Nouvelle réponse à un formulaire';
			default:
				return 'Notification';
		}
	},

	getURL: function() {
		switch (this.get('type')) {
			case 1:
				return '/checkout/orders/' + this.get('type_id');
			case 2:
				return '/blog/posts/' + this.get('type_id') + '/comments';
			case 3:
				return '/catalog/products/' + this.get('type_id') + '/comments';
			case 4:
				return '/forms/inbox?id=' + this.get('type_id');
			default:
				return null;
		}
	},

	getCode: function() {
		switch (this.get('type')) {
			case 1:
				return 'order';
			case 2:
				return 'comment';
			case 3:
				return 'evaluation';
			case 4:
				return 'response';
			default:
				return null;
		}
	}

});

var NotificationCollection = Backbone.Collection.extend({
	model: NotificationModel
});

function retryDelay(try_number) {
	return Math.min(try_number * 1000, 30000); // 1 second step until 30 seconds
}

module.exports = Marionette.Object.extend({

	connection: null,
	collection: null,
	webSocket: null,
	current: null,
	retryCount: null,

	initialize: function(webSocketUrl) {
		this.webSocket = webSocketUrl;
		this.collection = new NotificationCollection(); // stack of displayed notifications
		this.connect();
		this.current = null;
		this.retryCount = 0;
	},

	register: function(token, code_site) {
		// change site for notification
		this.current = {
			code_site: code_site,
			token: token,
		};
		this.send({
			action: 'join',
			site: code_site,
			token: token
		});
	},

	switch: function(code_site) {
		// TODO what if never acked ?
		this.current.code_site = code_site;
		this.notification.send({
			action: 'switch',
			site: code_site
		});
	},

	/* private */
	connect: function() {
		if (!this.webSocket) return;

		this.connection = new WebSocket(this.webSocket);
		var promise = Backbone.$.Deferred();

		this.connection.onopen = function(e) {
			this.retryCount = 0;
			console.log("NotificationCenter : connection established !");
			promise.resolve();
		}.bind(this);
		this.connection.onerror = function(e) {
			promise.reject();
		}.bind(this);
		this.connection.onclose = function(e) {
			this.retryCount++;
			console.log("NotificationCenter : connection closed !");
			if (promise.state() === 'pending') promise.reject();
			setTimeout(function() {
				console.log('NotificationCenter: try reconnecting...');
				this.connect().then(function() {
					this.register(this.current.token, this.current.code_site)
				}.bind(this));
			}.bind(this), retryDelay(this.retryCount));
		}.bind(this);
		this.connection.onmessage = function(e) {
			var payload = JSON.parse(e.data);
			if (payload.action) {
				var action = payload.action + ':message';
				this.triggerMethod(action, payload);
			} else {
				this.triggerMethod('message', payload);
			}
		}.bind(this);

		return promise;
	},

	close: function() {
		if (this.connection) this.connection.close();
	},

	/* private */
	send: function(payload) {
		if (!this.connection) {
			this.connect().done(function() {
				if (this.connection.readyState == 1) this.connection.send(JSON.stringify(payload));
			}.bind(this));
		} else if (this.connection.readyState == 1) { // status "OPEN"
			this.connection.send(JSON.stringify(payload));
		}
	},

	onPushMessage: function(payload) {

		if (!payload.type) return;

		// TODO check payload.site

		// Ratelimit
		if (this.collection.length > 10) {
			console.log('NotificationCenter : overflow');
			return;
		}

		var model = this.collection.add({
			type: payload.type,
			label: payload.label,
			type_id: payload.id,
		}, {
			at: 0
		});

		if (model.getCode()) {
			this.trigger('notification:' + model.getCode());
			this.trigger('update:unread', 1);
		}

		setTimeout(function() {
			this.collection.remove(model);
		}.bind(this), model.get('delay') + 1000); // remove 1 second after hiding
	},

	markAsRead: function() {
		var Session = Backbone.Radio.channel('app').request('ctx:session');
		Session.storePref('lastReadDate', Math.floor(Date.now() / 1000)); // timestamp in seconds
		this.trigger('update:unread', 0);
	},

	refreshCount: function() {

		var Session = Backbone.Radio.channel('app').request('ctx:session');

		var lastRead = Session.getPref('lastReadDate');
		if (lastRead === null) {
			Session.storePref('lastReadDate', Math.floor(Date.now() / 1000)); // timestamp in seconds
			this.trigger('update:unread', 0);
			return;
		}

		var collection = new Activities();
		collection.countActivitiesSince(lastRead).done(function(count) {
			this.trigger('update:unread', count);
		}.bind(this));
	}

});
