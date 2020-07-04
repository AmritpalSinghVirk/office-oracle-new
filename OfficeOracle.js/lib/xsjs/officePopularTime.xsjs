var connection = $.db.getConnection();
var day = $.request.parameters.get("Day");
var days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
var validDay = days.find(function(d) {
	return d === day;
});
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
		var seconds = (date.getSeconds() < 10) ? "0" + date.getSeconds() : date.getSeconds();
		var meridian = (date.getHours() > 12) ? "p.m" : "a.m";
		var stringDate = dateOfMonth + "." + month + "." + year + ", " + hours + ":" + minutes + ":" + seconds + " " + meridian;
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

function getPopularTimeTotalOfficeData() {
	var totalRoomHistoryData = [];
	var query1 = 'SELECT "HID", "RID", "TIMESTAMP", "CAPACITY_OBSERVED", "CAPACITY_MAX" FROM "IN2128_HDI_OFFICEORACLE_HDB_1"."OfficeOracle.OfficeOracle.hdb.mockdata::History"';
	statement1 = connection.prepareStatement(query1);
	resultSet1 = statement1.executeQuery();

	while (resultSet1.next()) {
		var roomData = {
			HID: resultSet1.getInteger(1),
			RID: resultSet1.getInteger(2),
			FORMATTED_TIMESTAMP: formatTimestamp(resultSet1.getTimestamp(3)),
			TIMESTAMP: resultSet1.getTimestamp(3),
			CAPACITY_OBSERVED: resultSet1.getInteger(4),
			CAPACITY_MAX: resultSet1.getInteger(5)
		};
		totalRoomHistoryData.push(roomData);
	}
	var filteredDataByDay = totalRoomHistoryData.filter(function(data) {
		var dayString = new Date(data.TIMESTAMP).toDateString().split(" ")[0];
		return dayString === day;
	});
	var averageOccupancyTotalOffice = [];
	var openTimeCounter = 7;
	while (openTimeCounter < 21) {
		var totalCapacityObserved = 0, totalMaxCapacity = 0;
		var openTime = ((openTimeCounter < 10) ? "0" + openTimeCounter : openTimeCounter);
		var closeTimeCounter = openTimeCounter + 1;
		var closeTime = ((closeTimeCounter < 10) ? "0" + closeTimeCounter : closeTimeCounter);
		var openTimeObj = new Time(openTime + ":00");
		var closeTimeObj = new Time(closeTime + ":00");
		filteredDataByDay.filter(function(room) {
			var timeString = room.FORMATTED_TIMESTAMP.split(",")[1];
			var checkTimeObj = new Time(timeString);
			var isBetween  = timeIsBetween(openTimeObj, closeTimeObj, checkTimeObj);
			if (isBetween) {
				totalCapacityObserved += room.CAPACITY_OBSERVED;
				totalMaxCapacity += room.CAPACITY_MAX;
			}
			return isBetween;
		});
		var occupancyAverage = parseInt((totalCapacityObserved/totalMaxCapacity) * 100, 10);
		var timeSlot = openTime + "-" + closeTime;
		averageOccupancyTotalOffice.push({
			TIME_SLOT: timeSlot,
			OCCUPANCY_AVG: (occupancyAverage > 0) ? occupancyAverage : 0 
		});
		openTimeCounter++;
	}
	return averageOccupancyTotalOffice;
}

function getOfficeTotalMaxEmployees() {
	var totalOfficeMaxEmployeeAllowed = 0;
	var query2 = 'SELECT SUM("CAPACITY_MAX") AS TOTLAL_MAX_CAPACITY FROM "IN2128_HDI_OFFICEORACLE_HDB_1"."OfficeOracle.OfficeOracle.hdb.mockdata::Room"';
	statement2 = connection.prepareStatement(query2);
	resultSet2 = statement2.executeQuery();

	if (resultSet2.next()) {
		totalOfficeMaxEmployeeAllowed = resultSet2.getNString(1);
	}
	return totalOfficeMaxEmployeeAllowed;
}

function doGet() {
	try {
		if(!day || day === "" || !validDay) {
			throw new Error("Please provide valid day ex: Mon");
		}
		$.response.contentType = "application/json";
		var responseData = {
			popularTimeTotalOffice: getPopularTimeTotalOfficeData(),
			officeMaxAllowedEmployees: getOfficeTotalMaxEmployees()
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