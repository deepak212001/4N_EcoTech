import dotenv from "dotenv";
import {connectDB} from "../config/db.js";
import {Provider} from "../models/provider.model.js";

dotenv.config({path: "./.env"});

/** Next `count` calendar days as YYYY-MM-DD (starting tomorrow). */
function upcomingDates(count) {
  const out = [];
  const base = new Date();
  for (let i = 1; i <= count; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

const [d1, d2, d3, d4, d5] = upcomingDates(5);

const providers = [
  {
    name: "Dr. Sarah Lee",
    category: "Dermatology",
    image: "",
    availableSlots: [
      {date: d1, slots: ["09:00", "10:00", "11:30", "14:00"]},
      {date: d2, slots: ["09:00", "12:00", "15:00"]},
      {date: d3, slots: ["10:30", "16:00"]},
    ],
  },
  {
    name: "Dr. Aman Verma",
    category: "Dentistry",
    image: "",
    availableSlots: [
      {date: d1, slots: ["10:30", "14:00", "16:00"]},
      {date: d2, slots: ["09:30", "11:00", "13:30"]},
      {date: d4, slots: ["10:00", "15:00"]},
    ],
  },
  {
    name: "Dr. Priya Sharma",
    category: "Cardiology",
    image: "",
    availableSlots: [
      {date: d1, slots: ["08:00", "09:00", "11:00"]},
      {date: d3, slots: ["10:00", "14:30", "17:00"]},
      {date: d5, slots: ["09:00", "12:00"]},
    ],
  },
  {
    name: "Dr. James Wilson",
    category: "Orthopedics",
    image: "",
    availableSlots: [
      {date: d2, slots: ["09:00", "10:00", "11:00", "15:00"]},
      {date: d3, slots: ["08:30", "13:00"]},
      {date: d4, slots: ["10:00", "16:30"]},
    ],
  },
  {
    name: "Dr. Neha Kapoor",
    category: "Pediatrics",
    image: "",
    availableSlots: [
      {date: d1, slots: ["09:00", "10:30", "12:00"]},
      {date: d2, slots: ["11:00", "14:00"]},
      {date: d3, slots: ["09:30", "15:30"]},
    ],
  },
  {
    name: "Dr. Vikram Singh",
    category: "General Physician",
    image: "",
    availableSlots: [
      {date: d1, slots: ["08:00", "12:00", "17:00"]},
      {date: d2, slots: ["09:00", "13:00", "16:00"]},
      {date: d3, slots: ["10:00", "11:00", "15:00"]},
      {date: d4, slots: ["08:30", "14:00"]},
    ],
  },
  {
    name: "GreenLeaf Physio Clinic",
    category: "Physiotherapy",
    image: "",
    availableSlots: [
      {date: d2, slots: ["10:00", "11:30", "18:00"]},
      {date: d4, slots: ["09:00", "12:00", "16:00"]},
      {date: d5, slots: ["10:00", "15:00"]},
    ],
  },
];

async function seed() {
  await connectDB();
  await Provider.deleteMany({});
  await Provider.insertMany(providers);
  console.log(`Seeded ${providers.length} providers (slots use next 5 days from today).`);
  process.exit(0);
}

seed().catch((error) => {
  console.error("Failed to seed providers:", error);
  process.exit(1);
});
