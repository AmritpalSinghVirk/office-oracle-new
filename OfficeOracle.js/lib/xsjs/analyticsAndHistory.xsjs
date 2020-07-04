var connection = $.db.getConnection();
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
		var year = date.getFullYear();
		var hours = (date.getHours() < 10) ? "0" + date.getHours() : date.getHours();
		var minutes = (date.getMinutes() < 10) ? "0" + date.getMinutes() : date.getMinutes();
		//var seconds = (date.getSeconds() < 10) ? "0" + date.getSeconds() : date.getSeconds();
		var meridian = (date.getHours() > 12) ? "p.m" : "a.m";
		var stringDate = dateOfMonth + "." + month + "." + year + ", " + hours + ":" + minutes /*+ ":" + seconds */+ " " + meridian;
		return stringDate;
	} else {
		return timestamp;
	}
}

var Time = function(timeString) {
    var t = timeString.split(":");
    this.hour = parseInt(t[0]);
    this.minutes = parseInt(t[1]);
    this.isBiggerThan = function(other) { 
        return (this.hour > other.hour) || (this.hour === other.hour) && (this.minutes > other.minutes);
    };
};

var timeIsBetween = function(start, end, check) {
    return (start.hour <= end.hour) ? check.isBiggerThan(start) && !check.isBiggerThan(end)
    : (check.isBiggerThan(start) && check.isBiggerThan(end)) || (!check.isBiggerThan(start) && !check.isBiggerThan(end));    
};

var getUniqueValues = function(array, key) {
	var flags = [], output = [], l = array.length, i;
	for( i=0; i<l; i++) {
	    if( flags[array[i][key]]) {
	    	continue;
	    }
	    flags[array[i][key]] = true;
	    output.push(array[i][key]);
	}
	return output;
};

function getMostOccupiedRoomData() {
	var totalRoomHistoryData = [];
	var query1 = 'SELECT "HID", "RID", "TIMESTAMP", "CAPACITY_OBSERVED", "CAPACITY_MAX" FROM "IN2128_HDI_OFFICEORACLE_HDB_1"."OfficeOracle.OfficeOracle.hdb.mockdata::History"';
	statement1 = connection.prepareStatement(query1);
	resultSet1 = statement1.executeQuery();

	while (resultSet1.next()) {
		var roomData = {
			HID: resultSet1.getInteger(1),
			RID: resultSet1.getInteger(2),
			TIMESTAMP: formatTimestamp(resultSet1.getTimestamp(3)),
			CAPACITY_OBSERVED: resultSet1.getInteger(4),
			CAPACITY_MAX: resultSet1.getInteger(5)
		};
		totalRoomHistoryData.push(roomData);
	}
	var openTime = new Time("09:00");
	var closeTime = new Time("19:00");
	var filterRoomData = totalRoomHistoryData.filter(function(room) {
		var timeString = room.TIMESTAMP.split(",")[1];
			var checkTime = new Time(timeString);
			var isBetween  = timeIsBetween(openTime, closeTime, checkTime);
			return isBetween;
	});
	var rooms = getUniqueValues(filterRoomData, "RID");
	var averageOccupancyAllRooms = [];
	var i = 0;
	while (i < rooms.length) {
		var totalCapacityObserved = 0, totalMaxCapacity = 0;
		filterRoomData.filter(function(room) {
			if(room.RID === rooms[i]) {
				totalCapacityObserved += room.CAPACITY_OBSERVED;
				totalMaxCapacity += room.CAPACITY_MAX;
			}	
		});
		var occupancyAverage = (totalCapacityObserved/totalMaxCapacity) * 100;
		averageOccupancyAllRooms.push({
			RID: rooms[i],
			OCCUPANCY_AVG: parseInt(occupancyAverage, 10)
		});
		i++;
	}
	
	return averageOccupancyAllRooms;
}

function getViolationsHistoryData() {
	var totalViolationsHistory = [];
	var query2 = 'SELECT "HID", "RID", "TIMESTAMP", "CAPACITY_OBSERVED", "CAPACITY_MAX" FROM "IN2128_HDI_OFFICEORACLE_HDB_1"."OfficeOracle.OfficeOracle.hdb.mockdata::History" WHERE "CAPACITY_OBSERVED" > "CAPACITY_MAX"';
	statement2 = connection.prepareStatement(query2);
	resultSet2 = statement2.executeQuery();
	while (resultSet2.next()) {
		var violationHistory = {
			HID: resultSet2.getInteger(1),
			RID: resultSet2.getInteger(2),
			TIMESTAMP: formatTimestamp(resultSet2.getTimestamp(3)),
			CAPACITY_OBSERVED: resultSet2.getInteger(4),
			CAPACITY_MAX: resultSet2.getInteger(5)
		};
		totalViolationsHistory.push(violationHistory);
	}
	return totalViolationsHistory;
}

function doGet() {
	try {
		$.response.contentType = "application/json";
		var responseData = { 
			mostOccupiedRooms: getMostOccupiedRoomData(),
			totalViolationsHistory: getViolationsHistoryData()
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