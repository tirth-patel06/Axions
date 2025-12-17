require("dotenv").config();
const express = require("express");
const passport = require("passport");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

require("./config/passport");

const authRoutes = require("./routes/auth");
const testRoutes = require("./routes/test");

const app = express();

app.use(morgan("dev"));
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);

module.exports = app;
