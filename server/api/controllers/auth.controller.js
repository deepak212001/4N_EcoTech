import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";

function userPayload(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

const register = asyncHandler(async (req, res) => {
  const {name, email, password} = req.body;
  if (!name || !email || !password) {
    throw new ApiError(400, "name, email, and password are required");
  }
  const existing = await User.findOne({email: email.toLowerCase()});
  if (existing) {
    throw new ApiError(409, "Email already registered");
  }
  const user = await User.create({
    name,
    email,
    password,
  });
  const token = user.generateToken();
  res.status(201).json({
    success: true,
    message: "Registered successfully",
    data: {
      token,
      user: userPayload(user),
    },
  });
});

const login = asyncHandler(async (req, res) => {
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
  res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      token,
      user: userPayload(user),
    },
  });
});

export {register, login};
