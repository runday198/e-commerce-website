const express = require("express");
const { body } = require("express-validator");
const bcrypt = require("bcrypt");

const authControllers = require("../controllers/auth");
const isAuth = require("../middleware/check");

const User = require("../models/user");

const router = express.Router();

router.get("/reset", authControllers.getReset);

router.post(
  "/reset",
  [
    body("email").custom(async (value, { req }) => {
      const user = await User.findOne({ where: { email: value } });
      if (!user) {
        return Promise.reject("Could not find the account with this email.");
      }
      return true;
    }),
  ],
  authControllers.postReset
);

router.get("/change-password", isAuth, authControllers.getChangePassword);

router.post(
  "/change-password",
  [
    body("oldPassword")
      .custom(async (value, { req }) => {
        const user = await User.findByPk(req.user.id);
        const isMatched = await bcrypt.compare(value, user.password);
        if (!isMatched) {
          return Promise.reject("Incorrect password");
        }
        return true;
      })
      .withMessage("Incorrect Password"),
    body("password", "Password has to be at least 5 characters").isLength({
      min: 5,
    }),
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        return Promise.reject("Passwords do not match");
      }
      return true;
    }),
  ],
  authControllers.postChangePassword
);

router.get("/reset/:token", authControllers.getNewPassword);

router.post(
  "/new-password",
  [
    body(
      "password",
      "The password has to be at least 5 characters long."
    ).isLength({ min: 5 }),
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        return Promise.reject("Passwords do not match");
      }
      return true;
    }),
  ],
  authControllers.postNewPassword
);

router.get("/signup", authControllers.getSignup);

router.post(
  "/signup",
  [
    body("name", "Username has to be at least 5 characters.").isLength({
      min: 5,
    }),
    body("email")
      .isEmail()
      .withMessage("Invalid email")
      .normalizeEmail()
      .custom(async (value, { req }) => {
        console.log("email: " + value);
        const user = await User.findOne({ where: { email: value } });
        if (user) {
          console.log("GOT HERE");
          return Promise.reject("This email already exists");
        }
        return true;
      })
      .withMessage("This email already exists"),
    body(
      "password",
      "The password has to be at least 5 characters long."
    ).isLength({ min: 5 }),
    body("confirmPassword")
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          return Promise.reject("Passwords do not match");
        }
        return true;
      })
      .withMessage("Passwords do not match."),
  ],
  authControllers.postSignup
);

router.get("/login", authControllers.getLogin);

router.post(
  "/login",
  [
    body("email", "Incorrect email or password.")
      .isEmail()
      .normalizeEmail()
      .custom(async (value, { req }) => {
        const user = await User.findOne({ where: { email: value } });
        console.log(user);
        if (!user) {
          return Promise.reject("Incorrect email or password.");
        }
        return true;
      })
      .withMessage("Incorrect email or password."),
  ],
  authControllers.postLogin
);

router.get("/logout", isAuth, authControllers.getLogout);

module.exports = router;
