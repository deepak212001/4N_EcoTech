import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {User} from "../models/user.model.js";
import {Provider} from "../models/provider.model.js";
import {Appointment} from "../models/appointment.model.js";
import {uploadImageFromDataUri} from "../utils/cloudinary.js";

const DEFAULT_PROVIDER_AVATAR =
  "https://img.freepik.com/premium-vector/default-avatar-profile-icon-social-media-user-image-gray-avatar-icon-blank-profile-silhouette-vector-illustration_561158-3383.jpg?semt=ais_hybrid&w=740&q=80";

function providerPayload(provider) {
  return {
    id: provider._id,
    name: provider.name,
    email: provider.email,
    category: provider.category,
    image: provider.image || "",
    role: "provider",
    createdAt: provider.createdAt,
    availableSlots: provider.availableSlots || [],
  };
}

const listProviders = asyncHandler(async (req, res) => {
  const providers = await Provider.find().lean();
  res.status(200).json({
    success: true,
    message: "Providers retrieved",
    data: providers,
  });
});

const getProviderById = asyncHandler(async (req, res) => {
  const {id} = req.params;
  const provider = await Provider.findById(id).lean();
  if (!provider) {
    throw new ApiError(404, "Provider not found");
  }
  const bookedAppointments = await Appointment.find({
    providerId: id,
    status: "booked",
  })
    .select("date time")
    .lean();

  const bookedSet = new Set(
    bookedAppointments.map(
      (appointment) => `${appointment.date}__${appointment.time}`
    )
  );

  const filteredSlots = (provider.availableSlots || [])
    .map((day) => ({
      ...day,
      slots: (day.slots || []).filter(
        (slot) => !bookedSet.has(`${day.date}__${slot}`)
      ),
    }))
    .filter((day) => day.slots.length > 0);

  res.status(200).json({
    success: true,
    message: "Provider details",
    data: {
      ...provider,
      availableSlots: filteredSlots,
    },
  });
});

const registerProvider = asyncHandler(async (req, res) => {
  console.log(req.body);
  const {name, email, password, category, imageBase64} = req.body;
  if (!name || !email || !password || !category) {
    throw new ApiError(400, "name, email, password, and category are required");
  }
  const lower = email.toLowerCase();
  const asPatient = await User.findOne({email: lower});
  if (asPatient) {
    throw new ApiError(409, "Email already registered as a patient");
  }
  const taken = await Provider.findOne({email: lower});
  if (taken) {
    throw new ApiError(409, "Email already registered");
  }

  let imageUrl = DEFAULT_PROVIDER_AVATAR;
  if (imageBase64 && typeof imageBase64 === "string") {
    if (imageBase64.length > 10_000_000) {
      throw new ApiError(400, "Profile image is too large");
    }
    const img = await uploadImageFromDataUri(imageBase64);
    if (img?.secure_url || img?.url) {
      imageUrl = img.secure_url || img.url;
    }
  }

  const provider = await Provider.create({
    name,
    email: lower,
    password,
    category,
    image: imageUrl,
    availableSlots: [],
  });
  const token = provider.generateToken();
  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        {...providerPayload(provider), token},
        "Provider registered successfully",
        true
      )
    );
});

const loginProvider = asyncHandler(async (req, res) => {
  const {email, password} = req.body;
  if (!email || !password) {
    throw new ApiError(400, "email and password are required");
  }
  const provider = await Provider.findOne({email: email.toLowerCase()}).select(
    "+password"
  );
  if (!provider || !provider.password) {
    throw new ApiError(401, "Invalid email or password");
  }
  const ok = await provider.comparePassword(password);
  if (!ok) {
    throw new ApiError(401, "Invalid email or password");
  }
  const token = provider.generateToken();
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
        {...providerPayload(provider), token},
        "Login successful",
        true
      )
    );
});

const getProviderMe = asyncHandler(async (req, res) => {
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        providerPayload(req.provider),
        "Provider profile",
        true
      )
    );
});

const listProviderBookings = asyncHandler(async (req, res) => {
  const list = await Appointment.find({providerId: req.provider._id})
    .sort({createdAt: -1})
    .populate("userId", "name email")
    .lean();
  res.status(200).json({
    success: true,
    message: "Appointments for your practice",
    data: list,
  });
});

/**
 * Replace entire availability schedule. Body: { availableSlots: [{ date: "YYYY-MM-DD", slots: ["09:00", ...] }] }
 */
const updateProviderSlots = asyncHandler(async (req, res) => {
  const {availableSlots} = req.body;
  console.log(
    "[slots] updateProviderSlots",
    Array.isArray(availableSlots) ? availableSlots.length : "invalid",
    "days"
  );
  if (!Array.isArray(availableSlots)) {
    throw new ApiError(400, "availableSlots must be an array");
  }
  const normalized = [];
  const seenDates = new Set();
  for (const day of availableSlots) {
    if (!day || typeof day.date !== "string" || !day.date.trim()) {
      throw new ApiError(400, "Each entry needs a date string (YYYY-MM-DD)");
    }
    const d = day.date.trim();
    if (seenDates.has(d)) {
      throw new ApiError(400, `Duplicate date: ${d}`);
    }
    seenDates.add(d);
    const slots = Array.isArray(day.slots)
      ? [...new Set(day.slots.map((s) => String(s).trim()).filter(Boolean))]
      : [];
    normalized.push({date: d, slots});
  }
  normalized.sort((a, b) => a.date.localeCompare(b.date));

  const provider = await Provider.findById(req.provider._id);
  if (!provider) {
    throw new ApiError(404, "Provider not found");
  }
  provider.availableSlots = normalized;
  await provider.save();

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        providerPayload(provider),
        "Availability updated",
        true
      )
    );
});

export {
  listProviders,
  getProviderById,
  registerProvider,
  loginProvider,
  getProviderMe,
  listProviderBookings,
  updateProviderSlots,
};
