const Product = require("../models/product");
const Order = require("../models/order");
const { Op } = require("sequelize");

const Api400Error = require("../error/api400Error");
const Api404Error = require("../error/api404Error");
const Api500Error = require("../error/api500Error");

exports.getIndex = async (req, res, next) => {
  try {
    const products = await Product.findAll();
    res.render("shop/index", {
      path: "/",
      pageTitle: "Home Page",
      products: products,
    });
  } catch (err) {
    const error = new Api500Error(err);
    return next(error);
  }
};

exports.getFaq = (req, res, next) => {
  res.render("shop/faq", {
    path: "/faq",
    pageTitle: "FAQ",
  });
};

exports.getProducts = async (req, res, next) => {
  const page = +req.query.page || 1;
  console.log(page);
  try {
    let totalCount = await Product.count();
    const products = await Product.findAll({
      limit: 5,
      offset: (page - 1) * 5,
      order: [["id", "DESC"]],
      where: {
        storageQuantity: { [Op.gte]: 1 },
      },
    });
    res.render("shop/products", {
      pageTitle: "Store",
      path: "/store",
      products: products,
      currentPage: page,
      hasPreviousPage: page > 1,
      hasNextPage: page < Math.ceil(totalCount / 5),
      nextPage: page + 1,
      previousPage: page - 1,
      lastPage: Math.ceil(totalCount / 5),
      category: false,
    });
  } catch (err) {
    const error = new Api500Error(err);
    return next(error);
  }
};

exports.getCategory = async (req, res, next) => {
  const category = req.params.category;
  const page = +req.query.page || 1;
  try {
    const totalCount = await Product.count({
      where: { category: category },
    });

    const products = await Product.findAll({
      where: { category: category },
      limit: 5,
      offset: (page - 1) * 5,
      order: [["id", "DESC"]],
      where: {
        storageQuantity: { [Op.gte]: 1 },
      },
    });
    res.render("shop/products", {
      path: "/" + category,
      pageTitle: category,
      products: products,
      category: true,
      currentPage: page,
      hasPreviousPage: page > 1,
      hasNextPage: page < Math.ceil(totalCount / 5),
      nextPage: page + 1,
      previousPage: page - 1,
      lastPage: Math.ceil(totalCount / 5),
    });
  } catch (err) {
    const error = new Api500Error(err);
    return next(error);
  }
};

exports.getProduct = async (req, res, next) => {
  const productId = req.params.productId;
  try {
    const product = await Product.findByPk(productId);
    if (!product) {
      throw new Error("No product found!");
    }
    return res.render("shop/product-details", {
      pageTitle: "Details",
      path: "/products",
      product: product,
    });
  } catch (err) {
    const error = new Api404Error(err);
    return next(error);
  }
};

exports.postCart = async (req, res, next) => {
  const productId = req.body.productId;
  let newQuantity = 1;
  try {
    let product = await Product.findByPk(productId);
    if (!product) {
      throw new Error("Could not find the product");
    }
    const cart = await req.user.getCart();
    const existingProducts = await cart.getProducts({
      where: { id: productId },
    });
    let oldProduct;
    if (existingProducts.length > 0) {
      oldProduct = existingProducts[0];
    }

    let oldQuantity;
    if (oldProduct) {
      oldQuantity = oldProduct.cartItem.quantity;
      newQuantity = oldQuantity + 1;
    }

    if (newQuantity > product.storageQuantity) {
      return res.redirect(`/product-details/${productId}`);
    }
    await cart.addProduct(product, {
      through: { quantity: newQuantity },
    });
    return res.redirect("/store");
  } catch (err) {
    const error = new Api400Error(err);
    return next(error);
  }
};

exports.getCart = async (req, res, next) => {
  try {
    const cart = await req.user.getCart();
    const products = await cart.getProducts();
    res.render("shop/cart", {
      pageTitle: "Your Cart",
      path: "/cart",
      products: products,
    });
  } catch (err) {
    const error = new Api500Error(err);
    return next(error);
  }
};

exports.postCartDelete = async (req, res, next) => {
  const productId = req.body.productId;
  try {
    const cart = await req.user.getCart();
    const products = await cart.getProducts({ where: { id: productId } });
    if (products.length < 1) {
      throw new Error("Could not find the product in the cart");
    }
    const product = products[0];
    await product.cartItem.destroy();
    return res.redirect("/cart");
  } catch (err) {
    const error = new Api404Error(err);
    return next(error);
  }
};

exports.postOrder = async (req, res, next) => {
  try {
    const cart = await req.user.getCart();
    const products = await cart.getProducts();
    if (products.length < 1) {
      throw new Error("No items in the cart");
    }
    const order = await req.user.createOrder();
    for (let product of products) {
      product.storageQuantity -= product.cartItem.quantity;
      product.save();
    }
    order.addProducts(
      products.map((product) => {
        product.orderItem = { quantity: product.cartItem.quantity };
        return product;
      })
    );
    await cart.setProducts(null);
    return res.redirect("/cart");
  } catch (err) {
    const error = new Api400Error(err);
    return next(error);
  }
};

exports.getOrder = async (req, res, next) => {
  const page = +req.query.page || 1;
  try {
    const orders = await req.user.getOrders({ include: Product });
    const totalCount = await Order.count({ where: { userId: req.user.id } });
    orders.forEach((order) => {
      let totalPrice = 0;
      order.products.forEach((product) => {
        product.totalPrice = product.price * product.orderItem.quantity;
        totalPrice += product.totalPrice;
      });
      order.totalPrice = totalPrice;
    });
    res.render("shop/orders", {
      pageTitle: "Your Orders",
      path: "/orders",
      orders: orders,
      currentPage: page,
      hasPreviousPage: page > 1,
      hasNextPage: page < Math.ceil(totalCount / 5),
      nextPage: page + 1,
      previousPage: page - 1,
      lastPage: Math.ceil(totalCount / 5),
    });
  } catch (err) {
    const error = new Api500Error(err);
    return next(error);
  }
};
