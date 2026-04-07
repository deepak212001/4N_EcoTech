import mongoose, {Schema} from "mongoose";

const appointmentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    providerId: {
      type: Schema.Types.ObjectId,
      ref: "Provider",
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["booked", "cancelled"],
      default: "booked",
    },
  },
  {timestamps: {createdAt: "createdAt", updatedAt: false}}
);

appointmentSchema.index(
  {providerId: 1, date: 1, time: 1},
  {
    unique: true,
    partialFilterExpression: {status: "booked"},
  }
);

const Appointment = mongoose.model("Appointment", appointmentSchema);

export {Appointment};
