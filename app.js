const express = require("express");
const path = require("path");
const session = require("express-session");
// const csrf = require("csurf");
const multer = require("multer");
const flash = require("connect-flash");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const dotenv = require("dotenv");

dotenv.config();

const SequelizeStore = require("connect-session-sequelize")(session.Store);

// Route Imports
const shopRoutes = require("./routes/shop");
const adminRoutes = require("./routes/admin");
const errorControllers = require("./controllers/error");
const authRoutes = require("./routes/auth");

// Database Imports
const sequelize = require("./util/database");
const Product = require("./models/product");
const User = require("./models/user");
const Cart = require("./models/cart");
const CartItem = require("./models/cart-items");
const Order = require("./models/order");
const OrderItem = require("./models/order-items");
const Rating = require("./models/rating");

const app = express();
// const csrfProtection = csrf();

app.set("view engine", "ejs");
app.set("views", "views");

const fileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "images");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const filter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const store = new SequelizeStore({
  db: sequelize,
});

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images")));
app.use("/store/images", express.static(path.join(__dirname, "images")));
app.use(multer({ storage: fileStorage, fileFilter: filter }).single("image"));

app.use(
  session({
    store: store,
    secret: "my secret",
    saveUninitialized: false,
    resave: false,
  })
);

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findByPk(req.session.user.id)
    .then((user) => {
      req.user = user;
      return next();
    })
    .catch((error) => {
      console.log(error);
    });
});

app.use(flash());
app.use((req, res, next) => {
  res.locals.isLogged = req.session.isLoggedIn;
  next();
});

app.use(helmet());
app.use(compression());
app.use(morgan("dev"));

app.use(adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);
app.use(errorControllers.get404);

app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.statusCode || 500).send(err.message);
});

User.hasMany(Product, { onDelete: "CASCADE", constraints: true });
Product.belongsTo(User);
User.hasOne(Cart);
Cart.belongsTo(User);
User.hasMany(Order);
Order.belongsTo(User);
Product.belongsToMany(Cart, { through: CartItem });
Cart.belongsToMany(Product, { through: CartItem });
Product.belongsToMany(Order, { through: OrderItem });
Order.belongsToMany(Product, { through: OrderItem });
Product.hasMany(Rating, { onDelete: "CASCADE", constraints: true });
Rating.belongsTo(Product);

sequelize
  .sync()
  .then(() => {
    app.listen(process.env.PORT || 3000);
  })
  .catch((error) => {
    console.log(error);
  });
