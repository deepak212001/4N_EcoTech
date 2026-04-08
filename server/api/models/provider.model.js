import mongoose, {Schema} from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

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
      default:
        "https://img.freepik.com/premium-vector/default-avatar-profile-icon-social-media-user-image-gray-avatar-icon-blank-profile-silhouette-vector-illustration_561158-3383.jpg?semt=ais_hybrid&w=740&q=80",
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      sparse: true,
      unique: true,
    },
    password: {
      type: String,
      select: false,
      minlength: 6,
    },
    availableSlots: {
      type: [availableSlotDaySchema],
      default: [],
    },
  },
  {timestamps: true}
);

providerSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  if (!this.password) return;
  this.password = await bcrypt.hash(this.password, 10);
});

providerSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

providerSchema.methods.generateToken = function () {
  return jwt.sign({id: this._id, role: "provider"}, process.env.TOKEN_SECRET, {
    expiresIn: process.env.TOKEN_EXPIRY || "7d",
  });
};

const Provider = mongoose.model("Provider", providerSchema);

export {Provider};
