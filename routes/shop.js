const express = require("express");

const shopControllers = require("../controllers/shop");
const isAuth = require("../middleware/check");

const router = express.Router();

router.get("/faq", shopControllers.getFaq);

router.get("/", shopControllers.getIndex);

router.get("/store", shopControllers.getProducts);

router.post("/cart", isAuth, shopControllers.postCart);

router.get("/cart", isAuth, shopControllers.getCart);

router.get("/product-details/:productId", shopControllers.getProduct);

router.post("/delete-cart-product", isAuth, shopControllers.postCartDelete);

router.post("/orders", isAuth, shopControllers.postOrder);

router.get("/orders", isAuth, shopControllers.getOrder);

router.get("/store/:category", shopControllers.getCategory);

module.exports = router;
