const express = require("express");
const { createGroup } = require("../Controllers/teacherControllers");
const { verifyToken } = require("../middleware/middleware");

const router = express.Router();

router.route("/createGroup").post(verifyToken, createGroup);
