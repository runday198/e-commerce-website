const bcrypt = require("bcrypt");
const { validationResult } = require("express-validator");
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");
const crypto = require("crypto");
const dotenv = require("dotenv");

dotenv.config();

const Api404Error = require("../error/api404Error");
const Api500Error = require("../error/api500Error");
const Api400Error = require("../error/api400Error");

const { Op } = require("sequelize");

const transporter = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      api_key: process.env.SENDGRID_API_KEY,
    },
  })
);

const User = require("../models/user");

exports.getReset = (req, res, next) => {
  res.render("auth/reset", {
    pageTitle: "Reset Password",
    path: "/reset",
    validation: true,
  });
};

exports.postReset = async (req, res, next) => {
  const email = req.body.email;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render("auth/reset", {
      path: "/reset",
      pageTitle: "Reset Password",
      validation: false,
      errors: errors.mapped(),
      oldInput: {
        email: email,
      },
    });
  }
  try {
    const user = await User.findOne({ where: { email: email } });
    crypto.randomBytes(32, (err, buffer) => {
      const token = buffer.toString("hex");
      user.resetToken = token;
      user.resetTokenExpiration = Date.now() + 3600000;
      user.save();
      res.redirect("/login");
      transporter.sendMail({
        to: user.email,
        from: process.env.USER_EMAIL,
        subject: "Reset Password",
        html: `
        <p>You have requested password reset.</p>
        <p>To reset your password, please follow the <a href="http://localhost:3000/reset/${token}">link</a></p>
        `,
      });
    });
  } catch (err) {
    const error = new Api404Error(err);
    return next(error);
  }
};

exports.getNewPassword = async (req, res, next) => {
  const token = req.params.token;
  console.log(token);
  try {
    const user = await User.findOne({
      where: {
        resetToken: token,
        resetTokenExpiration: { [Op.gte]: Date.now() },
      },
    });
    if (!user) {
      throw new Error("No User found");
    }
    return res.render("auth/new-password", {
      path: "/reset",
      pageTitle: "Reset Password",
      token: token,
      userId: user.id,
      validation: true,
      errors: null,
    });
  } catch (err) {
    const error = new Api404Error(err);
    return next(error);
  }
};

exports.postNewPassword = async (req, res, next) => {
  const token = req.body.token;
  const userId = req.body.userId;
  const newPassword = req.body.password;
  const confirmPassword = req.body.confirmPassword;

  const errors = validationResult(req);

  try {
    const user = await User.findOne({
      where: { id: userId, resetToken: token },
    });
    if (!user) {
      throw new Error("Could not find the user");
    }
    if (!errors.isEmpty()) {
      return res.render("auth/new-password", {
        path: "/reset",
        pageTitle: "Reset Password",
        token: token,
        userId: user.id,
        validation: false,
        errors: errors.mapped(),
        oldInput: {
          password: newPassword,
          confirmPassword: confirmPassword,
        },
      });
    }
    const hashedPass = await bcrypt.hash(newPassword, 12);
    user.password = hashedPass;
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;
    await user.save();
    return res.redirect("/login");
  } catch (err) {
    const error = new Api404Error(err);
    return next(error);
  }
};

exports.getSignup = (req, res, next) => {
  res.render("auth/login", {
    pageTitle: "Sign Up",
    path: "/signup",
    oldInput: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    errors: null,
    validation: true,
  });
};

exports.postSignup = async (req, res, next) => {
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors.mapped());
    return res.status(422).render("auth/login", {
      path: "/signup",
      oldInput: {
        name: name,
        email: email,
        password: password,
        confirmPassword: confirmPassword,
      },
      validation: false,
      pageTitle: "Sign Up",
      errors: errors.mapped(),
    });
  }
  try {
    const user = await User.findOne({ where: { email: email } });
    if (user) {
      throw new Error("Account already exists");
    }
    const hashedPass = await bcrypt.hash(password, 12);
    const newUser = await User.create({
      name: name,
      email: email,
      password: hashedPass,
    });
    await newUser.createCart();
    transporter.sendMail({
      to: email,
      from: process.env.USER_EMAIL,
      subject: "Your car's extended warranty",
      html: "<h1>You have successfully registered</h1>",
    });
    return res.redirect("/login");
  } catch (err) {
    const error = new Api400Error(err);
    return next(error);
  }
};

exports.getLogin = (req, res, next) => {
  let message = req.flash("error");
  let email;
  let password;
  if (message.length > 0) {
    email = message[1];
    password = message[2];
    console.log(email, password);
    console.log(message);
    message = message[0];
  } else {
    message = null;
    email = "";
    password = "";
  }
  res.render("auth/login", {
    pageTitle: "Login",
    path: "/login",
    oldInput: {
      name: "",
      email: email,
      password: password,
      confirmPassword: "",
    },
    message: message,
    validation: true,
  });
};

exports.postLogin = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors);
    return res.render("auth/login", {
      path: "/login",
      pageTitle: "Log In",
      validation: false,
      errors: errors.mapped(),
      oldInput: {
        email: email,
        password: password,
      },
    });
  }

  try {
    const user = await User.findOne({ where: { email: email } });
    const isMatched = await bcrypt.compare(password, user.password);
    if (!isMatched) {
      return res.render("auth/login", {
        path: "/login",
        pageTitle: "Log In",
        validation: false,
        errors: {
          email: {
            msg: "Incorrect email or password",
          },
        },
        oldInput: {
          email: email,
          password: password,
        },
      });
    }
    req.session.user = user;
    req.session.isLoggedIn = true;
    await req.session.save();
    res.redirect("/");
  } catch (err) {
    const error = new Api400Error(err);
    return next(error);
  }
};

exports.getLogout = async (req, res, next) => {
  await req.session.destroy();
  res.redirect("/");
};

exports.getChangePassword = (req, res, next) => {
  res.render("auth/change-password", {
    path: "/change-password",
    pageTitle: "Change Password",
    validation: true,
    errors: null,
  });
};

exports.postChangePassword = async (req, res, next) => {
  const userId = req.user.id;
  if (!userId) {
    throw new Error("Cannot find the ID");
  }
  const oldPassword = req.body.oldPassword;
  const newPassword = req.body.password;
  const confirmPassword = req.body.confirmPassword;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.render("auth/change-password", {
      path: "/change-password",
      pageTitle: "Change Password",
      validation: false,
      errors: errors.mapped(),
      oldInput: {
        oldPassword: oldPassword,
        password: newPassword,
        confirmPassword: confirmPassword,
      },
    });
  }

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error("Could not find the user");
    }
    const hashedPass = await bcrypt.hash(newPassword, 12);
    user.password = hashedPass;
    await user.save();
    return res.redirect("/logout");
  } catch (err) {
    const error = new Api404Error();
    return next(error);
  }
};
