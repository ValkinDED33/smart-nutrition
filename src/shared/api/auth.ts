import {
  addRemoteMealEntries,
  analyzeRemoteMealPhoto,
  addRemoteMealTemplate,
  checkRemoteBackendAvailability,
  createRemoteTelegramConnectLink,
  disconnectRemoteTelegram,
  fetchRemoteAccountBackup,
  fetchRemoteAccountExport,
  fetchRemoteAppState,
  fetchRemoteStateMeta,
  fetchRemoteTelegramStatus,
  getRemoteBaseUrl,
  getRemoteSessionToken,
  isRemoteAuthMode,
  pushRemoteCommunityState,
  pushRemoteAppSnapshot,
  pushRemoteCompanionState,
  pushRemoteFridgeState,
  pushRemoteWaterState,
  listRemoteAccountBackups,
  removeRemoteMealEntry,
  removeRemoteMealProduct,
  removeRemoteMealTemplate,
  pushRemoteMealState,
  pushRemoteProfileState,
  updateRemoteProfileWithState,
  refreshRemoteSession,
  remoteAuthProvider,
  purgeLegacyBrowserAuthStorage,
  type RemoteSyncResult,
  type TelegramConnectLink,
  type TelegramConnectionStatus,
  upsertRemoteMealProduct,
} from "./authRemote";
import { AuthApiError } from "./authProvider";
import type {
  RegistrationVerificationPayload,
  RegistrationVerificationResendPayload,
} from "./authProvider";

export type {
  RegisterPayload,
  AuthRuntimeInfo,
  AccountBackupPayload,
  AccountBackupSummary,
  AccountExportPayload,
  PasswordResetRequestResult,
  PasswordResetResult,
  RegistrationResult,
  RegistrationVerificationPayload,
  RegistrationVerificationPending,
  RegistrationVerificationResendPayload,
} from "./authProvider";
export type { RemoteSyncResult };
export type { TelegramConnectionStatus, TelegramConnectLink };
export { AuthApiError };

export const restoreSession = async (options?: {
  signal?: AbortSignal;
  timeoutMs?: number;
}) => {
  purgeLegacyBrowserAuthStorage();
  return remoteAuthProvider.restoreSession(options);
};

export const logout = async () => {
  await remoteAuthProvider.logout();
  purgeLegacyBrowserAuthStorage();
};

export const logoutEverywhere = async () => {
  await remoteAuthProvider.logoutEverywhere();
  purgeLegacyBrowserAuthStorage();
};

export const updateStoredProfile = (
  user: Parameters<typeof remoteAuthProvider.updateStoredProfile>[0]
) => remoteAuthProvider.updateStoredProfile(user);

export const register = async (
  payload: Parameters<typeof remoteAuthProvider.register>[0]
) => {
  purgeLegacyBrowserAuthStorage();
  return remoteAuthProvider.register(payload);
};

export const verifyRegistration = async (
  payload: RegistrationVerificationPayload
) => {
  return remoteAuthProvider.verifyRegistration(payload);
};

export const resendRegistrationVerification = async (
  payload: RegistrationVerificationResendPayload
) => {
  return remoteAuthProvider.resendRegistrationVerification(payload);
};

export const login = async (email: string, password: string) => {
  purgeLegacyBrowserAuthStorage();
  return remoteAuthProvider.login(email, password);
};

export const requestPasswordReset = async (email: string) => {
  return remoteAuthProvider.requestPasswordReset(email);
};

export const resetPassword = async (token: string, password: string) => {
  return remoteAuthProvider.resetPassword(token, password);
};

export const deleteAccount = (email: string) =>
  remoteAuthProvider.deleteAccount(email);

export const getAuthRuntimeInfo = () => remoteAuthProvider.getRuntimeInfo();

export const isCloudSyncActive = () => isRemoteAuthMode();
export const syncRemoteProfileState = pushRemoteProfileState;
export const syncRemoteProfileWithUser = updateRemoteProfileWithState;
export const syncRemoteMealState = pushRemoteMealState;
export const syncRemoteWaterState = pushRemoteWaterState;
export const syncRemoteFridgeState = pushRemoteFridgeState;
export const syncRemoteCommunityState = pushRemoteCommunityState;
export const syncRemoteCompanionState = pushRemoteCompanionState;
export const syncRemoteAppSnapshot = pushRemoteAppSnapshot;
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
export const refreshRemoteAccessSession = refreshRemoteSession;
export const exportRemoteAccountData = fetchRemoteAccountExport;
export const getRemoteAccountBackups = listRemoteAccountBackups;
export const getRemoteAccountBackup = fetchRemoteAccountBackup;
export const getRemoteTelegramStatus = fetchRemoteTelegramStatus;
export const createTelegramConnectLink = createRemoteTelegramConnectLink;
export const disconnectTelegram = disconnectRemoteTelegram;
