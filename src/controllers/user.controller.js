const User = require("../models/user.model");
const APIError = require("../utils/API_utilities/APIError");
const APIResponse = require("../utils/API_utilities/APIResponse");
const asyncHandler = require("../utils/API_utilities/asyncHandler");
const transporter = require("../utils/services/nodemailer_config");

const register_user = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if ([name, email, password].some((field) => field.trim() === ""))
    throw new APIError(401, "All fields are required");

  const isExistingUser = await User.findOne({ email });

  if (isExistingUser)
    throw new APIError(409, "User with this email already exists!");

  const newUser = await User.create({
    name,
    email,
    password,
  });
  const otp = await newUser.generateEmailVerificationOTP();

  const createdUser = await User.findById(newUser._id)
  .select(
    "name email password role"
  );

  if (!createdUser)
    throw new APIError(500, "Something went wrong while creating user");
  const mailOptions = {
    from: process.env.NODEMAILER_USER,
    to: email,
    subject: "TechTrendz Account Verification",
    html: `<div style="max-width: 500px; margin: auto; padding: 20px; background: #ffffff; border: 1px solid #ddd; border-radius: 10px; font-family: Arial, sans-serif;">
      <h2 style="text-align: center; color: #333;">Email Verification</h2>
      <p style="font-size: 16px; color: #555;">
        Hello, ${name}<br/><br/>
        Your One-Time Password (OTP) for email verification is:
      </p>
      <div style="font-size: 28px; font-weight: bold; color: #007BFF; text-align: center; margin: 20px 0;">
        ${otp}
      </div>
      <p style="font-size: 14px; color: #888;">
        This OTP is valid for the next 10 minutes. Please do not share it with anyone.
      </p>
      <p style="font-size: 14px; color: #aaa; margin-top: 30px;">
        – The TechTrendz Team
      </p>
    </div>`,
  };

  await transporter.sendMail(mailOptions);

  return res
    .status(200)
    .json(new APIResponse(200, createdUser, "User Created Successfully"));
});

const verify_user = asyncHandler(async (req, res) => {
    const {email,otp} = req.body
    const existingUser = await User.findOne({email})

    if(!existingUser) throw new APIError(404,"User does not exist")
    
    existingUser
});

module.exports = {
  register_user,
  verify_user,
};
