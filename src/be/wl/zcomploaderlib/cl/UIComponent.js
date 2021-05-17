sap.ui.define([
	"sap/ui/core/UIComponent"
], function (UIComponent) {
	"use strict";

	return UIComponent.extend("be.wl.zcomploaderlib.cl.UIComponent", {

		metadata: {
			properties: {
				input: {
					type: "object"
				}
			},
			events: {
				action: {
					parameters: {
						type: "string",
						level: "string",
						/**
						 * The item whose selection has changed. In <code>MultiSelect</code> mode, only the up-most selected item is returned. This parameter can be used for single-selection modes.
						 */
						data: {
							type: "object"
						}
					}
				}
			}
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function () {
			var oCompData = this.getComponentData();
			if (oCompData && typeof oCompData.input === "object") {
				this.setInput(oCompData.input);
			}
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);
		},
		setInput: function (input) {
			// var root = this.getRootControl();
			// root.getController().updateFilter(assets);
			var bus = this.getEventBus();
			if (input) {
				bus.publish("cep", "input", input);
			}
			this.setProperty("input", input);
			return this;
		}
	});
});