const express = require("express");
const { body } = require("express-validator");

const adminControllers = require("../controllers/admin");
const isAuth = require("../middleware/check");

const router = express.Router();

router.get("/account", isAuth, adminControllers.getAccount);

router.get("/add-product", isAuth, adminControllers.getAddProduct);

router.get("/deleted-products", isAuth, adminControllers.getDeletedProducts);

router.post("/hard-delete-product", isAuth, adminControllers.postHardDelete);

router.post("/restore-product", isAuth, adminControllers.postRestoreProduct);

router.post(
  "/add-product",
  [
    body("title", "Title has to be at least 5 characters.").isLength({
      min: 5,
    }),
    body("quantity", "Quantity is required.").custom((value, { req }) => {
      if (!Number.isInteger(+value)) {
        console.log(value);
        return false;
      }
      return true;
    }),
    body("price", "Price is required.").custom((value, { req }) => {
      if (!value) {
        return false;
      }
      return true;
    }),
    body(
      "shortDesc",
      "Short description cannot be more than 140 characters long."
    ).isLength({ max: 140, min: 20 }),
    body(
      "fullDesc",
      "Full description has to be at least 100 characters long."
    ).isLength({ min: 100 }),
    body("category", "Category field is required.").custom((value, { req }) => {
      if (!value) {
        return false;
      }
      return true;
    }),
  ],
  isAuth,
  adminControllers.postAddProduct
);

router.get("/products", isAuth, adminControllers.getProducts);

router.post("/delete-product", isAuth, adminControllers.postDeleteProduct);

router.get("/edit-product/:productId", isAuth, adminControllers.getEditProduct);

router.post(
  "/edit-product",
  [
    body("title", "Title has to be at least 5 characters.").isLength({
      min: 5,
    }),
    body("quantity", "Quantity is required.").custom((value, { req }) => {
      if (!Number.isInteger(+value)) {
        console.log(value);
        return false;
      }
      return true;
    }),
    body("price", "Price is required.").custom((value, { req }) => {
      if (!value) {
        return false;
      }
      return true;
    }),
    body(
      "shortDesc",
      "Short description cannot be more than 140 characters long."
    ).isLength({ max: 140, min: 20 }),
    body(
      "fullDesc",
      "Full description has to be at least 100 characters long."
    ).isLength({ min: 100 }),
  ],
  isAuth,
  adminControllers.postEditProduct
);

router.get("/product/:productId", isAuth, adminControllers.getProduct);

module.exports = router;
