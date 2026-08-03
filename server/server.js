import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import resumeRoutes from "./routes/resumeRoutes.js";

// Load environment variables (from local dir or parent dir)
dotenv.config();
dotenv.config({ path: "../.env" });

const app = express();

// Middlewares
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Routes
app.use("/resume", resumeRoutes);

app.get("/", (req, res) => res.send("ATS Generator API Running"));

// Resilient MongoDB Connection
if (process.env.MONGODB_URI) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log("Connected to MongoDB Atlas"))
    .catch((err) =>
      console.warn("MongoDB connection failed (running in offline simulation mode):", err.message)
    );
} else {
  console.log("No MONGODB_URI found. Running in offline mode without persistence.");
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
