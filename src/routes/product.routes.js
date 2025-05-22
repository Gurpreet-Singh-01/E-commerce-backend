const {
  addProduct,
  updateProduct,
  deleteProduct,
  getProducts,
  getProductByCategory,
  getProductByID,
} = require("../controllers/product.controller");
const verifyJWT = require("../middlewares/auth.middleware");
const upload = require("../middlewares/multer.middleware");
const restrictToAdmin = require("../middlewares/restrictToAdmin.middleware");

const router = require("express").Router();

// Protected Admin only Routes

router.get("/", getProducts);
router.get("/:id", getProductByID);

router.post(
  "/",
  upload.single("image"),
  verifyJWT,
  restrictToAdmin,
  addProduct
);
router.patch(
  "/:id",
  upload.single("image"),
  verifyJWT,
  restrictToAdmin,
  updateProduct
);
router.delete("/:id", verifyJWT, restrictToAdmin, deleteProduct);

module.exports = router;
