/**
 * Generate a bcrypt hash for the admin password.
 * Usage: node scripts/generate-admin-hash.js YOUR_PASSWORD
 * Then set ADMIN_PASSWORD_HASH in your .env.local and Vercel env vars.
 */
const bcrypt = require("bcryptjs");

const password = process.argv[2];
if (!password) {
  console.error("Usage: node scripts/generate-admin-hash.js YOUR_PASSWORD");
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);
console.log("\nAdd these to your .env.local and Vercel:\n");
console.log(`ADMIN_EMAIL=noe@sorell.fr`);
console.log(`ADMIN_PASSWORD_HASH=${hash}`);
console.log(`ADMIN_JWT_SECRET=${require("crypto").randomBytes(32).toString("hex")}`);
console.log("");
