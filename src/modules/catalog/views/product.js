var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');
require('kiubi/utils/proxy.jquery-ui.js');

var LayoutSelectorView = require('kiubi/modules/appearance/views/layout.selector.js');
var SelectView = require('kiubi/core/views/ui/select.js');
var FilePickerView = require('kiubi/modules/media/views/file.picker.js');
var FileSelectorView = require('kiubi/modules/media/views/file.selector.js');
var AutocompleteView = require('kiubi/core/views/ui/select.search.js');
var AutocompleteInputView = require('kiubi/core/views/ui/input.search.js');
var TagView = require('kiubi/core/views/ui/tag.search.js');
var ListView = require('kiubi/core/views/ui/list.js');
var SeoView = require('kiubi/core/views/ui/seo.js');
var ModalTagsView = require('./modal.tags.js');
var ModalCategoriesView = require('./modal.categories.js');

var CharCountBehavior = require('kiubi/behaviors/char_count.js');
var FormBehavior = require('kiubi/behaviors/simple_form.js');
var WysiwygBehavior = require('kiubi/behaviors/tinymce.js');
var SelectifyBehavior = require('kiubi/behaviors/selectify.js');
var RowActionsBehavior = require('kiubi/behaviors/ui/row_actions.js');
var VatBehavior = require('kiubi/behaviors/vat.js');

var format = require('kiubi/utils/format.js');
var Forms = require('kiubi/utils/forms.js');
var Datepicker = require('kiubi/behaviors/datepicker.js');

var VariantsNames = require('../models/variants_names');
var Downloads = require('../models/downloads');
var DownloadsFolders = require('../models/folders');

var Session = Backbone.Radio.channel('app').request('ctx:session');

// Variants

var VariantImageRowView = Marionette.View.extend({
	template: _.template('<input name="media_id" value="<%- media_id %>" autocomplete="off" type="radio">' +
		'<img alt="<%- name %>" src="<%- convertMediaPath(\'/media/miniature/\' + media_id + \'.jpg\') %>">'),

	className: 'btn btn-image', // + active
	tagName: 'label',

	initialize: function(options) {
		this.mergeOptions(options, ['variant']);
	},

	templateContext: function() {
		return {
			convertMediaPath: Session.convertMediaPath.bind(Session)
		};
	},

	onRender: function() {

		var checked;
		if (this.variant) {
			checked = this.model.get('media_id') == this.variant.get('media_id');
		} else {
			checked = (this.model.get('position') == 1);
		}

		if (checked) {
			this.$el.addClass('active');
		} else {
			this.$el.removeClass('active');
		}
		Backbone.$('input', this.$el).prop('checked', checked);
	}

});

