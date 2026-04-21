/**
 * Print a bcrypt hash for use in MongoDB Compass (Admin.passwordHash).
 * Usage (from backend folder): node scripts/hashPassword.js "YourPlainPassword"
 */
const bcrypt = require("bcryptjs");

const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/hashPassword.js "<password>"');
  process.exit(1);
}

console.log(bcrypt.hashSync(password, 10));
