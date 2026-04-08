import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {User} from "../models/user.model.js";
import {Provider} from "../models/provider.model.js";

function userPayload(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: "patient",
    createdAt: user.createdAt,
  };
}

const register = asyncHandler(async (req, res) => {
  console.log(req.body);
  const {name, email, password} = req.body;
  if (!name || !email || !password) {
    throw new ApiError(400, "name, email, and password are required");
  }
  const existing = await User.findOne({email: email.toLowerCase()});
  if (existing) {
    throw new ApiError(409, "Email already registered");
  }
  const asProvider = await Provider.findOne({email: email.toLowerCase()});
  if (asProvider) {
    throw new ApiError(409, "Email already registered as a provider");
  }
  const user = await User.create({
    name,
    email,
    password,
  });
  const token = user.generateToken();
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
  res
    .status(201)
    .cookie("token", token, cookieOptions)
    .json(
      new ApiResponse(
        201,
        {...userPayload(user), token},
        "Registered successfully",
        true
      )
    );
});

const login = asyncHandler(async (req, res) => {
  console.log(req.body);
  const {email, password} = req.body;
  if (!email || !password) {
    throw new ApiError(400, "email and password are required");
  }
  const user = await User.findOne({email: email.toLowerCase()}).select(
    "+password"
  );
  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }
  const ok = await user.comparePassword(password);
  if (!ok) {
    throw new ApiError(401, "Invalid email or password");
  }
  const token = user.generateToken();
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
  res
    .status(200)
    .cookie("token", token, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {...userPayload(user), token},
        "Login successful",
        true
      )
    );
});

const logout = asyncHandler(async (req, res) => {
  res
    .status(200)
    .clearCookie("token")
    .json(new ApiResponse(200, null, "Logged out successfully", true));
});

const getMe = asyncHandler(async (req, res) => {
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        userPayload(req.user),
        "User fetched successfully",
        true
      )
    );
});
export {register, login, logout, getMe};
