require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../models/User");

const createAdmin = async () => {
  const {
    MONGO_DB_URI,
    ADMIN_NAME,
    ADMIN_EMAIL,
    ADMIN_PASSWORD,
  } = process.env;

  // Validate required environment variables
  if (!MONGO_DB_URI) {
    throw new Error("MONGO_DB_URI is not configured.");
  }

  if (!ADMIN_NAME) {
    throw new Error("ADMIN_NAME is not configured.");
  }

  if (!ADMIN_EMAIL) {
    throw new Error("ADMIN_EMAIL is not configured.");
  }

  if (!ADMIN_PASSWORD) {
    throw new Error("ADMIN_PASSWORD is not configured.");
  }

  // Validate password strength
  if (ADMIN_PASSWORD.length < 12) {
    throw new Error(
      "ADMIN_PASSWORD must contain at least 12 characters."
    );
  }

  const email = ADMIN_EMAIL.trim().toLowerCase();
  const name = ADMIN_NAME.trim();

  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_DB_URI);

    console.log("Connected to MongoDB.");

    // Check whether an account already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      if (existingUser.role === "admin") {
        console.log("An administrator account already exists for this email.");
      } else {
        console.error(
          "A non-admin user already exists with this email."
        );
        console.error(
          "Use a different email address for the administrator account."
        );
      }

      return;
    }

    // Create administrator
    const admin = new User({
      name,
      email,
      password: ADMIN_PASSWORD,
      role: "admin",
    });

    await admin.save();

    console.log("Administrator account created successfully.");
    console.log(`Administrator email: ${email}`);
  } catch (error) {
    console.error("Failed to create administrator:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

createAdmin();