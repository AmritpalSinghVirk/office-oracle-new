var connection = $.db.getConnection();
var roomId = $.request.parameters.get("RoomID");
var statement1 = null;
var resultSet1 = null;
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

function getAllRooms() {
	var rooms = [];
	var query1 = 'SELECT "RID", "ROOMX", "ROOMY", "CAPACITY_MAX", "FID" FROM "IN2128_HDI_OFFICEORACLE_HDB_1"."OfficeOracle.OfficeOracle.hdb.mockdata::Room"';
	statement1 = connection.prepareStatement(query1);
	resultSet1 = statement1.executeQuery();

	while (resultSet1.next()) {
		var room= {
			RID: resultSet1.getInteger(1),
			ROOMX: resultSet1.getInteger(2),
			ROOMY: resultSet1.getInteger(2),
			CAPACITY_MAX: resultSet1.getInteger(3),
			FID: resultSet1.getInteger(4)
		};
		rooms.push(room);	
	}
	return rooms;
}

function doGet() {
	try {
		$.response.contentType = "application/json";
		var responseData = {
			rooms: getAllRooms()
		};
		close([resultSet1, statement1, connection]);
		$.response.setBody(JSON.stringify(responseData));
	} catch (err) {
		$.response.contentType = "text/plain";
		$.response.setBody("Error while executing query: [" + err.message + "]");
		$.response.returnCode = 200;
	}
}
doGet();