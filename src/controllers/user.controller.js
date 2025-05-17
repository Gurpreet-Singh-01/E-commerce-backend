const { COOKIE_OPTIONS } = require("../constants");
const User = require("../models/user.model");
const APIError = require("../utils/API_utilities/APIError");
const APIResponse = require("../utils/API_utilities/APIResponse");
const asyncHandler = require("../utils/API_utilities/asyncHandler");
const transporter = require("../utils/services/nodemailer_config");
const JWT = require("jsonwebtoken");
const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new APIError(
      500,
      "Something went wrong while creating access and refresh token"
    );
  }
};

const register_user = asyncHandler(async (req, res) => {
  const { name, email, password, gender, phone } = req.body;

  if (
    [name, email, password, gender, phone].some((field) => field.trim() === "")
  )
    throw new APIError(401, "All fields are required");

  const isExistingUser = await User.findOne({ email });

  if (isExistingUser)
    throw new APIError(409, "User with this email already exists!");

  const newUser = await User.create({
    name,
    email,
    password,
    gender,
    phone,
    role: "customer",
  });
  const otp = await newUser.generateEmailVerificationOTP();

  const createdUser = await User.findById(newUser._id).select(
    "name email role gender"
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
  const { email, otp } = req.body;
  const existingUser = await User.findOne({ email });

  if (!existingUser) throw new APIError(404, "User does not exist");
  const stringOtp = String(otp);
  const isValid = await existingUser.verifyEmailVerificationOTP(stringOtp);
  if (!isValid) throw new APIError(401, "Invalid Otp or Otp Expired");

  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(existingUser._id);

  const loggedInUser = await User.findById(existingUser._id).select(
    "-password -refreshToken"
  );
  if (!loggedInUser) throw new APIError(500, "Something went wrong");

  return res
    .cookie("accessToken", accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 1000 * 60 * 60 * 2,
    })
    .cookie("refreshToken", refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 1000 * 60 * 60 * 24 * 5,
    })
    .status(200)
    .json(
      new APIResponse(
        200,
        { user: loggedInUser },
        "Email Verification Successfull"
      )
    );
});

const login_user = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    throw new APIError(400, "Email or Password is required");
  const user = await User.findOne({ email });
  if (!user) throw new APIError(404, "User not found");

  const isMatched = await user.isPasswordCorrect(password);
  if (!isMatched) throw new APIError(401, "Invalid Credentials");

  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!loggedInUser) throw new APIError(500, "Something went wrong");

  return res
    .status(200)
    .cookie("accessToken", accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 1000 * 60 * 60 * 2,
    })
    .cookie("refreshToken", refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 1000 * 60 * 60 * 24 * 5,
    })
    .json(
      new APIResponse(
        200,
        {
          user: loggedInUser,
        },
        "User logged in successfully"
      )
    );
});