var NewVariantRowView = Marionette.View.extend({
	template: require('../templates/product.variants.new.html'),
	className: 'post-content post-list',

	behaviors: [RowActionsBehavior, VatBehavior],

	regions: {
		taxes: {
			el: "div[data-role='taxes']",
			replaceElement: true
		},
		images: {
			el: "div[data-role='images']",
			replaceElement: true
		},
		name: {
			el: "div[data-role='name']",
			replaceElement: true
		},
		file: {
			el: "div[data-role='file']",
			replaceElement: true
		}
	},

	ui: {
		'form': 'form[data-role="new"]',
		'errors': 'div[data-role="errors"]',
		'stock_fields': 'div[data-role="stock"]',
		'is_stock_unlimited': 'select[name="is_stock_unlimited"]'
	},

	events: {
		'change @ui.is_stock_unlimited': function(event) {
			if (this.getUI('is_stock_unlimited').val() == '1') {
				this.getUI('stock_fields').hide();
			} else {
				this.getUI('stock_fields').show();
			}
		}
	},

	fields: [
		'name',
		'reference',
		'tax_id',
		'gtin',
		'condition',
		'weight',
		'price_ex_vat',
		'price_inc_vat',
		'price_discount_ex_vat',
		'price_discount_inc_vat',
		'price_ecotax',
		'is_stock_unlimited',
		'stock',
		'media_id',
		'file_id'
	],

	initialize: function(options) {
		this.taxes = options.taxes;
		this.images = options.images;
		this.names = options.names;
		this.currency = options.currency;
		this.is_virtual = options.is_virtual;
	},

	onRender: function() {
		var defaultTax = this.taxes.find({
			is_default: true
		});
		this.showChildView('taxes', new SelectView({
			collection: this.taxes,
			name: 'tax_id',
			selected: defaultTax ? defaultTax.get('tax_id') : null
		}));
		this.showChildView('images', new Marionette.CollectionView({
			className: 'btn-group d-block',
			attributes: {
				"data-toggle": "buttons"
			},
			collection: this.images,
			childView: VariantImageRowView
		}));
		this.showChildView('name', new AutocompleteInputView({
			searchPlaceholder: 'Rechercher un intitulé',
			name: 'name',
			noResultsLabel: null
		}));
		if (this.is_virtual) {
			this.showChildView('file', new FilePickerView({
				fieldname: 'file_id',
				fieldLabel: 'Fichier téléchargeable',
				type: 'file',
				collectionFiles: Downloads,
				collectionFolders: DownloadsFolders
				// value: this.model.get('file_id')
			}));
		}
	},

	onChildviewInput: function(term, view) {
		this.names.suggest(term, 5).done(function(names) {
			var results = _.map(names, function(variant) {
				return {
					label: variant.name,
					value: variant.name
				};
			});
			view.showResults(results);
		}.bind(this));
	},

	templateContext: function() {
		return {
			images: this.images.toJSON(),
			convertMediaPath: Session.convertMediaPath.bind(Session),
			currency: this.currency,
			is_virtual: this.is_virtual
		};
	},

	onActionCancel: function() {
		this.getUI('form').hide();
		Forms.clearErrors(this.getUI('errors'), this.el);
	},

	onActionSave: function() {
		Forms.clearErrors(this.getUI('errors'), this.el);

		var m = new this.collection.model();

		var data = Forms.extractFields(this.fields, this);
		data.product_id = this.collection.product_id;

		return m.save(data)
			.done(function() {
				this.getUI('form').hide();
				this.collection.add(m);
			}.bind(this))
			.fail(function(xhr) {
				Forms.displayErrors(xhr, this.getUI('errors'), this.el);
			}.bind(this));
	},

	onActionShow: function() {
		this.getUI('form').show();
	}

});

