import mongoose, {Schema} from "mongoose";

const availableSlotDaySchema = new Schema(
  {
    date: {type: String, required: true},
    slots: [{type: String}],
  },
  {_id: false}
);

const providerSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    availableSlots: {
      type: [availableSlotDaySchema],
      default: [],
    },
  },
  {timestamps: true}
);

const Provider = mongoose.model("Provider", providerSchema);

export {Provider};
