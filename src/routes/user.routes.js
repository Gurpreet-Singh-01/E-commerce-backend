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
  resend_otp,
} = require("../controllers/user.controller");
const verifyJWT = require("../middlewares/auth.middleware");
const rateLimit = require('express-rate-limit')
const router = require("express").Router();

const resendOtpLimiter = rateLimit({
  windowMs:  60 * 1000, 
  max: 2, 
  message: 'Too many OTP requests, please try again later',
});

router.post("/register_user", register_user);
router.post('/resend_otp',resendOtpLimiter, resend_otp);
router.post("/verify_user", verify_user);
router.post("/login_user", login_user);
router.get("/logout_user", logout_user);
router.post("/change_password", verifyJWT, changeCurrentPassword);
router.post("/forgot_password", forgotPassword);
router.post("/reset_password", passwordReset);
router.post("/refresh_access_token", refreshAccessToken);
router.post("/update_userProfile", verifyJWT, updateUserProfile);
router.post("/add_address", verifyJWT, addAddress);
router.get("/user", verifyJWT, getUserProfile);
router.patch("/update_address/:id", verifyJWT, updateAddress);
router.delete("/delete_address/:id", verifyJWT, deleteAddress);

module.exports =  router ;