var VariantRowView = Marionette.View.extend({
	template: require('../templates/product.variants.row.html'),
	className: 'list-item',

	behaviors: [RowActionsBehavior, VatBehavior, SelectifyBehavior],

	regions: {
		taxes: {
			el: "div[data-role='taxes']",
			replaceElement: true
		},
		images: {
			el: "div[data-role='images']",
			replaceElement: true
		},
		name: {
			el: "div[data-role='name']",
			replaceElement: true
		},
		file: {
			el: "div[data-role='file']",
			replaceElement: true
		}
	},

	ui: {
		'list': 'div[data-role="list"]',
		'form': 'form[data-role="edit"]',
		'errors': 'div[data-role="errors"]',
		'stock_fields': 'div[data-role="stock"]',
		'is_stock_unlimited': 'select[name="is_stock_unlimited"]'
	},

	events: {
		'change @ui.is_stock_unlimited': function(event) {
			if (this.getUI('is_stock_unlimited').val() == '1') {
				this.getUI('stock_fields').hide();
			} else {
				this.getUI('stock_fields').show();
			}
		}
	},

	fields: [
		'name',
		'reference',
		'tax_id',
		'gtin',
		'condition',
		'weight',
		'price_ex_vat',
		'price_inc_vat',
		'price_discount_ex_vat',
		'price_discount_inc_vat',
		'price_ecotax',
		'is_stock_unlimited',
		'media_id',
		'stock',
		'file_id'
	],

	editing: false,

	initialize: function(options) {
		this.taxes = options.taxes;
		this.images = options.images;
		this.names = options.names;
		this.currency = options.currency;
		this.is_virtual = options.is_virtual;
		this.editing = false;
		this.listenTo(this.images, 'add remove', this.onImageSync);
	},

	templateContext: function() {
		return {
			//	vat_rate_formatted: _string.numberFormat(parseFloat(this.model.get('vat_rate')), 2, ',', ' ')
			current_price_ex_vat_label: this.model.get('price_discount_ex_vat') ? this.model.get(
				'price_discount_ex_vat_label') : this.model.get('price_ex_vat_label'),
			current_price_inc_vat_label: this.model.get('price_discount_inc_vat') ? this.model.get(
				'price_discount_inc_vat_label') : this.model.get('price_inc_vat_label'),
			convertMediaPath: Session.convertMediaPath.bind(Session),
			price_ex_vat: format.formatFloat(this.model.get('price_ex_vat'), 4),
			price_inc_vat: format.formatFloat(this.model.get('price_inc_vat'), 4),
			price_discount_ex_vat: format.formatFloat(this.model.get('price_discount_ex_vat'), 4),
			price_discount_inc_vat: format.formatFloat(this.model.get('price_discount_inc_vat'), 4),
			price_ecotax: format.formatFloat(this.model.get('price_ecotax')),
			currency: this.currency,
			is_virtual: this.is_virtual
		};
	},

	onRender: function() {
		this.showChildView('taxes', new SelectView({
			collection: this.taxes,
			selected: this.model.get('tax_id'),
			name: 'tax_id'
		}));
		this.showChildView('images', new Marionette.CollectionView({
			className: 'btn-group d-block',
			attributes: {
				"data-toggle": "buttons"
			},
			collection: this.images,
			childView: VariantImageRowView,
			childViewOptions: {
				variant: this.model
			}
		}));
		this.showChildView('name', new AutocompleteInputView({
			searchPlaceholder: 'Rechercher un intitulé',
			name: 'name',
			current: this.model.get('name'),
			noResultsLabel: null
		}));

		if (this.is_virtual) {
			this.showChildView('file', new FilePickerView({
				fieldname: 'file_id',
				fieldLabel: 'Fichier téléchargeable',
				type: 'file',
				value: this.model.get('file_id'),
				collectionFiles: Downloads,
				collectionFolders: DownloadsFolders
			}));
		}
	},

	/**
	 * Sync variant image with image collection
	 *
	 * @param model
	 */
	onImageSync: function(model) {

		var src;

		// Variant without image get first image
		if (this.model.get('media_id') == null && this.images.length == 1) {
			src = Session.convertMediaPath('/media/miniature/' + model.get('media_id') + '.jpg');
			Backbone.$('img', this.el).attr("src", src);
			this.model.set('media_id', model.get('media_id'));
			return;
		}

		// Variant image was removed
		if (model.get('media_id') != this.model.get('media_id')) {
			return;
		}
		if (this.images.length > 0) {
			var img = _.sortBy(this.images.toJSON(), 'position')[0];
			src = Session.convertMediaPath('/media/miniature/' + img.media_id + '.jpg');
			Backbone.$('img', this.el).attr("src", src);
			this.model.set('media_id', img.media_id);
		} else {
			Backbone.$('img', this.el).attr("src", '');
			this.model.set('media_id', null);
		}

	},

	onChildviewInput: function(term, view) {
		this.names.suggest(term, 5).done(function(names) {
			var results = _.map(names, function(variant) {
				return {
					label: variant.name,
					value: variant.name
				};
			});
			view.showResults(results);
		}.bind(this));
	},

	onActionDuplicateRow: function() {
		return this.model.duplicate()
			.done(function(duplicate) {
				this.model.collection.add(duplicate);
			}.bind(this))
			.fail(function(xhr) {
				var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
				navigationController.showErrorModal(xhr);
			});
	},

	onActionDeleteRow: function() {
		return this.model.destroy({
			wait: true
		}).fail(function(xhr) {
			var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
			navigationController.showErrorModal(xhr);
		});
	},

	onActionEditRow: function() {
		this.editing = true;
		this.getUI('list').hide();
		this.getUI('form').show();

	},

	onActionCancelRow: function() {
		this.editing = false;
		this.getUI('form').hide();
		this.getUI('list').show();
	},

	onActionSaveRow: function() {
		Forms.clearErrors(this.getUI('errors'), this.el);

		var data = Forms.extractFields(this.fields, this);
		if (data.is_stock_unlimited) {
			data.stock = null; // Be sure to nullify any value
		}

		return this.model.save(
				data, {
					patch: true,
					wait: true
				}
			).done(function() {
				this.editing = false;
			}.bind(this))
			.fail(function(xhr) {
				Forms.displayErrors(xhr, this.getUI('errors'), this.el);
			}.bind(this));
	}

});

// Images

