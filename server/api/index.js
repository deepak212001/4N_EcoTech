import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});

import {connectDB} from "./config/db.js";
import {app} from "./app.js";

app.get("/", (req, res) => {
  res.send("Hello from API!");
});

const port = Number(process.env.PORT) || 3000;

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  });
