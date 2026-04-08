import "./loadEnv.js";

import {connectDB} from "./config/db.js";
import {app} from "./app.js";

app.get("/", (req, res) => {
  res.send("Hello from API!");
});

const port = Number(process.env.PORT) || 8000;

connectDB()
  .then(() => {
    app.listen(port, "0.0.0.0", () => {
      console.log(`Server listening on http://0.0.0.0:${port} (LAN: use PC IPv4 + this port)`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  });
