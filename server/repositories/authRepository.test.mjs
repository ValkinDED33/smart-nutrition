import { describe, expect, it, vi } from "vitest";

import { createAuthRepository } from "./authRepository.mjs";

describe("createAuthRepository reminder persistence", () => {
  it("routes legacy reminder calls through canonical storage when available", () => {
    const storage = {
      updateUserReminders: vi.fn(() => ({ id: "user-1", medicationReminders: [] })),
      updateUserMedicationReminders: vi.fn(),
    };
    const repository = createAuthRepository(storage);
    const reminders = [{ id: "reminder-1", type: "task" }];

    expect(repository.updateUserMedicationReminders("user-1", reminders)).toEqual({
      id: "user-1",
      medicationReminders: [],
    });
    expect(storage.updateUserReminders).toHaveBeenCalledWith("user-1", reminders);
    expect(storage.updateUserMedicationReminders).not.toHaveBeenCalled();
  });

  it("keeps canonical reminder calls compatible with legacy-only storage", () => {
    const storage = {
      updateUserMedicationReminders: vi.fn(() => ({
        id: "user-1",
        medicationReminders: [],
      })),
    };
    const repository = createAuthRepository(storage);
    const reminders = [{ id: "reminder-1", type: "task" }];

    expect(repository.updateUserReminders("user-1", reminders)).toEqual({
      id: "user-1",
      medicationReminders: [],
    });
    expect(storage.updateUserMedicationReminders).toHaveBeenCalledWith("user-1", reminders);
  });
});
