const catchAsync = require("../utils/catchAsync");
const mysql = require("mysql");
const config = require("../db.config");
const connection = mysql.createConnection(config);

connection.connect();

module.exports.createGroup = catchAsync(async (req, res, next) => {
  const { group_name, user_id } = req.body;

  connection.query(``);
});
