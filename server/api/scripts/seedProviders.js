import dotenv from "dotenv";
import {connectDB} from "../config/db.js";
import {Provider} from "../models/provider.model.js";

dotenv.config({path: "./.env"});

const providers = [
  {
    name: "Dr. Sarah Lee",
    category: "Dermatology",
    image: "",
    availableSlots: [
      {date: "2026-04-08", slots: ["09:00", "10:00", "11:30"]},
      {date: "2026-04-09", slots: ["12:00", "13:00", "15:00"]},
    ],
  },
  {
    name: "Dr. Aman Verma",
    category: "Dentistry",
    image: "",
    availableSlots: [
      {date: "2026-04-08", slots: ["10:30", "14:00", "16:00"]},
      {date: "2026-04-10", slots: ["09:30", "11:00"]},
    ],
  },
];

async function seed() {
  await connectDB();
  await Provider.deleteMany({});
  await Provider.insertMany(providers);
  console.log("Providers seeded successfully");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Failed to seed providers:", error);
  process.exit(1);
});
