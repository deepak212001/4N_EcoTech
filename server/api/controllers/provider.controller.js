import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {Provider} from "../models/provider.model.js";
import {Appointment} from "../models/appointment.model.js";

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
    bookedAppointments.map((appointment) => `${appointment.date}__${appointment.time}`)
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

export {listProviders, getProviderById};
