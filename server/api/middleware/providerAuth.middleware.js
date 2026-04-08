import jwt from "jsonwebtoken";
import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {Provider} from "../models/provider.model.js";

const verifyProviderAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  const token =
    (header && header.startsWith("Bearer ") && header.slice(7)) ||
    req.cookies?.token;
  console.log('token', token);
  if (!token) {
    throw new ApiError(401, "Authentication required");
  }
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.TOKEN_SECRET);
  } catch {
    throw new ApiError(401, "Invalid or expired token");
  }
  if (decoded.role !== "provider") {
    throw new ApiError(403, "Provider account required");
  }
  const provider = await Provider.findById(decoded.id);
  if (!provider) {
    throw new ApiError(401, "Provider no longer exists");
  }
  req.provider = provider;
  next();
});

export {verifyProviderAuth};
