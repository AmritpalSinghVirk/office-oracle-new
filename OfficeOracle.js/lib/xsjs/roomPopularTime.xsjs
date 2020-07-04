var connection = $.db.getConnection();
var roomId = $.request.parameters.get("RoomID");
var statement1 = null, statement2 = null;
var resultSet1 = null, resultSet2 = null;
function close(closables) {
	var closable;
	var i;
	for (i = 0; i < closables.length; i++) {
		closable = closables[i];
		if (closable) {
			closable.close();
		}
	}
}

function formatTimestamp(timestamp) {
	if(timestamp) {
		var date = new Date(timestamp);
		var dateOfMonth = (date.getDate() < 10) ? "0" + date.getDate() : date.getDate();
		var month = (date.getMonth() < 10) ? "0" + date.getMonth() : date.getMonth();
		var year = date.getFullYear().toString().slice(-2);
		
		var hours = (date.getHours() < 10) ? "0" + date.getHours() : date.getHours();
		// var minutes = (date.getMinutes() < 10) ? "0" + date.getMinutes() : date.getMinutes();
		// var seconds = (date.getSeconds() < 10) ? "0" + date.getSeconds() : date.getSeconds();
		var meridian = (date.getHours() > 12) ? "p" : "a";
		var stringDate = dateOfMonth + "/" + month + "/" +  year + " " + hours + " " + meridian;
		return stringDate;
	} else {
		return timestamp;
	}
}

function getPopularTimeTotalPerRoomData() {
	var totalRoomHistoryData = [];
	var query1 = 'SELECT "HID", "RID", "TIMESTAMP", "CAPACITY_OBSERVED", "CAPACITY_MAX" FROM "IN2128_HDI_OFFICEORACLE_HDB_1"."OfficeOracle.OfficeOracle.hdb.mockdata::History" WHERE "RID"=' + roomId;
	statement1 = connection.prepareStatement(query1);
	resultSet1 = statement1.executeQuery();

	while (resultSet1.next()) {
		var roomData = {
			HID: resultSet1.getInteger(1),
			RID: resultSet1.getInteger(2),
			FORMATTED_TIMESTAMP: formatTimestamp(resultSet1.getTimestamp(3)),
			TIMESTAMP: resultSet1.getTimestamp(3),
			CAPACITY_OBSERVED: resultSet1.getInteger(4),
			CAPACITY_MAX: resultSet1.getInteger(5),
			OCCUPANCY_AVG: ""
		};
		var occupancyAverage = parseInt((roomData.CAPACITY_OBSERVED/roomData.CAPACITY_MAX) * 100, 10);
		roomData.OCCUPANCY_AVG = (occupancyAverage > 0) ? occupancyAverage : 0;
		totalRoomHistoryData.push(roomData);
	}
	return totalRoomHistoryData;
}

function getRoomTotalMaxEmployees() {
	var roomMaxEmployeeAllowed = 0;
	var query2 = 'SELECT "CAPACITY_MAX" FROM "IN2128_HDI_OFFICEORACLE_HDB_1"."OfficeOracle.OfficeOracle.hdb.mockdata::Room" WHERE "RID"=' + roomId;
	statement2 = connection.prepareStatement(query2);
	resultSet2 = statement2.executeQuery();

	if (resultSet2.next()) {
		roomMaxEmployeeAllowed = resultSet2.getNString(1);
	}
	return roomMaxEmployeeAllowed;
}

function doGet() {
	try {
		if(!roomId || roomId === "") {
			throw new Error("Please provide room id.");
		}
		$.response.contentType = "application/json";
		var responseData = {
			popularTimeTotalPerRoom: getPopularTimeTotalPerRoomData(),
			roomMaxAllowedEmployees: getRoomTotalMaxEmployees()
		};
		close([resultSet1, statement1, resultSet2, statement2, connection]);
		$.response.setBody(JSON.stringify(responseData));
	} catch (err) {
		$.response.contentType = "text/plain";
		$.response.setBody("Error while executing query: [" + err.message + "]");
		$.response.returnCode = 200;
	}
}
doGet();