import {
  addRemoteMealEntries,
  analyzeRemoteMealPhoto,
  addRemoteMealTemplate,
  checkRemoteBackendAvailability,
  fetchRemoteAccountBackup,
  fetchRemoteAccountExport,
  fetchRemoteAppState,
  fetchRemoteStateMeta,
  getRemoteBaseUrl,
  getRemoteAuthRuntimeInfo,
  getRemoteSessionToken,
  isRemoteAuthAvailable,
  isRemoteAuthMode,
  pushRemoteWaterState,
  listRemoteAccountBackups,
  removeRemoteMealEntry,
  removeRemoteMealProduct,
  removeRemoteMealTemplate,
  pushRemoteMealState,
  pushRemoteProfileState,
  remoteAuthProvider,
  type RemoteSyncResult,
  upsertRemoteMealProduct,
} from "./authRemote";
import { AuthApiError } from "./authLocal";

export type {
  RegisterPayload,
  AuthRuntimeInfo,
  AccountBackupPayload,
  AccountBackupSummary,
  AccountExportPayload,
  PasswordResetRequestResult,
  PasswordResetResult,
} from "./authProvider";
export type { RemoteSyncResult };
export { AuthApiError };
const assertRemoteBackendAvailable = async () => {
  if (!(await isRemoteAuthAvailable())) {
    throw new Error("Secure backend is unavailable.");
  }
};

export const restoreSession = () => remoteAuthProvider.restoreSession();

export const logout = () => remoteAuthProvider.logout();

export const logoutEverywhere = () => remoteAuthProvider.logoutEverywhere();

export const updateStoredProfile = (
  user: Parameters<typeof remoteAuthProvider.updateStoredProfile>[0]
) => remoteAuthProvider.updateStoredProfile(user);

export const register = async (
  payload: Parameters<typeof remoteAuthProvider.register>[0]
) => {
  await assertRemoteBackendAvailable();
  return remoteAuthProvider.register(payload);
};

export const login = async (email: string, password: string) => {
  await assertRemoteBackendAvailable();
  return remoteAuthProvider.login(email, password);
};

export const requestPasswordReset = async (email: string) => {
  await assertRemoteBackendAvailable();
  return remoteAuthProvider.requestPasswordReset(email);
};

export const resetPassword = async (token: string, password: string) => {
  await assertRemoteBackendAvailable();
  return remoteAuthProvider.resetPassword(token, password);
};

export const deleteAccount = (email: string) => remoteAuthProvider.deleteAccount(email);

export const getAuthRuntimeInfo = () => getRemoteAuthRuntimeInfo();

export const isCloudSyncActive = () => isRemoteAuthMode();
export const syncRemoteProfileState = pushRemoteProfileState;
export const syncRemoteMealState = pushRemoteMealState;
export const syncRemoteWaterState = pushRemoteWaterState;
export const createRemoteMealEntries = addRemoteMealEntries;
export const deleteRemoteMealEntry = removeRemoteMealEntry;
export const createRemoteMealTemplate = addRemoteMealTemplate;
export const deleteRemoteMealTemplate = removeRemoteMealTemplate;
export const saveRemoteMealProduct = upsertRemoteMealProduct;
export const deleteRemoteMealProduct = removeRemoteMealProduct;
export const getRemoteBackendAvailability = checkRemoteBackendAvailability;
export const pullRemoteAppSnapshot = fetchRemoteAppState;
export const getRemoteSnapshotMeta = fetchRemoteStateMeta;
export const analyzeMealPhoto = analyzeRemoteMealPhoto;
export const getRemoteAuthBaseUrl = getRemoteBaseUrl;
export const getRemoteAuthToken = getRemoteSessionToken;
export const exportRemoteAccountData = fetchRemoteAccountExport;
export const getRemoteAccountBackups = listRemoteAccountBackups;
export const getRemoteAccountBackup = fetchRemoteAccountBackup;
