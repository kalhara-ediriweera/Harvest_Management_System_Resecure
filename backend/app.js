// Dependencies Imports
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const path = require("path");
const fs = require("fs");

// Routes Imports
const cropRouter = require("./routes/cropRoute");
const salesRouter = require("./routes/salesRoutes");
const expensesRouter = require("./routes/expensesRoutes");
const reportRouter = require("./routes/reportRoutes");
const stockRoutes = require("./routes/stockRoutes");
const diseaseRouter = require("./routes/diseaseRoute");
const postRoutes = require("./routes/postRoutes");
const adminRoutes = require("./routes/adminRoutes");
const authRouter = require("./routes/authRoute");
const emailRoutes = require('./routes/emailRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const smsRoutes = require('./routes/smsRoutes');

const app = express();
const { seedDefaultUsers } = require("./utils/seedUsers");

// Middleware
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Set up routes (endpoints)
app.use("/crops", cropRouter);
app.use("/api/sales", salesRouter);
app.use("/api/expenses", expensesRouter);
app.use("/api/report", reportRouter);
app.use("/api", stockRoutes);
app.use("/api/diseases", diseaseRouter);
app.use("/api/posts", postRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRouter);
app.use('/api/email', emailRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/sms', smsRoutes);

// MongoDB connection
const dbURI = process.env.MONGO_DB_URI;
const PORT = process.env.PORT || 5000;

mongoose
  .connect(dbURI)
  .then(() => {
    console.log("Connected to MongoDB");
    seedDefaultUsers();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.log(err));
