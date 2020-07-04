var connection = $.db.getConnection();
var statement1 = null, statement2 = null, statement3 = null;
var resultSet1 = null, resultSet2 = null, resultSet3 = null;
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

function getTotalOccupancyData() {
	var totalOccupancy = 0;
	var query1 = 'select COUNT(*) from \"IN2128_HDI_OFFICEORACLE_HDB_1\".\"OfficeOracle.OfficeOracle.hdb.mockdata::Occupant\"';
	statement1 = connection.prepareStatement(query1);
	resultSet1 = statement1.executeQuery();

	while (resultSet1.next()) {
		totalOccupancy = resultSet1.getNString(1);
	}
	return totalOccupancy;
}

function getOverviewRoomOccupanyData() {
	var totalRoomOccupancy = [];
	var query2 = 'SELECT "RID", "ROOMX", "ROOMY", "CAPACITY_MAX", "FID" FROM "IN2128_HDI_OFFICEORACLE_HDB_1"."OfficeOracle.OfficeOracle.hdb.mockdata::Room"';
	statement2 = connection.prepareStatement(query2);
	resultSet2 = statement2.executeQuery();
	while (resultSet2.next()) {
		var query3 = 'SELECT COUNT(*) FROM "IN2128_HDI_OFFICEORACLE_HDB_1"."OfficeOracle.OfficeOracle.hdb.mockdata::Occupant" WHERE RID=' + resultSet2.getInteger(1);
		var room = {
			roomInfo: {
				RID: resultSet2.getInteger(1),
				ROOMX: resultSet2.getInteger(2),
				ROOMY: resultSet2.getInteger(2),
				CAPACITY_MAX: resultSet2.getInteger(3),
				FID: resultSet2.getInteger(4)
			},
			totalOccupants: 0,
			occupancyPercentage: "0%"
		};
		statement3 = connection.prepareStatement(query3);
		resultSet3 = statement3.executeQuery();
		if(resultSet3.next()) {
			room.totalOccupants = parseInt(resultSet3.getNString(1), 10);
			if(room.roomInfo.CAPACITY_MAX) {
				var roomOccupancyPercent = (room.totalOccupants / room.roomInfo.CAPACITY_MAX) * 100;
				room.occupancyPercentage = parseInt(roomOccupancyPercent, 10);
			}
		}
		totalRoomOccupancy.push(room);
	}
	return totalRoomOccupancy;
}

function doGet() {

	try {
		$.response.contentType = "application/json";
		var responseData = { 
			totalOccupancy: getTotalOccupancyData(),
			overviewRoomOccupancy: getOverviewRoomOccupanyData()
		};
		close([resultSet1, statement1, resultSet2, statement2, resultSet3, statement3, connection]);
		$.response.setBody(JSON.stringify(responseData));
	} catch (err) {
		$.response.contentType = "text/plain";
		$.response.setBody("Error while executing query: [" + err.message + "]");
		$.response.returnCode = 200;
	}
}
doGet();