const logout_user = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .json(new APIResponse(200, {}, "User logged out successfully"));
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword)
    throw new APIError(400, "Password fields are missing");

  const user = await User.findById(req.user?._id);
  if (!user) throw new APIError(401, "Invalid Access Token");
  const isMatched = await user.isPasswordCorrect(oldPassword);
  if (!isMatched) throw new APIError(401, "Incorrect Password");

  const isSame = await user.isPasswordCorrect(newPassword);
  if (isSame) throw new APIError(400, "New password cannot be same as old");

  user.password = newPassword;
  await user.save();

  return res
    .status(200)
    .json(new APIResponse(200, {}, "Password Changes Successfully"));
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new APIError(400, "Email is required");

  const user = await User.findOne({ email });
  if (!user) throw new APIError(404, "No user found");

  const otp = await user.generatePasswordResetOTP();
  console.log("Password Reset OTP: ", otp);

  const mailOptions = {
    from: process.env.NODEMAILER_USER,
    to: email,
    subject: "Password Reset",
    html: `<div style="max-width: 500px; margin: auto; padding: 20px; background: #ffffff; border: 1px solid #ddd; border-radius: 10px; font-family: Arial, sans-serif;">
    <h2 style="text-align: center; color: #333;">Password Reset</h2>
    <p style="font-size: 16px; color: #555;">
      Hello, ${user.name}<br/><br/>
      Your One-Time Password (OTP) for password reset is:
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

  transporter.sendMail(mailOptions);

  return res
    .status(200)
    .json(new APIResponse(200, {}, "Password Reset Otp sent successfully"));
});

const passwordReset = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword)
    throw new APIError(400, "All fields are required");

  const user = await User.findOne({ email });
  if (!user) throw new APIError(404, "User not found");

  const isSame = await user.isPasswordCorrect(newPassword);
  if (isSame) throw new APIError(400, "New password cannot be same as old");

  const stringOtp = String(otp);
  const isValid = await user.verifyPasswordResetOTP(stringOtp);
  if (!isValid) throw new APIError(400, "Invalid or Expired OTP");

  user.password = newPassword;
  user.refreshToken = undefined;
  await user.save();

  return res
    .status(200)
    .json(
      new APIResponse(
        200,
        {},
        "Password reset successful. Please log in again with your new password."
      )
    );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) throw new APIError(401, "Unauthorized Token");

  try {
    const decodedToken = JWT.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET_KEY
    );

    if (!decodedToken) throw new APIError(401, "Unauthorized Access");
    const user = await User.findById(decodedToken?._id);

    if (!user) throw new APIError(401, "Invalid Token");

    if (incomingRefreshToken !== user.refreshToken)
      throw new APIError(400, "Refresh Token is expired or used");

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessTokenAndRefreshToken(user._id);

    user.refreshToken = newRefreshToken;

    await user.save({ validateBeforeSave: false });
    const updatedUser = await User.findById(user._id).select(
      "name email role gender"
    );
    return res
      .status(200)
      .cookie("accessToken", accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 1000 * 60 * 60 * 2,
      })
      .cookie("refreshToken", newRefreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: 1000 * 60 * 60 * 24 * 5,
      })
      .json(
        new APIResponse(
          200,
          {
            user: updatedUser,
          },
          "Tokens generated successfully"
        )
      );
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new APIError(401, "Refresh token expired");
    }
    throw new APIError(401, error.message || "Invalid refresh token");
  }
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const { name, phone, gender } = req.body;
  const user = await User.findById(req.user?._id);
  if (!user) throw new APIError(401, "Invalid Access token");

  if (name) user.name = name;
  if (gender) user.gender = gender;
  if (phone) user.phone = phone;
  await user.save();
  const updatedUser = await User.findById(user._id).select(
    "name email gender phone role"
  );
  if (!updatedUser) throw new APIError(500, "Something went wrong");
  return res.status(200).json(
    new APIResponse(
      200,
      {
        user: updatedUser,
      },
      "User updated successfully"
    )
  );
});

const addAddress = asyncHandler(async (req, res) => {
  const {
    houseNumber,
    street,
    colony,
    city,
    state,
    country,
    postalCode,
    isDefault,
  } = req.body;
  if (
    !houseNumber ||
    !street ||
    !city ||
    !state ||
    !colony ||
    !country ||
    !postalCode
  ) {
    throw new APIError(
      400,
      "House number, street, colony, city, state, country, and postal code are required"
    );
  }

  const trimmedAddress = {
    houseNumber: houseNumber?.trim(),
    street: street.trim(),
    colony: colony.trim(),
    city: city.trim(),
    state: state.trim(),
    country: country.trim(),
    postalCode: postalCode.trim(),
    isDefault: isDefault || false,
  };
  if (
    !trimmedAddress.houseNumber ||
    !trimmedAddress.street ||
    !trimmedAddress.colony ||
    !trimmedAddress.city ||
    !trimmedAddress.state ||
    !trimmedAddress.country ||
    !trimmedAddress.postalCode
  ) {
    throw new APIError(400, "Address fields cannot be empty");
  }

  const user = await User.findById(req.user?._id);
  if (!user) throw new APIError(401, "Invalid Access token");

  if (user.address.length >= 5) {
    throw new APIError(400, "Cannot add more than 5 addresses");
  }

  if (trimmedAddress.isDefault) {
    user.address.forEach((addr) => (addr.isDefault = false));
  }

  user.address.push(trimmedAddress);

  await user.save();

  return res
    .status(201)
    .json(
      new APIResponse(
        201,
        user.address[user.address.length - 1],
        "Address added successfully"
      )
    );
});

const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id).select(
    "name email gender phone address role"
  );
  if (!user) throw new APIError(401, "Invalid Access Token");
  return res
    .status(200)
    .json(new APIResponse(200, user, "User fetched Successfully"));
});

const updateAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id);
  if (!user) throw new APIError(401, "Invalid Access Token");

  const { id } = req.params;
  const {
    houseNumber,
    street,
    colony,
    city,
    state,
    country,
    postalCode,
    isDefault,
  } = req.body;

  // Check if at least one field is provided
  if (
    !houseNumber &&
    !street &&
    !colony &&
    !city &&
    !state &&
    !country &&
    !postalCode &&
    isDefault === undefined
  ) {
    throw new APIError(400, "At least one address field must be provided");
  }

  const address = user.address.id(id);
  if (!address) {
    throw new APIError(404, "Address not found");
  }

  // Validate and update provided fields
  if (houseNumber) {
    const trimmed = houseNumber.trim();
    if (!trimmed) throw new APIError(400, "House number cannot be empty");
    address.houseNumber = trimmed;
  }
  if (street) {
    const trimmed = street.trim();
    if (!trimmed) throw new APIError(400, "Street cannot be empty");
    address.street = trimmed;
  }
  if (colony) {
    const trimmed = colony.trim();
    if (!trimmed) throw new APIError(400, "Colony cannot be empty");
    address.colony = trimmed;
  }
  if (city) {
    const trimmed = city.trim();
    if (!trimmed) throw new APIError(400, "City cannot be empty");
    address.city = trimmed;
  }
  if (state) {
    const trimmed = state.trim();
    if (!trimmed) throw new APIError(400, "State cannot be empty");
    address.state = trimmed;
  }
  if (country) {
    const trimmed = country.trim();
    if (!trimmed) throw new APIError(400, "Country cannot be empty");
    address.country = trimmed;
  }
  if (postalCode) {
    const trimmed = postalCode.trim();
    if (!trimmed) throw new APIError(400, "Postal code cannot be empty");
    address.postalCode = trimmed;
  }
  if (isDefault !== undefined) {
    if (isDefault) {
      user.address.forEach((addr) => (addr.isDefault = false));
    }
    address.isDefault = isDefault;
  }

  await user.save();

  return res
    .status(200)
    .json(new APIResponse(200, address, "Address updated successfully"));
});
const deleteAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(req.user?._id);
  if (!user) throw new APIError(401, "Invalid Access token");

  const isAddress = user.address.id(id);
  if (!isAddress) throw new APIError(404, "Address not found");

  user.address.pull(id);
  await user.save();

  return res
    .status(200)
    .json(new APIResponse(200, {}, "Address deleted successfully"));
});

module.exports = {
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
};
