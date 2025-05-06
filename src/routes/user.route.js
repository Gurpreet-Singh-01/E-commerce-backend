const {
  register_user,
  verify_user,
  login_user,
  logout_user,
} = require("../controllers/user.controller");
const verifyJWT = require("../middlewares/auth.middleware");

const router = require("express").Router();

router.post("/register_user", register_user);
router.post("/verify_user", verify_user);
router.post("/login_user", login_user);
router.get("/logout_user", verifyJWT ,logout_user);

module.exports = { router };
