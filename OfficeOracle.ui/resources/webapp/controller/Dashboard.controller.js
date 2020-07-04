sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/ui/model/BindingMode",
	"sap/viz/ui5/data/FlattenedDataset",
	"sap/viz/ui5/format/ChartFormatter",
	"sap/viz/ui5/api/env/Format",
	"./InitPage"
], function (Controller, JSONModel, MessageBox, BindingMode, FlattenedDataset, ChartFormatter, Format, InitPageUtil) {
	"use strict";

	return Controller.extend("OfficeOracle.ui.OfficeOracle.ui.controller.Dashboard", {
		oPopularOfficeTimeVizFrame: null,
		oPopularTimePerRoomVizFrame: null,
		onInit: function () {
			var oLookupData = {
				SelectedDayKey: "Mon",
				WeekDays: [{
					Key: "Mon",
					Value: "Monday"
				}, {
					Key: "Tue",
					Value: "Tuesday"
				}, {
					Key: "Wed",
					Value: "Wednesday"
				}, {
					Key: "Thu",
					Value: "Thursday"
				}, {
					Key: "Fri",
					Value: "Friday"
				}, {
					Key: "Sat",
					Value: "Saturday"
				}, {
					Key: "Sun",
					Value: "Sunday"
				}],
				SelectedRoomKey: "",
				Rooms: []
			};
			var oLookupModel = new JSONModel(oLookupData);
			this.getView().setModel(oLookupModel, "Lookup");
			var oData = {
				CurrentTimestamp: "",
				SelectedMenu: "mainDashboard",
				TotalOccupancy: "0",
				OverviewRoomOccupancy: [],
				MostOccupiedRooms: [],
				TotalViolationsHistory: [],
				PopularOfficeTotalTime: {
					Dataset: [],
					OfficeMaxAllowedEmployees: 0
				},
				PopularTimePerRoom: {
					Dataset: [],
					RoomMaxAllowedEmployees: 0
				}
			};
			var oModel = new JSONModel(oData);
			this.getView().setModel(oModel, "Dashboard");
			this.updateTimestamp();
			this.getDashboardData();
			var sSelectedDayKey = oLookupModel.getProperty("/SelectedDayKey");
			this.getPopularTimeTotalOfficeData(sSelectedDayKey);
			this.getLookupData();
			this.oPopularOfficeTimeVizFrame = this.getView().byId("idPopularOfficeTimeVizFrame");
			this.oPopularTimePerRoomVizFrame = this.getView().byId("idPopularTimePerRoomVizFrame");
			
			//InitPageUtil.initPageSettings(this.getView());
		},
		
		onRoomChanged: function (oEvent) {
			var sKey = oEvent.getParameter("selectedItem").getKey();
			this.getPopularTimePerRoomData(sKey);
		},
		
		getLookupData: function () {
			var that = this;
			sap.ui.core.BusyIndicator.show();
			jQuery.ajax({
				url: "/xsjs/lookup.xsjs",
				method: "GET",
				dataType: "json",
				success: function (oData) {
					sap.ui.core.BusyIndicator.hide();
					var oLookupModel = that.getView().getModel("Lookup");
					oLookupModel.setProperty("/Rooms", oData.rooms);
					if(oData.rooms.length > 0) {
						oLookupModel.setProperty("/SelectedRoomKey", oData.rooms[0].RID);
					}
					that.getPopularTimePerRoomData(oData.rooms[0].RID);
					oLookupModel.refresh(true);
				},
				error: function (error) {
					sap.ui.core.BusyIndicator.hide();
					MessageBox.error(error.status + " " + error.responseText);
				}
			});
		},

		updateTimestamp: function () {
			var now = new Date(), // current date
				months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"],
				time = now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds(),

				date = [now.getDate(),
					months[now.getMonth()],
					now.getFullYear()
				].join(".");

			// set the content of the element with the ID time to the formatted string
			var oDashboardModel = this.getView().getModel("Dashboard");
			oDashboardModel.setProperty("/CurrentTimestamp", [date, time].join(" "));
			oDashboardModel.refresh(true);
		},

		getDashboardData: function () {
			var that = this;
			sap.ui.core.BusyIndicator.show();
			jQuery.ajax({
				url: "/xsjs/mainDashboard.xsjs",
				method: "GET",
				dataType: "json",
				success: function (oData) {
					sap.ui.core.BusyIndicator.hide();
					var oDashboardModel = that.getView().getModel("Dashboard");
					oDashboardModel.setProperty("/TotalOccupancy", oData.totalOccupancy);
					oDashboardModel.setProperty("/OverviewRoomOccupancy", oData.overviewRoomOccupancy);
					oDashboardModel.refresh(true);
					that.getAnalyticsAndHistoryData();
				},
				error: function (error) {
					sap.ui.core.BusyIndicator.hide();
					MessageBox.error(error.status + " " + error.responseText);
				}
			});
		},

		getAnalyticsAndHistoryData: function () {
			var that = this;
			sap.ui.core.BusyIndicator.show();
			jQuery.ajax({
				url: "/xsjs/analyticsAndHistory.xsjs",
				method: "GET",
				dataType: "json",
				success: function (oData) {
					sap.ui.core.BusyIndicator.hide();
					var oDashboardModel = that.getView().getModel("Dashboard");
					oDashboardModel.setProperty("/MostOccupiedRooms", oData.mostOccupiedRooms);
					oDashboardModel.setProperty("/TotalViolationsHistory", oData.totalViolationsHistory);
					oDashboardModel.refresh(true);
				},
				error: function (error) {
					sap.ui.core.BusyIndicator.hide();
					MessageBox.error(error.status + " " + error.responseText);
				}
			});
		},

		getPopularTimeTotalOfficeData: function (key) {
			if (!key || key === "") {
				return;
			}
		var that = this;
			sap.ui.core.BusyIndicator.show();
			jQuery.ajax({
				url: "/xsjs/officePopularTime.xsjs?Day=" + key,
				method: "GET",
				dataType: "json",
				success: function (oData) {
					sap.ui.core.BusyIndicator.hide();
					var oDashboardModel = that.getView().getModel("Dashboard");
					oDashboardModel.setProperty("/PopularOfficeTotalTime/Dataset", oData.popularTimeTotalOffice);
					oDashboardModel.setProperty("/PopularOfficeTotalTime/OfficeMaxAllowedEmployees", oData.officeMaxAllowedEmployees);
					var dataset = {
						data: {
							path: "Dashboard>/PopularOfficeTotalTime/Dataset"
						},
						dimensions: [{
							name: "Hour",
							value: "{Dashboard>TIME_SLOT}"
						}],
						measures: [{
							name: "Occupancy in %",
							value: "{Dashboard>OCCUPANCY_AVG}"
						}]
					};
					var oDataset = new FlattenedDataset(dataset);
					that.oPopularOfficeTimeVizFrame.setDataset(oDataset);
					that.oPopularOfficeTimeVizFrame.setLegendVisible(false);
					that.oPopularOfficeTimeVizFrame.setModel(oDashboardModel);
					that.oPopularOfficeTimeVizFrame.setVizProperties({
						timeAxis: {
							title: {
	                            visible: false
	                        }
						},
						plotArea: {
							dataLabel: {
								visible: true,
								formatString: "#,##0"
							}
						},
						legend: {
							visible: false
						},
						title: {
							visible: false
						}
					});
				},
				error: function (error) {
					sap.ui.core.BusyIndicator.hide();
					MessageBox.error(error.status + " " + error.responseText);
				}
			});
		},
		
		onDayChanged: function (oEvent) {
			var sKey = oEvent.getParameter("selectedItem").getKey();
			this.getPopularTimeTotalOfficeData(sKey);
		},
		
		getPopularTimePerRoomData: function (key) {
			if (!key || key === "") {
				return;
			}
			var that = this;
			sap.ui.core.BusyIndicator.show();
			jQuery.ajax({
				url: "/xsjs/roomPopularTime.xsjs?RoomID=" + key,
				method: "GET",
				dataType: "json",
				success: function (oData) {
					sap.ui.core.BusyIndicator.hide();
					var oDashboardModel = that.getView().getModel("Dashboard");
					oDashboardModel.setProperty("/PopularTimePerRoom/Dataset", oData.popularTimeTotalPerRoom);
					oDashboardModel.setProperty("/PopularTimePerRoom/RoomMaxAllowedEmployees", oData.roomMaxAllowedEmployees);
					var dataset = {
						data: {
							path: "Dashboard>/PopularTimePerRoom/Dataset"
						},
						dimensions: [{
							name: "Time",
							value: "{Dashboard>FORMATTED_TIMESTAMP}",
							dataType: "date"
						}],
						measures: [{
							name: "Occupancy in %",
							value: "{Dashboard>OCCUPANCY_AVG}"
						}]
					};
					var oDataset = new FlattenedDataset(dataset);
					that.oPopularTimePerRoomVizFrame.setDataset(oDataset);
					that.oPopularTimePerRoomVizFrame.setLegendVisible(false);
					that.oPopularTimePerRoomVizFrame.setModel(oDashboardModel);
					that.oPopularTimePerRoomVizFrame.setVizProperties({
						timeAxis: {
							title: {
	                            visible: false
	                        },
	                        levels: ["hour", "day"]
						},
						plotArea: {
							dataLabel: {
								visible: true,
								formatString: "#,##0"
							}
						},
						legend: {
							visible: false
						},
						title: {
							visible: false
						}
					});
				},
				error: function (error) {
					sap.ui.core.BusyIndicator.hide();
					MessageBox.error(error.status + " " + error.responseText);
				}
			});
		}
	});
});