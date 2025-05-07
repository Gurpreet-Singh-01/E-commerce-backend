const {
  register_user,
  verify_user,
  login_user,
  logout_user,
  changeCurrentPassword,
  forgotPassword,
  passwordReset,
  refreshAccessToken,
  updateUserProfile,
  addAddress,
  getUserProfile,
  updateAddress,
  deleteAddress,
} = require("../controllers/user.controller");
const verifyJWT = require("../middlewares/auth.middleware");

const router = require("express").Router();

router.post("/register_user", register_user);
router.post("/verify_user", verify_user);
router.post("/login_user", login_user);
router.get("/logout_user", verifyJWT, logout_user);
router.post("/change_password", verifyJWT, changeCurrentPassword);
router.post("/forgot_password", forgotPassword);
router.post("/reset_password", passwordReset);
router.post("/refresh_access_token", verifyJWT, refreshAccessToken);
router.post("/update_userProfile", verifyJWT, updateUserProfile);
router.post("/add_address", verifyJWT, addAddress);
router.get("/user", verifyJWT, getUserProfile);
router.patch("/update_address/:id", verifyJWT, updateAddress);
router.delete("/delete_address/:id", verifyJWT, deleteAddress);

module.exports = { router };
