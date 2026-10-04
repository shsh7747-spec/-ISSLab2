import express from "express";

import sleep from "./utils/sleep.js";
import db from "./utils/db.js";
import {
  generateRandomness,
  HMAC,
  KDF,
  checkPassword,
} from "./utils/crypto.js";

const router = express.Router();

function render(req, res, page, title, errorMsg = false, result = null) {
  res.render("layout/template", {
    page,
    title,
    loggedIn: req.session.loggedIn,
    account: req.session.account,
    errorMsg,
    result,
  });
}

router.get("/", (req, res) => {
  render(req, res, "index", "Bitbar Home");
});

router.post("/set_profile", (req, res) => {
  req.session.account.profile = req.body.new_profile;
  const query = db.prepare(
    `UPDATE Users SET profile = ? WHERE username = '${req.session.account.username}';`,
  );
  query.run(req.body.new_profile);
  render(req, res, "index", "Bitbar Home");
});

router.get("/login", (req, res) => {
  render(req, res, "login/form", "Login");
});

router.get("/get_login", (req, res) => {
  const query = db.prepare(
    `SELECT * FROM Users WHERE username == '${req.query.username}';`,
  );
  const result = query.get();
  if (result && checkPassword(req.query.password, result)) {
    // if username and password are valid
    sleep(1000);
    req.session.loggedIn = true;
    req.session.account = result;
    render(req, res, "login/success", "Bitbar Home");
    return;
  }
  render(
    req,
    res,
    "login/form",
    "Login",
    "This username and password combination does not exist!",
  );
});

router.get("/register", (req, res) => {
  render(req, res, "register/form", "Register");
});

router.post("/post_register", (req, res) => {
  let query = db.prepare(
    `SELECT * FROM Users WHERE username == '${req.body.username}';`,
  );
  let result = query.get();
  if (result && result.username === req.body.username) {
    // if username exists
    render(
      req,
      res,
      "register/form",
      "Register",
      "This username already exists!",
    );
    return;
  }
  const salt = generateRandomness();
  const hashedPassword = KDF(req.body.password, salt);
  query = db.prepare(
    `INSERT INTO Users(username, hashedPassword, salt, profile, bitbars) VALUES(?, ?, ?, ?, ?)`,
  );
  query.run(req.body.username, hashedPassword, salt, "", 100);
  req.session.loggedIn = true;
  req.session.account = {
    username: req.body.username,
    hashedPassword,
    salt,
    profile: "",
    bitbars: 100,
  };
  render(req, res, "register/success", "Bitbar Home");
});

router.get("/close", (req, res) => {
  if (req.session.loggedIn == false) {
    render(
      req,
      res,
      "login/form",
      "Login",
      "You must be logged in to use this feature!",
    );
    return;
  }
  const query = db.prepare(
    `DELETE FROM Users WHERE username == '${req.session.account.username}';`,
  );
  query.run();
  req.session.loggedIn = false;
  req.session.account = {};
  render(req, res, "index", "Bitbar Home", "Deleted account successfully!");
});

router.get("/logout", (req, res) => {
  req.session.loggedIn = false;
  req.session.account = {};
  render(req, res, "index", "Bitbar Home", "Logged out successfully!");
});

router.get("/profile", (req, res) => {
  if (req.session.loggedIn == false) {
    render(
      req,
      res,
      "login/form",
      "Login",
      "You must be logged in to use this feature!",
    );
    return;
  }

  if (req.query.username != null) {
    // if visitor makes a search query
    const query = db.prepare(
      `SELECT * FROM Users WHERE username == '${req.query.username}';`,
    );
    const result = query.get();
    if (result) {
      // if user exists
      render(req, res, "profile/view", "View Profile", false, result);
    } else {
      // user does not exist
      render(
        req,
        res,
        "profile/view",
        "View Profile",
        `${req.query.username} does not exist!`,
        req.session.account,
      );
    }
  } else {
    // visitor did not make query, show them their own profile
    render(
      req,
      res,
      "profile/view",
      "View Profile",
      false,
      req.session.account,
    );
  }
});

router.get("/transfer", (req, res) => {
  if (req.session.loggedIn == false) {
    render(
      req,
      res,
      "login/form",
      "Login",
      "You must be logged in to use this feature!",
    );
    return;
  }
  render(req, res, "transfer/form", "Transfer Bitbars", false, {
    receiver: null,
    amount: null,
  });
});

router.post("/post_transfer", (req, res) => {
  if (req.session.loggedIn == false) {
    render(
      req,
      res,
      "login/form",
      "Login",
      "You must be logged in to use this feature!",
    );
    return;
  }

  if (req.body.destination_username === req.session.account.username) {
    render(
      req,
      res,
      "transfer/form",
      "Transfer Bitbars",
      "You cannot send money to yourself!",
      { receiver: null, amount: null },
    );
    return;
  }

  let query = db.prepare(
    `SELECT * FROM Users WHERE username == '${req.body.destination_username}';`,
  );
  const receiver = query.get();
  if (receiver) {
    // if user exists
    const amount = parseInt(req.body.quantity);
    if (
      Number.isNaN(amount) ||
      amount > req.session.account.bitbars ||
      amount <= 0
    ) {
      render(
        req,
        res,
        "transfer/form",
        "Transfer Bitbars",
        "Invalid transfer amount!",
        { receiver: null, amount: null },
      );
      return;
    }

    req.session.account.bitbars -= amount;
    query = db.prepare(
      `UPDATE Users SET bitbars = '${req.session.account.bitbars}' WHERE username == '${req.session.account.username}';`,
    );
    query.run();
    const receiverNewBal = receiver.bitbars + amount;
    query = db.prepare(
      `UPDATE Users SET bitbars = '${receiverNewBal}' WHERE username == '${receiver.username}';`,
    );
    query.run();
    render(req, res, "transfer/success", "Transfer Complete", false, {
      receiver,
      amount,
    });
  } else {
    // user does not exist
    let q = req.body.destination_username;
    if (q == null) q = "";

    let oldQ;
    while (q !== oldQ) {
      oldQ = q;
      q = q.replace(/script|SCRIPT|img|IMG/g, "");
    }
    render(
      req,
      res,
      "transfer/form",
      "Transfer Bitbars",
      `User ${q} does not exist!`,
      { receiver: null, amount: null },
    );
  }
});

// steal cookie endpoint (DO NOT CHANGE)
router.get("/steal_cookie", (req, res) => {
  let stolenCookie = req.query.cookie;
  console.log("\n\n" + stolenCookie + "\n\n");
  res.end();
});

// steal password endpoint (DO NOT CHANGE)
router.get("/steal_password", (req, res) => {
  console.log(
    `\n\nPassword: ${req.query.password}, time elapsed: ${req.query.timeElapsed}\n\n`,
  );
  res.end();
});

// db dump endpoint (DO NOT CHANGE)
router.get("/db_dump", (_, res) => {
  res.setHeader("Content-Type", "application/json");
  const query = db.prepare(`SELECT * FROM Users;`);
  const result = query.all();
  res.send(JSON.stringify(result, null, 2));
});

export default router;
