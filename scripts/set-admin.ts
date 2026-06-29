/**
 * Grant (or revoke) admin rights for a user by email.
 *
 *   npm run set-admin -- user@example.com           # grant admin
 *   npm run set-admin -- user@example.com --revoke   # revoke admin
 *
 * Requires AWS credentials + DYNAMODB_TABLE / AWS_REGION in the environment
 * (same as create-table). Admin-granting lives outside the app surface on
 * purpose, so it can't be self-escalated through the UI.
 */
import { getUserByEmail, setAdminFlag } from "../src/lib/repositories/users";

async function main() {
  const email = process.argv[2];
  const revoke = process.argv.includes("--revoke");
  if (!email) {
    console.error("Usage: npm run set-admin -- <email> [--revoke]");
    process.exit(1);
  }

  const user = await getUserByEmail(email.toLowerCase().trim());
  if (!user) {
    console.error(`No user found for email: ${email}`);
    process.exit(1);
  }

  await setAdminFlag(user.userId, !revoke);
  console.log(
    `${revoke ? "Revoked admin from" : "Granted admin to"} ${user.email} (${user.userId}).`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
