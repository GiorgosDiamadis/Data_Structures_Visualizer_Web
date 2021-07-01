const express = require("express");
const cors = require("cors");
const app = express();
const mysql = require("mysql");
const workspaceRoutes = require("./Routes/workspaceRoutes");
const userRoutes = require("./Routes/userRoutes");
const path = require("path");
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ extended: false }));

app.use(express.static(path.join(__dirname, "build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.use("/workspace", workspaceRoutes);
app.use("/user", userRoutes);
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
