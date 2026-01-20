/**
 * ICONTROL_PASSWORD_HASH_TEST_V1
 * Tests pour password hashing
 */

import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../../../core/security/passwordHash";

describe("PasswordHash", () => {
  it("should hash password", async () => {
    const password = "testPassword123!";
    const hash = await hashPassword(password);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
    expect(hash).toContain(":");
  });

  it("should verify correct password", async () => {
    const password = "testPassword123!";
    const hash = await hashPassword(password);

    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });

  it("should reject incorrect password", async () => {
    const password = "testPassword123!";
    const hash = await hashPassword(password);

    const isValid = await verifyPassword("wrongPassword", hash);
    expect(isValid).toBe(false);
  });

  it("should generate different hashes for same password", async () => {
    const password = "testPassword123!";
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    // Hashes should be different due to salt
    expect(hash1).not.toBe(hash2);
    
    // But both should verify
    expect(await verifyPassword(password, hash1)).toBe(true);
    expect(await verifyPassword(password, hash2)).toBe(true);
  });
});
