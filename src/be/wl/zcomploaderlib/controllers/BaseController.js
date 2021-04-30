/*global history, sap */
var _fragments = [];
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"sap/ui/core/routing/History",
	"sap/ui/core/syncStyleClass",
	"sap/ui/core/Fragment"
], function (Controller, UIComponent, History, syncStyleClass, Fragment) {
	"use strict";

	return Controller.extend("be.wl.zcomploaderlib.controllers.BaseController", {

		getRouter: function () {
			return UIComponent.getRouterFor(this); 
		},
		getModel: function (sName) {
			return this.getView().getModel(sName);
		},
		setModel: function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},
		getResourceModel: function () {
			return this.getOwnerComponent().getModel("i18n");
		},
		getResourceBundle: function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},
		getText: function (key, params) {
			return this.getResourceBundle().getText(key, params);
		},
		onNavBack: function () {
			var sPreviousHash = History.getInstance().getPreviousHash();
			try {
				var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
			} catch (ex) {
				this.getRouter().navTo("Scan", {}, true);
				return;
			}
			if (sPreviousHash !== undefined || !oCrossAppNavigator.isInitialNavigation()) {
				history.go(-1);
			} else {
				this.getRouter().navTo("Scan", {}, true);
			}
		},
		onMessagePopoverPress: function (oEvent) {
			this._getMessagePopover().openBy(oEvent.getSource());
		},
		//################ Private APIs ###################

		_getMessagePopover: function () {
			// create popover lazily
			if (!this._oMessagePopover) {
				this._oMessagePopover = sap.ui.xmlfragment(this.getView().getId(),
					"be.elia.pm.BottleManager.view.common.fragment.MessagePopover", this);
				this.getView().addDependent(this._oMessagePopover);
			}
			return this._oMessagePopover;
		},
		onExit: function () {
			_fragments = [];
		},
		openFragment: function (sName, model, updateModelAlways, callback, data, popoverSource, autoOpen) {
			if (typeof sName === 'object') {
				model = sName.model;
				updateModelAlways = sName.updateModelAlways;
				callback = sName.callback;
				data = sName.data;
				popoverSource = sName.popoverSource;
				autoOpen = sName.autoOpen;
				sName = sName.name;
			}
			if (autoOpen === undefined || autoOpen === null) {
				autoOpen = true;
			}
			if (sName.indexOf(".") > 0) {
				var aViewName = sName.split(".");
				sName = sName.substr(sName.lastIndexOf(".") + 1);
			} else { //current folder
				aViewName = this.getView().getViewName().split("."); // view.login.Login
			}
			aViewName.pop();
			var sViewPath = aViewName.join(".") + ".",
				controllerPath = sViewPath.replace("view", "controller"),
				id = this.getView().getId() + "-" + sName;
			if (!_fragments[id]) {
				_fragments[id] = {};
				return Controller.create({
					name: controllerPath + sName
				}).then(function (controller) {
					return controller;
				}).catch(function () {
					return this;
				}.bind(this)).then(function (controller) {
					_fragments[id].controller = controller;
					return {
						id: id,
						name: sViewPath + sName,
						controller: controller
					};
				}).then(Fragment.load).then(function (fragment) {
					_fragments[id].fragment = fragment;
					this.getView().addDependent(_fragments[id].fragment);
					this.showFragment({
						callback: callback,
						data: data,
						popoverSource: popoverSource,
						autoOpen: autoOpen,
						fragment: _fragments[id]
					});
					return fragment;
				}.bind(this));
			} else {
				this.showFragment({
					callback: callback,
					data: data,
					popoverSource: popoverSource,
					autoOpen: autoOpen,
					fragment: _fragments[id]
				});
			}
		},
		showFragment: function (options) {
			var callback = options.callback,
				data = options.data,
				popoverSource = options.popoverSource,
				autoOpen = options.autoOpen,
				dialog = options.fragment;

			if (dialog.controller && dialog.controller !== this) {
				dialog.controller.onBeforeShow(this, dialog, callback, data, popoverSource);
			}
			syncStyleClass(this.getView().getController().getOwnerComponent().getContentDensityClass(), this.getView(), dialog.fragment);
			var time = 1;
			// if (popoverSource) {
			// 	time = 1000;
			// }
			if (autoOpen) {
				setTimeout(function () {
					if (popoverSource) {
						dialog.fragment.openBy(popoverSource);
					} else {
						dialog.fragment.open(data && data.search ? data.search : '');
					}
				}, time);
			}
		},
		getFragmentControlById: function (parent, id) {
			var latest = this.getMetadata().getName().split(".")[this.getMetadata().getName().split(".").length - 1];
			return sap.ui.getCore().byId(parent.getView().getId() + "-" + latest + "--" + id);
		},
		closeFragments: function () {
			for (var f in _fragments) {
				// if (_fragments[f] && _fragments[f].fragment["isOpen"] && _fragments[f].fragment.isOpen()) {
				_fragments[f].fragment.close();
				// }
			}
		},
		getFragment: function (fragment) {
			return _fragments[this.getView().getId() + "-" + fragment];
		},
	});
});