var ImageRowView = Marionette.View.extend({
	template: _.template(
		'<div class="si-overlay"><span data-role="delete-image" class="md-icon md-delete btn-si"></span></div>' +
		'<img alt="<%- name %>" src="<%- convertMediaPath(\'/media/vignette/\' + media_id + \'.jpg\') %>">'),
	className: 'btn btn-image', // + active
	tagName: 'label',

	attributes: function() {
		return {
			'data-id': this.model.get('media_id')
		};
	},

	events: {
		'click [data-role="delete-image"]': function() {
			this.model.destroy();
		}
	},

	templateContext: function() {
		return {
			convertMediaPath: Session.convertMediaPath.bind(Session)
		};
	},

	onRender: function() {
		if (this.model.get('position') == 1) this.$el.addClass('active');
		else this.$el.removeClass('active');
	}

});

var EmptyImageRowView = Marionette.View.extend({
	template: _.template(
		'<div class="list-item-empty">Ce produit n\'a pas d\'illustration...</div>'
	)
});

var ImagesView = Marionette.View.extend({
	template: require('../templates/product.images.html'),
	className: 'post-article',
	tagName: 'article',

	attributes: {
		"data-toggle": "buttons"
	},

	regions: {
		list: {
			el: "div[data-role='list']",
			replaceElement: true
		},
		add: {
			el: "a[data-role='add-image']",
			replaceElement: true
		}
	},

	initialize: function(options) {
		this.mergeOptions(options, ['collection']);
		// options.rowView
	},

	onRender: function() {
		this.showChildView('list', new Marionette.CollectionView({
			className: 'btn-group d-block',
			collection: this.collection,
			childView: ImageRowView,
			emptyView: EmptyImageRowView
		}));

		this.showChildView('add', new FileSelectorView());

		var $bloc = this.getChildView('list').$el;
		var scrollfix = 0;
		$bloc.sortable({
			start: function(event, ui) {
				if (Backbone.$(this).data('sortableFirst') != true) {
					scrollfix = Backbone.$('#content').scrollTop();
				} else {
					scrollfix = 0;
				}
				Backbone.$(this).data('sortableFirst', true);
			},
			sort: function(event, ui) {
				if (scrollfix > 0) {
					ui.helper.css({
						'top': ui.position.top - scrollfix + 'px'
					});
				}
			},
			change: function(event, ui) {
				scrollfix = 0;
			},
			update: function(event, ui) {
				var list = [];

				$bloc.children().each(function(i) {
					var $el = Backbone.$(this);
					if (i == 0) $el.addClass('active');
					else $el.removeClass('active');
					list.push($el.data('id'));
				});

				this.collection.reOrder(list);

			}.bind(this)
		});
	},

	onChildviewSelectedFile: function(data) {
		var position = this.collection.reduce(function(memo, model) {
			return Math.max(memo, model.get('position'));
		}, 0);

		_.each(data, function(file) {
			this.collection.create({
				media_id: file.media_id,
				name: file.name,
				orginial_name: file.orginial_name,
				product_id: this.collection.product_id,
				position: position + 1
			});
		}.bind(this));
	}

});

// Type

