import crypto from "crypto";

export function generateRandomness() {
  return crypto.randomBytes(32).toString("hex");
}

export function KDF(password, salt) {
  // Key Derivation Function (KDF) using PBKDF2
  return crypto
    .pbkdf2Sync(
      password,
      salt,
      100000, // iterations
      32, // key length in bytes
      "sha256", // hash function
    )
    .toString("hex");
}

export function checkPassword(password, dbResult) {
  const inputKDFResult = KDF(password, dbResult.salt);
  if (inputKDFResult == dbResult.hashedPassword) {
    return true;
  }
  return false;
}

export function HMAC(key, data) {
  // HMAC using SHA-256
  return crypto
    .createHmac("sha256", Buffer.from(key, "hex"))
    .update(data)
    .digest("hex");
}
