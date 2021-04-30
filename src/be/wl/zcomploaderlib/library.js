/*!
 * ${copyright}
 */

/**
 * Initialization Code and shared classes of library be.wl.zcomploaderlib.
 */
sap.ui.define(["./types/CentralEntryPointType", "sap/ui/core/library"], // library dependency
	function (CentralEntryPointType) {

		"use strict";

		/**
		 * 
		 *
		 * @namespace
		 * @name be.wl.zcomploaderlib
		 * @author SAP SE
		 * @version 1.0.0
		 * @public
		 */

		// delegate further initialization of this library to the Core
		sap.ui.getCore().initLibrary({
			name: "be.wl.zcomploaderlib",
			version: "1.0.0",
			dependencies: ["sap.ui.core"],
			types: ["be.wl.zcomploaderlib.types.CentralEntryPointType"],
			interfaces: [],
			controls: [
			],
			elements: []
		});
		let zcomploaderlib = be.wl.zcomploaderlib;
		zcomploaderlib.CentralEntryPointType = CentralEntryPointType;
		/* eslint-disable */
		return zcomploaderlib;
		/* eslint-enable */

	}, /* bExport= */ false);