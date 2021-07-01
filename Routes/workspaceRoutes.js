const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/middleware");
const {
  getWorkspaces,
  createWorkspace,
  getWorkspace,
  deleteWorkspace,
  saveDataStructure,
  saveGraph,
  loadGraph,
} = require("../Controllers/workspaceControllers");

router.route("/getWorkspaces").post(verifyToken, getWorkspaces);
router.route("/createWorkspace").post(verifyToken, createWorkspace);
router.route("/getWorkspace").post(verifyToken, getWorkspace);
router.route("/getWorkspace/graph").post(verifyToken, loadGraph);
router.route("/deleteWorkspace").post(verifyToken, deleteWorkspace);
router.route("/saveDataStructure").post(verifyToken, saveDataStructure);
router.route("/saveDataStructure/graph").post(verifyToken, saveGraph);

module.exports = router;
