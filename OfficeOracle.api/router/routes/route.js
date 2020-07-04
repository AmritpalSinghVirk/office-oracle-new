/*eslint no-console: 0, no-unused-vars: 0, no-shadow: 0, new-cap: 0*/
/*eslint-env node, es6 */
"use strict";
var express = require("express");

var statement = `
INSERT INTO "OfficeOracle.OfficeOracle.hdb.data::Occupant"("OID","TIMESTAMP","POSX","POSY","RID") 
VALUES(?,?,?,?,?);
`;

var insertData = function(client, res) {
	client.prepare(statement, function (err, statement) {
		if (err) {
    		console.error('Prepare error:', err);
    		res.type("text/plain").status(500).send(err);
    		return;
		}
		statement.exec([
			0, new Date().toISOString(), 20, 20, 1
		], function(err, affectedRows) {
			if (err) {
				res.type("text/plain").status(500).send(err);
				return;
			}
			res.type("text/plain").status(200).send("Success");
		});
	});
};

module.exports = function() {
	var app = express.Router();

	//Hello Router
	app.get("/", (req, res) => {
		let client = req.db;
		insertData(client, res);
	});
	return app;
};