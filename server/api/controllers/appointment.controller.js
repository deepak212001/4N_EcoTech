import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {Appointment} from "../models/appointment.model.js";
import {Provider} from "../models/provider.model.js";

const bookAppointment = asyncHandler(async (req, res) => {
  const {providerId, date, time} = req.body;
  if (!providerId || !date || !time) {
    throw new ApiError(400, "providerId, date, and time are required");
  }
  const provider = await Provider.findById(providerId);
  if (!provider) {
    throw new ApiError(404, "Provider not found");
  }
  const taken = await Appointment.findOne({
    providerId,
    date: String(date),
    time: String(time),
    status: "booked",
  });
  if (taken) {
    throw new ApiError(409, "This slot is already booked");
  }
  let appointment;
  try {
    appointment = await Appointment.create({
      userId: req.user._id,
      providerId,
      date: String(date),
      time: String(time),
      status: "booked",
    });
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(409, "This slot is already booked");
    }
    throw error;
  }
  await appointment.populate("providerId", "name image category");
  res.status(201).json({
    success: true,
    message: "Appointment booked",
    data: appointment,
  });
});

const listMyAppointments = asyncHandler(async (req, res) => {
  const list = await Appointment.find({userId: req.user._id})
    .sort({createdAt: -1})
    .populate("providerId", "name image category");
  res.status(200).json({
    success: true,
    message: "Your appointments",
    data: list,
  });
});

const cancelAppointment = asyncHandler(async (req, res) => {
  const {id} = req.params;
  const appointment = await Appointment.findById(id);
  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
  }
  if (String(appointment.userId) !== String(req.user._id)) {
    throw new ApiError(403, "Not allowed to cancel this appointment");
  }
  if (appointment.status === "cancelled") {
    throw new ApiError(400, "Appointment is already cancelled");
  }
  appointment.status = "cancelled";
  await appointment.save();
  res.status(200).json({
    success: true,
    message: "Appointment cancelled",
    data: appointment,
  });
});

export {bookAppointment, listMyAppointments, cancelAppointment};
