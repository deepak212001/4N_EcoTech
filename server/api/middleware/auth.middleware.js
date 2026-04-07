import jwt from "jsonwebtoken";
import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";

const verifyAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  const token =
    (header && header.startsWith("Bearer ") && header.slice(7)) ||
    req.cookies?.token;
  if (!token) {
    throw new ApiError(401, "Authentication required");
  }
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.TOKEN_SECRET);
  } catch {
    throw new ApiError(401, "Invalid or expired token");
  }
  const user = await User.findById(decoded.id);
  if (!user) {
    throw new ApiError(401, "User no longer exists");
  }
  req.user = user;
  next();
});

export {verifyAuth};
