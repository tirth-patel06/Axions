require("dotenv").config();
const express = require("express");
const passport = require("passport");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

require("./config/passport");

const authRoutes = require("./routes/auth");
const testRoutes = require("./routes/test");
const githubRoutes = require("./routes/github");

const app = express();
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(morgan("dev"));
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);
app.use("/api/github", githubRoutes);

module.exports = app;
