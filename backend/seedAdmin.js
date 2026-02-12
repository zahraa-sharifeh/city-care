require("dotenv").config();
const bcrypt = require("bcryptjs");
const connectDB = require("./src/config/db");
const Admin = require("./src/models/Admin");

async function run() {
  await connectDB();

  const email = "admin@smartcity.com";
  const password = "Admin123"; // change later
  const existing = await Admin.findOne({ email });

  if (existing) {
    console.log("Admin already exists:", email);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await Admin.create({
    fullName: "Super Admin",
    email,
    passwordHash,
    role: "SUPER_ADMIN",
    districtId: null,
  });

  console.log("✅ Created admin:", email, "password:", password);
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
