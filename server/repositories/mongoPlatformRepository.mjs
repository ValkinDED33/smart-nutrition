import { createPlatformRepository } from "./platformRepository.mjs";

export const createMongoPlatformRepository = (mongoStorage) =>
  createPlatformRepository(mongoStorage);