var TypeSelectorView = Marionette.View.extend({
	template: require('../templates/product.type.html'),
	className: 'post-article',
	tagName: 'article',

	types: [],
	fields: [],
	type: '',
	product: null,
	backupFields: [
		'text1',
		'text2',
		'text3',
		'text4',
		'text5',
		'text6',
		'text7',
		'text8',
		'text9',
		'text10',
		'text11',
		'text12',
		'text13',
		'text14',
		'text15'
	],

	ui: {
		'select': "select[name='type']"
	},

	events: {
		'change @ui.select': function() {
			this.selectType(this.getUI('select').val(), true);
		}
	},

	behaviors: [CharCountBehavior, WysiwygBehavior, SelectifyBehavior],

	initialize: function(options) {
		this.mergeOptions(options, ['type', 'typesSource', 'product', 'formEl']);

		this.typesSource.done(function(types) {
			this.types = types;
			this.selectType(this.type, false);
		}.bind(this));
	},

	templateContext: function() {
		return {
			type: this.type,
			types: this.types,
			product: this.product,
			fields: this.fields
		};
	},

	selectType: function(type, backup) {
		this.type = type;

		// backup values
		if (backup) {
			this.triggerMethod('wysiwyg:save');
			this.product.set(
				Forms.extractFormFields(this.backupFields, this.formEl)
			);
		}

		var fields = [];
		var current = _.find(this.types, function(type) {
			return type.type == this.type;
		}.bind(this));
		if (current && current.fields) {
			fields = current.fields;
		}

		// Remove unwanted regions
		_.each(this.getRegions(), function(region, index) {
			if (index.substring(0, 11) == 'filepicker-') {
				this.removeRegion(index);
			}
		}.bind(this));

		// Add new regions
		_.each(fields, function(field) {
			if (field.type != 'image' && field.type != 'file') return;

			var regName = 'filepicker-' + field.field;
			if (this.getRegion(regName)) return;
			this.addRegion(regName, 'div[data-role="' + regName + '"]');
		}.bind(this));

		// Render new fields
		this.fields = fields;
		this.render();
	},

	onRender: function() {
		// Add file pickers
		_.each(this.fields, function(field) {
			if (field.type != 'image' && field.type != 'file') return;

			var regName = 'filepicker-' + field.field;
			this.showChildView(regName, new FilePickerView({
				fieldname: field.field,
				fieldLabel: field.name,
				type: field.type,
				value: this.product.get(field.field)
			}));
		}.bind(this));
	}
});

// Product

