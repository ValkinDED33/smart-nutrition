import { createStateRepository } from "./stateRepository.mjs";

export const createMongoStateRepository = (mongoStorage) => createStateRepository(mongoStorage);
