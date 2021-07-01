const express = require("express");
const { login, register, search } = require("../Controllers/userControllers");
const { verifyToken } = require("../middleware/middleware");
const router = express.Router();

router.route("/login").post(login);
router.route("/register").post(register);
router.route("/search").post(verifyToken, search);

module.exports = router;