module.exports = Marionette.View.extend({
	template: require('../templates/product.html'),
	className: 'container container-large',
	service: 'catalog',

	behaviors: [FormBehavior, WysiwygBehavior, Datepicker],

	regions: {
		layout: {
			el: "article[data-role='layout']",
			replaceElement: true
		},
		type: {
			el: "article[data-role='type']",
			replaceElement: true
		},
		'primary-categ': {
			el: "div[data-role='primary-categ']",
			replaceElement: true
		},
		'other-categ': {
			el: "div[data-role='other-categ']",
			replaceElement: true
		},
		'brand': {
			el: "div[data-role='brand']",
			replaceElement: true
		},
		'tags': {
			el: "div[data-role='tags']",
			replaceElement: true
		},
		variants: {
			el: "article[data-role='variants']",
			replaceElement: true
		},
		images: {
			el: "article[data-role='images']",
			replaceElement: true
		},
		seo: {
			el: "article[data-role='seo']",
			replaceElement: true
		}
	},

	ui: {
		'form': 'form[data-role="part"]'
	},

	fields: [
		'name',
		'available_date',
		'is_spotlight',
		'header',
		'description',
		'extra_shipping',
		'is_visible',
		'type',
		'text1',
		'text2',
		'text3',
		'text4',
		'text5',
		'text6',
		'text7',
		'text8',
		'text9',
		'text10',
		'text11',
		'text12',
		'text13',
		'text14',
		'text15',
		'slug',
		'meta_title',
		'meta_description',
		'meta_keywords',
		'js_head',
		'js_body'
	],

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'typesSource', 'categories', 'brands', 'tags', 'variants', 'taxes', 'images']);

		if (this.getOption('enableLayout')) {
			this.layoutSelector = new LayoutSelectorView({
				layout_id: this.model.get('layout_id'),
				type: 'catalog-product',
				apply: this.model.get('product_id'),
				applyName: this.model.get('name')
			});
		}
		this.variants.set(this.model.get('variants'));
		this.variantsView = new ListView({
			collection: this.variants,
			rowView: VariantRowView,
			newRowView: NewVariantRowView,
			fixRelativeDragNDrop: true,

			title: 'Variantes',
			childViewOptions: {
				taxes: this.taxes,
				images: this.images,
				names: new VariantsNames(),
				currency: format.currencyEntity(this.model.meta.currency),
				is_virtual: this.model.get('is_virtual')
			}
		});

		var images = this.model.get('images');
		_.each(images, function(image) {
			image.product_id = this.model.get('product_id'); // images fetched with extra_fields doesn't have a product id
		}.bind(this));
		this.images.set(images);
		this.imagesView = new ImagesView({
			collection: this.images
		});

		this.listenTo(this.model, 'change', this.render);
	},

	templateContext: function() {
		return {
			available_date: format.formatDateTime(this.model.get('available_date')),
			extra_shipping: format.formatFloat(this.model.get('extra_shipping')),
			'base_price': this.model.meta.base_price,
			'currency': format.currencyEntity(this.model.meta.currency)
		};
	},

	onBeforeRender: function() {
		if (this.getOption('enableLayout') && this.layoutSelector.isAttached()) {
			this.detachChildView('layout');
		}
		if (this.variantsView.isAttached()) {
			this.detachChildView('variants');
		}
		if (this.imagesView.isAttached()) {
			this.detachChildView('images');
		}

	},

	onRender: function() {
		if (this.getOption('enableLayout')) {
			this.showChildView('layout', this.layoutSelector);
		}
		var view = new TypeSelectorView({
			type: this.model.get('type'),
			product: this.model,
			typesSource: this.typesSource,
			formEl: this.getUI('form')
		});
		this.showChildView('type', view);
		// proxy filepickers events
		this.listenTo(view, 'childview:field:change', function() {
			this.triggerMethod('field:change');
		}.bind(this));

		this.showChildView('images', this.imagesView);
		this.showChildView('variants', this.variantsView);

		// Categories
		var main_category = _.find(this.model.get('categories'), function(c) {
			return c.is_main;
		});
		this.showChildView('primary-categ', new AutocompleteView({
			searchPlaceholder: 'Rechercher une catégorie',
			current: {
				label: main_category.name,
				value: main_category.category_id
			}
		}));
		var other_categories = _.filter(this.model.get('categories'), function(c) {
			return !c.is_main;
		});
		other_categories = _.map(other_categories, function(categ) {
			return {
				label: categ.name,
				value: categ.category_id
			};
		});
		this.showChildView('other-categ', new TagView({
			searchPlaceholder: 'Rechercher une catégorie',
			tags: other_categories
		}));
		this.listenTo(this.getChildView('other-categ').collection, 'update', function() {
			this.triggerMethod('field:change');
		}.bind(this));


		// Brand
		this.showChildView('brand', new AutocompleteView({
			searchPlaceholder: 'Rechercher une marque',
			isMandatory: false,
			evtSuffix: 'brand',
			current: {
				label: this.model.get('brand_name'),
				value: this.model.get('brand_id')
			}
		}));

		// Tags
		var tags = _.map(this.model.get('tags'), function(tag) {
			return {
				label: tag.name,
				value: tag.tag_id
			};
		});
		this.showChildView('tags', new TagView({
			evtSuffix: 'tags',
			searchPlaceholder: 'Rechercher un tag',
			tags: tags
		}));
		this.listenTo(this.getChildView('tags').collection, 'update', function() {
			this.triggerMethod('field:change');
		}.bind(this));

		// Seo
		if (this.getOption('enableSeo')) {
			this.showChildView('seo', new SeoView({
				slug_prefix: '/catalogue/',
				model: this.model
			}));
		}
	},

	// Brand management

	onChildviewInputBrand: function(term, view) {
		this.brands.suggest(term, 5).done(function(brands) {
			var results = _.map(brands, function(brand) {
				return {
					label: brand.name,
					value: brand.brand_id
				};
			});

			// TODO : exclude current des results
			// TODO : ne pas mettre xtra si correspondance exacte avec la marque
			view.showResults(results, {
				title: 'Ajouter la marque',
				eventName: 'add'
			});
		}.bind(this));
	},

	onChildviewChangeBrand: function(selected, view) {

		this.model.set('brand_id', selected.value, {
			silent: true
		});

	},

	onChildviewAddBrand: function(term, view) {

		if (term == '') return;

		this.brands.create({
			name: term
		}, {
			wait: true,
			success: function(model) {
				view.setCurrent({
					label: model.get('name'),
					value: model.get('brand_id')
				});
				this.model.set('brand_id', model.get('brand_id'), {
					silent: true
				});
			}.bind(this)
			// TODO failure
		});
	},

	// Tags management

	onChildviewInputTags: function(term, view) {

		var exclude = _.pluck(view.getTags(), 'value');
		this.tags.suggest(term, 5, exclude).done(function(tags) {
			var results = _.map(tags, function(tag) {
				return {
					label: tag.name,
					value: tag.tag_id
				};
			});

			// TODO : ne pas mettre xtra si correspondance exacte avec un tag
			view.showResults(results, [{
				title: 'Tous les tags',
				eventName: 'list',
				iconClass: 'md-all'
			}, {
				title: 'Ajouter le tag',
				eventName: 'add'
			}]);
		}.bind(this));
	},

	onChildviewListTags: function(term, view) {

		var selected = _.reduce(view.getTags(), function(acc, tag) {
			if (_.isNumber(tag.value)) { // could be a string for new tags
				acc.push(tag.value);
			}
			return acc;
		}, []);

		var contentView = new ModalTagsView({
			collection: this.tags,
			selected: selected
		});

		this.listenTo(contentView, 'selected:modal', function(tag) {
			view.addTag({
				label: tag.name,
				value: tag.tag_id
			});
		}.bind(this));

		var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
		navigationController.showInModal(contentView, {
			title: 'Selectionner un tag',
			modalClass: 'modal-right has-filters',
			modalDialogClass: 'modal-sm'
		});

	},

	onChildviewAddTags: function(term, view) {

		if (term == '') return;

		view.addTag({
			value: term, // trick to add tag
			label: term
		});

	},

	// Categories management

	onChildviewInput: function(term, view) {

		if (view == this.getChildView('primary-categ') || view == this.getChildView('other-categ')) {

			var exclude;

			if (view == this.getChildView('primary-categ')) {
				// exclude primary
				exclude = [view.current.value];
			} else if (view == this.getChildView('other-categ')) {
				// exclude primary and secondary
				exclude = _.pluck(view.getTags(), 'value');
				var primary = this.getChildView('primary-categ');
				exclude.push(primary.current.value);
			}

			this.categories.suggest(term, 5, exclude).done(function(categories) {
				var results = _.map(categories, function(categ) {
					return {
						label: categ.name,
						value: categ.category_id
					};
				});

				view.showResults(results, [{
					title: 'Toutes les catégories',
					eventName: 'list',
					iconClass: 'md-all'
				}]);
			});
		}
	},

	onChildviewList: function(term, view) {

		// select primary and secondary categories
		var primary = this.getChildView('primary-categ');
		var others = this.getChildView('other-categ');

		var selected = _.pluck(others.getTags(), 'value');
		selected.push(primary.current.value);

		var contentView = new ModalCategoriesView({
			collection: this.categories,
			selected: selected
		});

		this.listenTo(contentView, 'selected:modal', function(model) {

			var categ = {
				value: model.category_id,
				label: model.name
			};

			if (view == this.getChildView('primary-categ')) { // primary
				view.setCurrent(categ);
				others.collection.remove(categ.value);
			} else if (view == this.getChildView('other-categ')) { // secondary
				view.addTag(categ);
			}
		}.bind(this));

		var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
		navigationController.showInModal(contentView, {
			title: 'Selectionner une catégorie',
			modalClass: 'modal-right has-filters',
			modalDialogClass: 'modal-sm'
		});

	},

	onChildviewChange: function(selected, view) {
		if (view == this.getChildView('primary-categ')) {
			var other = this.getChildView('other-categ');
			other.collection.remove(selected.value);
		}
	},

	// Layout management

	onChildviewChangeLayout: function(layout_id) {
		if (layout_id == this.model.get('layout_id')) return;

		this.model.save({
			layout_id: layout_id
		}, {
			patch: true
		});
	},

	// Variantes

	onChildviewSortChange: function(data) {
		this.variants.reOrder(data.list);
	},

	onSave: function() {

		// Save all current editing
		this.variantsView.getChildren().each(function(rowView) {
			if (rowView.editing) {
				rowView.onActionSaveRow();
			}
		});

		var data = Forms.extractFields(this.fields, this, 'form[data-role="part"]');
		data.brand_id = this.model.get('brand_id') || '';
		data.tags = _.pluck(this.getChildView('tags').getTags(), 'label'); // API can handle label. Simpler, safer
		if (data.tags.length == 0) data.tags = ''; // hack to explicit removal
		var c = [this.getChildView('primary-categ').getCurrent().value];
		data.categories = c.concat(_.pluck(this.getChildView('other-categ').getTags(), 'value'));

		if (this.getOption('enableSeo') && Forms.isTmpSlug(data.slug)) {
			data.slug = data.name;
		}

		return this.model.save(
			data, {
				patch: true,
				wait: true
			}
		);
	},

	onDelete: function() {
		return this.model.destroy({
			wait: true
		});
	}

});
