const fs = require("fs");
const { Op } = require("sequelize");
const { validationResult } = require("express-validator");

const Api400Error = require("../error/api400Error");
const Api404Error = require("../error/api404Error");
const Api500Error = require("../error/api500Error");

const Product = require("../models/product");

exports.getAccount = (req, res, next) => {
  res.render("admin/account", {
    path: "/account",
    pageTitle: "Your Account",
    user: req.user,
  });
};

exports.getAddProduct = (req, res, next) => {
  res.render("admin/add-product", {
    pageTitle: "Add Product",
    path: "/add-product",
    editMode: false,
    errors: null,
    validation: true,
  });
};

exports.getProduct = async (req, res, next) => {
  const prodId = req.params.productId;
  console.log(req.params);
  console.log(req.params.productId);
  try {
    const product = await Product.findByPk(prodId);
    if (!product) {
      throw new Error("Could not find the product");
    }
    console.log(product);
    return res.render("admin/product-details", {
      pageTitle: product.title,
      path: "/products",
      product: product,
    });
  } catch (err) {
    const error = new Api404Error(err);
    return next(error);
  }
};

exports.postAddProduct = async function (req, res, next) {
  const errors = validationResult(req);
  const title = req.body.title;
  const shortDesc = req.body.shortDesc;
  const fullDesc = req.body.fullDesc;
  const price = req.body.price;
  const quantity = req.body.quantity;
  const category = req.body.category;

  if (!errors.isEmpty()) {
    return res.render("admin/add-product", {
      pageTitle: "Add Product",
      path: "/add-product",
      errors: errors.mapped(),
      oldInput: {
        title: title,
        shortDesc: shortDesc,
        fullDesc: fullDesc,
        quantity: quantity,
        price: price,
        category: category,
      },
      validation: false,
    });
  }
  const image = req.file;
  if (!image) {
    return res.render("admin/add-product", {
      pageTitle: "Add Product",
      path: "/add-product",
      errors: {
        image: {
          msg: "Image is required.",
        },
      },
      oldInput: {
        title: title,
        shortDesc: shortDesc,
        fullDesc: fullDesc,
        quantity: quantity,
        price: price,
        category: category,
      },
      validation: false,
    });
  }
  const imageUrl = image.path;

  try {
    await req.user.createProduct({
      title: title,
      shortDesc: shortDesc,
      fullDesc: fullDesc,
      price: price,
      imageUrl: imageUrl,
      storageQuantity: quantity,
      category: category,
    });
    return res.redirect("/products");
  } catch (err) {
    const error = new Api500Error(err);
    next(error);
  }
};

exports.getProducts = async (req, res, next) => {
  const page = +req.query.page || 1;
  try {
    const totalCount = await Product.count({ where: { userId: req.user.id } });
    const products = await req.user.getProducts({
      limit: 5,
      offset: (page - 1) * 5,
      order: [["id", "DESC"]],
    });
    res.render("admin/products", {
      pageTitle: "Admin Products",
      products: products,
      path: "/products",
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

exports.postDeleteProduct = async (req, res, next) => {
  const prodId = req.body.productId;
  try {
    const product = await Product.findByPk(prodId);
    if (!product) {
      throw new Error("Product not found");
    }
    await product.destroy();
    return res.redirect("/products");
  } catch (err) {
    const error = new Api404Error(err);
    return next(error);
  }
};

exports.getEditProduct = async (req, res, next) => {
  const prodId = req.params.productId;
  try {
    const product = await Product.findByPk(prodId);
    if (!product) {
      throw new Error("Product not found");
    }
    res.render("admin/add-product", {
      pageTitle: product.title,
      path: "/edit-product",
      editMode: true,
      errors: null,
      validation: true,
      product: product,
    });
  } catch (err) {
    const error = new Api404Error(err);
    return next(error);
  }
};

exports.postEditProduct = async (req, res, next) => {
  const prodId = req.body.productId;
  const title = req.body.title;
  const shortDesc = req.body.shortDesc;
  const fullDesc = req.body.fullDesc;
  const quantity = req.body.quantity;
  const price = req.body.price;
  const category = req.body.category;

  const image = req.file;

  try {
    const product = await Product.findByPk(prodId);
    if (!product) {
      throw new Error("Product not found");
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render("admin/add-product", {
        product: product,
        pageTitle: product.title,
        path: "/edit-product",
        editMode: true,
        errors: errors.mapped(),
        validation: false,
        oldInput: {
          title: title,
          quantity: quantity,
          price: price,
          shortDesc: shortDesc,
          fullDesc: fullDesc,
        },
      });
    }
    product.title = title;
    product.shortDesc = shortDesc;
    product.fullDesc = fullDesc;
    product.price = price;
    product.quantity = quantity;
    if (image) {
      let imageUrl = image.path;
      fs.unlink(product.imageUrl, (err) => {
        console.log(err);
      });
      product.imageUrl = imageUrl;
    }
    if (category) {
      product.category = category;
    }
    await product.save();
    return res.redirect("/products");
  } catch (err) {
    const error = new Api404Error(err);
    return next(error);
  }
};

exports.getDeletedProducts = async (req, res, next) => {
  const page = +req.query.page || 1;
  try {
    const products = await req.user.getProducts({
      where: { deletedAt: { [Op.lte]: Date.now() } },
      paranoid: false,
      limit: 5,
      offset: (page - 1) * 5,
    });
    const totalCount = await Product.count({
      where: { userId: req.user.id, deletedAt: { [Op.lte]: Date.now() } },
      paranoid: false,
    });
    res.render("admin/deleted-products", {
      path: "/deleted-products",
      pageTitle: "Deleted Products",
      products: products,
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

exports.postHardDelete = async (req, res, next) => {
  const productId = req.body.productId;
  try {
    const product = await Product.findOne({
      where: { id: productId },
      paranoid: false,
    });
    if (!product) {
      throw new Error("Could not find the product");
    }
    fs.unlink(product.imageUrl, (err) => {
      console.log(err);
    });
    await product.destroy({ force: true });
    return res.redirect("/deleted-products");
  } catch (err) {
    const error = new Api404Error(err);
    return next(error);
  }
};

exports.postRestoreProduct = async (req, res, next) => {
  const productId = req.body.productId;
  try {
    const product = await Product.findOne({
      where: { id: productId },
      paranoid: false,
    });
    if (!product) {
      throw new Error("Could not find the product");
    }
    await product.restore();
    return res.redirect("/deleted-products");
  } catch (err) {
    const error = new Api404Error(err);
    return next(err);
  }
};
