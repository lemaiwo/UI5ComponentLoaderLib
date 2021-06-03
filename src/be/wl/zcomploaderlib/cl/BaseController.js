sap.ui.define([
	"../controllers/BaseController"
], function (Controller) {
	"use strict";

	return Controller.extend("be.wl.zcomploaderlib.cl.BaseController", {
		onInit: function () {
			if (this.onUpdateInput) {
				this.getEventBus().subscribe("cep", "input", this.onUpdateInput, this);
				let input = this.getComponentProperty("input");
				if (input) {
					this.onUpdateInput("cep", "input", input);
				}
			}
		},
		onExit: function () {
			if (this.onUpdateInput) {
				this.getEventBus().unsubscribe("cep", "input", this.updateInput, this);
			}
		},
		getComponentProperty: function (propertyName) {
			return this.getOwnerComponent().getProperty(propertyName);
		},
		getEventBus: function () {
			return this.getOwnerComponent().getEventBus();
		}
	});
});