const catchAsync = require("../utils/catchAsync");
const jwt = require("jsonwebtoken");
const mysql = require("mysql");
const bcrypt = require("bcryptjs");
const { production } = require("../db.config");

const connection = mysql.createPool(production);

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
    },
    "SECRET_KEY",
    { expiresIn: "1h" }
  );
};

module.exports.search = catchAsync(async (req, res, next) => {
  const { prefix } = req.body;
  connection.query(
    `select username,email,user_id from users where username like "%${prefix}%"`,
    function (err, result, _) {
      res.send(result);
    }
  );
});

module.exports.login = catchAsync(async (req, res, next) => {
  const { username, password } = req.body;
  connection.query(
    `SELECT * FROM users where username="${username}"`,
    async function (err, result, _) {
      if (result[0]) {
        const match = await bcrypt.compare(password, result[0].pass);

        if (match) {
          const token = generateToken({
            username: result[0].username,
            email: result[0].email,
            id: result[0].user_id,
          });
          res.send({ ...result[0], match, token });
        } else {
          res.send({ error: ["Username or password are incorrect"] });
        }
      } else {
        res.send({ error: ["Username or password are incorrect"] });
      }
    }
  );
});

module.exports.register = catchAsync(async (req, res, next) => {
  const { username, email, password, confirmPassword, teacher_code } = req.body;

  if (password !== confirmPassword) {
    res.send({ error: "Passwords don't match!" });
    return;
  }
  let is_teacher = false;
  // if (teacher_code !== "") {
  //   if (teacher_code !== "TEACHER") {
  //     res.send({ error: "Teacher code is wrong!" });
  //     return;
  //   } else {
  //     is_teacher = true;
  //   }
  // }

  console.log(username, password);
  const hashPassword = await bcrypt.hash(password, 12);
  connection.query(
    `INSERT INTO users(email,username,pass,isTeacher) values("${email}","${username}","${hashPassword}",${is_teacher})`,
    function (err, result, _) {
      if (err) {
        console.log(err);
        res.send({ error: ["Duplicate key", err.message] });
      } else {
        console.log("result");
        console.log(result);

        const token = generateToken({
          username,
          email,
          id: result.insertId,
        });
        let insertId = result.insertId;
        res.send({
          insertId,
          username,
          email,
          token,
          is_teacher,
        });
      }
    }
  );
});
