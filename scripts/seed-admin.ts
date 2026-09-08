import { connectToDatabase } from "../src/lib/mongodb";
import { User } from "../src/models/User";

const targetUsername = process.argv[2];

if (!targetUsername) {
  console.log("Usage: npm run seed:admin <username_or_email>");
  console.log("Example: npm run seed:admin nam4sh@gmail.com");
  process.exit(1);
}

async function grantAdmin() {
  console.log("Connecting to MongoDB Atlas via connectToDatabase()...");
  const mongooseInstance = await connectToDatabase();

  const normalized = targetUsername.toLowerCase().trim();
  const user = await User.findOne({
    $or: [{ usernameNormalized: normalized }, { email: normalized }],
  });

  if (!user) {
    console.error(`User "${targetUsername}" not found. Sign in with OAuth first to create the account.`);
    await mongooseInstance.disconnect();
    process.exit(1);
  }

  user.role = "admin";
  await user.save();

  console.log(`Success: User "${user.username}" (${user.email || "no-email"}) has been granted administrator privileges.`);
  await mongooseInstance.disconnect();
}

grantAdmin().catch((err) => {
  console.error("Admin grant failed:", err);
  process.exit(1);
});
