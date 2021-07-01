const jwt = require("jsonwebtoken");

module.exports.verifyToken = (req, res, next) => {
  if (req.headers.authorization === undefined) {
    res.send({ error: "You are not authenticated!" });
  } else {
    try {
      const user = jwt.verify(
        req.headers.authorization.split(" ")[1],
        "SECRET_KEY"
      );
      req.body.user_id = user.id;
      next();
    } catch (e) {
      res.send({ error: e.message });
    }
  }
};
