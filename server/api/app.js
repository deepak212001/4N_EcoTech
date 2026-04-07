import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import {ApiError} from "./utils/ApiError.js";

import authRouter from "./routes/auth.route.js";
import providerRouter from "./routes/provider.route.js";
import appointmentRouter from "./routes/appointment.route.js";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/providers", providerRouter);
app.use("/api/appointments", appointmentRouter);

app.use((err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }
  console.error(err);
  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

export {app};
