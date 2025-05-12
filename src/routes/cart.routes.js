const {
  addToCart,
  getCart,
  clearCart,
  updateCartItem,
  removeFromCart,
} = require("../controllers/cart.controller");
const verifyJWT = require("../middlewares/auth.middleware");

const router = require("express").Router();

router.use(verifyJWT);
router.post("/", addToCart);
router.get("/", getCart);
router.delete("/clear_cart", clearCart);
router.patch("/:productId", updateCartItem);
router.delete("/:productId", removeFromCart);

module.exports = router;
