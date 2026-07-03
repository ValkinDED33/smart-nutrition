import { createAuthRepository } from "./authRepository.mjs";

export const createMongoAuthRepository = (mongoStorage) => {
  const repository = createAuthRepository(mongoStorage);

  return {
    ...repository,
    insertUser: (user) =>
      repository.insertUser({
        ...user,
        role: user.role ?? "USER",
      }),
  };
};
