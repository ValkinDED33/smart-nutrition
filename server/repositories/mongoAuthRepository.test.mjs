import { describe, expect, it, vi } from "vitest";
import { createMongoAuthRepository } from "./mongoAuthRepository.mjs";

const createStorage = () => ({
  hasUserWithRole: vi.fn(),
  insertUser: vi.fn(async (user) => user),
});

describe("mongoAuthRepository", () => {
  it("preserves the domain role assigned by auth service", async () => {
    const storage = createStorage();
    const repository = createMongoAuthRepository(storage);

    await repository.insertUser({
      id: "user-owner",
      email: "owner@example.com",
      role: "OWNER",
    });

    expect(storage.insertUser).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "user-owner",
        role: "OWNER",
      })
    );
  });

  it("defaults missing roles to the canonical USER role", async () => {
    const storage = createStorage();
    const repository = createMongoAuthRepository(storage);

    await repository.insertUser({
      id: "user-default",
      email: "user@example.com",
    });

    expect(storage.insertUser).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "user-default",
        role: "USER",
      })
    );
  });
});
