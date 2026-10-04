import express from "express";
import path from "path";
import cookieSession from "cookie-session";
import logger from "morgan";

import router from "./router.js";

const app = express();
const DEFAULT_PORT = 3000;
const dirname = path.resolve();

// view engine setup
app.set("views", path.join(dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(dirname, "public")));

// adjust CORS policy (DO NOT CHANGE)
app.use((_, res, next) => {
  res.header("Access-Control-Allow-Origin", "null");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

// set lax cookie policies (DO NOT CHANGE)
app.use(
  cookieSession({
    name: "session",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    signed: false,
    sameSite: false,
    httpOnly: false,
  }),
);

// initialize session if necessary
app.use((req, res, next) => {
  if (req.session.loggedIn == undefined) {
    req.session.loggedIn = false;
    req.session.account = {};
  }
  next();
});

app.use(router);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error("Not Found");
  err.status = 404;
  err.path = req.originalUrl;
  next(err);
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // log the error
  console.error(err);

  // render the error page
  res.status(err.status || 500);
  res.render("pages/error");
});

// run server
app.listen(process.env.PORT || DEFAULT_PORT, () => {
  console.log(
    `Visit http://localhost:${
      process.env.PORT || DEFAULT_PORT
    } to access the app.`,
  );
  console.log("Press Ctrl+C to stop the server.");
});

// handle exit
process.on("SIGINT", function () {
  console.log("\nQuitting server...");
  process.exit();
});
