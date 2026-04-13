import cookieParser from "cookie-parser";
import express from "express";
import { dirname } from "path";
import { fileURLToPath } from "url";
import authRoute from "./modules/auth/auth.route.js";
import seatRoute from "./modules/seats/seat.route.js";
import { errorHandler } from "./common/middleware/error.middleware.js";

const __dirname = dirname(fileURLToPath(import.meta.url)); //to get frontend

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(__dirname + "/../public"));

// Serve frontend
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/../public/index.html");
});

// API Routes
app.use("/api/auth", authRoute);
app.use("/api/seats", seatRoute);

// Global error handler
app.use(errorHandler);

export default app;
