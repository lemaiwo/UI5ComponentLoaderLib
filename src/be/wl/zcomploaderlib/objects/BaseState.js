sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/ValueState",
	"sap/base/Log"
], function (Object, JSONModel, ValueState, Log) {
	"use strict";
	return Object.extend("be.wl.zcomploaderlib.objects.BaseState", {
		constructor: function (data) {
			this.logger = Log.getLogger("be.wl.zcomploaderlib.objects.BaseState", Log.Level.INFO);
			this.getModel().attachPropertyChange(function (oProperty) { // eslint-disable-line no-console
				// this.isDirty = this.isDirtyCheck();
				// sap && sap.ushell && sap.ushell.Container && sap.ushell.Container.setDirtyFlag(this.isDirty);
				// this["update" + oProperty.getParameter("path")] && this["update" + oProperty.getParameter("path").substr(1)]();
				var fChangeFunction = this.getChangeFunction(oProperty.getParameter("path"));
				this.callChangeFunction(fChangeFunction.function, fChangeFunction.caller, [this, oProperty]);
				if (oProperty.getParameter("context")) {
					fChangeFunction = this.getChangeFunction(oProperty.getParameter("context").getPath() + "/" + oProperty.getParameter("path"));
					this.callChangeFunction(fChangeFunction.function, oProperty.getParameter("context").getObject(), oProperty);
					//call parent
					var sPath = oProperty.getParameter("context").getPath();
					var sParent = sPath.split("/")[sPath.split("/").length - 1];
					if (!isNaN(parseInt(sParent))) { //in case of integer it's probably an array and we need to go one level up
						sPath = sPath.split("/").slice(0, sPath.split("/").length - 1).join("/");
					}
					var sSourcePath = sPath.split("/").slice(0, sPath.split("/").length - 1).join("/");
					var oSource = (sSourcePath && oProperty.getParameter("context").getModel().getProperty(sSourcePath));
					fChangeFunction = this.getChangeFunction(sPath);
					this.callChangeFunction(fChangeFunction.function, (oSource || oProperty.getParameter("context").getObject()), oProperty);

				}
			}, this);
		},
		getProperty: function (property) {
			return this.data[property];
		},
		setProperty: function (property, value) {
			this.data[property] = value;
		},
		getChangeFunction: function (sPath) {
			sPath = sPath.substr(0, 1) === "/" ? sPath.substr(1) : sPath;
			return sPath.split("/").reduce(function (prev,
				curr,
				idx, array) {
				if (idx === array.length - 1) {
					return {
						function: prev[curr + "Changed"],
						caller: prev
					};
				}
				return curr && curr.length > 0 && prev ? prev[curr] : prev;
			}, this.data);
		},
		callChangeFunction: function (fChangeFunction, scope, args) {
			fChangeFunction && fChangeFunction.apply(scope, args);
		},
		getModel: function () {
			if (!this.model) {
				this.model = new JSONModel(this.data, true);
				//this.model.setData(this);
			}
			return this.model;
		},
		updateModel: function (bHardRefresh) {
			if (this.model) {
				this.model.refresh(bHardRefresh ? true : false);
			}
		},
		camelize: function (str) {
			return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
				return index == 0 ? word.toLowerCase() : word.toUpperCase();
			}).replace(/\s+/g, '');
		},
		objectMatchEntity: function (errorEntity) {
			return ( object ) => {
				if (object && object["getEntityName"] && object["getKeys"]) {
					var localPath = this.getService().model.createKey(object.getEntityName(), object.getKeys());
					this.logger.info("Trying to match local path: " + localPath + " - with error path:" + errorEntity);
					return localPath === errorEntity;
				}
				return false;
			}
		},
		findMatchingObject: function (errorEntity, object, propertyName) {
			var propertyObject = object[propertyName];
			var objectInfo = {
				path: "/" + propertyName,
				object: undefined
			};
			if (Array.isArray(propertyObject)) {
				//return "/ZPM_UI_F_WTHRREG_E(aufnr='"++"',erdat=datetime'2020-11-20T00%3A00%3A00',erfzeit=time'PT13H57M00S')
				var objectIndex = propertyObject.findIndex(this.objectMatchEntity(errorEntity));
				objectInfo.object = objectIndex > -1 ? propertyObject[objectIndex] : undefined;
				objectInfo.path += "/" + objectIndex;
			} else if (this.objectMatchEntity(errorEntity)(propertyObject)) {
				objectInfo.object = propertyObject;
			}
			if (objectInfo.object) return objectInfo;
			return false;
		},
		//make same function for root
		// move part inside for out of it into another function
		findMatchingObjectInData: function (errorEntity) {
			for (var propertyName in this.data) {
				var found = this.findMatchingObject(errorEntity, this.data, propertyName);
				if (found) return found;
			}
			return false;
		},
		resetMessageMapperValueStates: function () {
			if (this.messageMapperPaths) {
				this.messageMapperPaths.forEach(path => {
					this.getModel().setProperty(path + "ValueState", ValueState.None);
					this.getModel().setProperty(path + "ValueStateText", "");
				});
			}
		},
		messageMapper: function (propertyName) {
			var unresolveTarget = (message) => {
				if (message.processor && message.processor.mPathCache) {
					for (var path in message.processor.mPathCache)
						if (message.processor.mPathCache[path].canonicalPath === message.target) return path;
				}
				return message.target;
			};
			this.resetMessageMapperValueStates();
			this.messageMapperPaths = [];
			var messages = sap.ui.getCore().getMessageManager().getMessageModel().getData();
			//implement for a specific entity or for all (generic)
			var mappedMessages = messages.map((error) => {
				this.logger.info("Error message original target: " + error.getTarget());
				error.setTarget(unresolveTarget(error))
				error.setMessageProcessor(this.getModel());
				var path = "",
					errorTarget = error.getTarget();
				this.logger.info("Converted target: " + errorTarget);
				if (!error.getTarget()) return error; //map error to model without field
				if (error.getTarget().indexOf("/") === 0) errorTarget = errorTarget.substr(1);
				if (errorTarget.indexOf("/") === -1) return error;
				//find mapped object with associations to build path for JSON Model
				var foundObject;
				do {
					var entity = errorTarget.substr(0, errorTarget.indexOf("/"));
					this.logger.info("Try to find match for sub-path: " + entity);
					if (!foundObject) {
						this.logger.info("Try to find match for root");
						if (propertyName) foundObject = this.findMatchingObject(entity, this.data, propertyName);
						else foundObject = this.findMatchingObjectInData(entity);
					} else {
						this.logger.info("Try to find match for association");
						var assocMapping = foundObject.object["getAssociations"] && foundObject.object.getAssociations()
							.find(assoc => entity.includes(assoc.from));
						foundObject = assocMapping && this.findMatchingObject(entity.replace(assocMapping.from, assocMapping.entity), foundObject.object,
							assocMapping.to);
					}
					if (!foundObject.object) return error;
					this.logger.info("Match found");
					path += foundObject.path;
					errorTarget = errorTarget.substr(errorTarget.indexOf("/") + 1);
				} while (errorTarget.indexOf("/") > -1)

				// check if field is part of object -- maybe not needed
				if (error.getTarget().lastIndexOf("/") === -1) return error;
				var errorField = this.camelize(error.getTarget().substr(error.getTarget().lastIndexOf("/") + 1));
				// if (foundObject.object[errorField]) {
				path += "/" + errorField;
				error.setTarget(path);
				//set message in valuestate for controls that do not support the target of the messagemanager
				this.getModel().setProperty(path + "ValueState", error.getType());
				this.getModel().setProperty(path + "ValueStateText", error.getMessage());
				this.messageMapperPaths.push(path);
				// }
				return error;
			});
			sap.ui.getCore().getMessageManager().removeAllMessages();
			mappedMessages.forEach(msg => sap.ui.getCore().getMessageManager().addMessages(msg));
		}
	});
});