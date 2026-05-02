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
  getRemoteSessionToken,
  isRemoteAuthAvailable,
  isRemoteAuthMode,
  pushRemoteCommunityState,
  pushRemoteFridgeState,
  pushRemoteWaterState,
  listRemoteAccountBackups,
  removeRemoteMealEntry,
  removeRemoteMealProduct,
  removeRemoteMealTemplate,
  pushRemoteMealState,
  pushRemoteProfileState,
  refreshRemoteSession,
  remoteAuthProvider,
  type RemoteSyncResult,
  upsertRemoteMealProduct,
} from "./authRemote";
import { AuthApiError, localAuthProvider } from "./authLocal";
import type { AuthProvider } from "./authProvider";

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

let activeAuthProvider: AuthProvider = localAuthProvider;

const setActiveAuthProvider = (provider: AuthProvider) => {
  activeAuthProvider = provider;
  return provider;
};

const getCurrentAuthProvider = () =>
  isRemoteAuthMode() ? setActiveAuthProvider(remoteAuthProvider) : activeAuthProvider;

const getAvailableAuthProvider = async () =>
  (await isRemoteAuthAvailable())
    ? setActiveAuthProvider(remoteAuthProvider)
    : setActiveAuthProvider(localAuthProvider);

export const restoreSession = async () => {
  const remoteSession = await remoteAuthProvider.restoreSession();

  if (remoteSession) {
    setActiveAuthProvider(remoteAuthProvider);
    return remoteSession;
  }

  try {
    const localSession = await localAuthProvider.restoreSession();

    if (localSession) {
      setActiveAuthProvider(localAuthProvider);
    }

    return localSession;
  } catch (error) {
    setActiveAuthProvider(localAuthProvider);
    throw error;
  }
};

export const logout = async () => {
  await Promise.allSettled([
    remoteAuthProvider.logout(),
    localAuthProvider.logout(),
  ]);
  setActiveAuthProvider(localAuthProvider);
};

export const logoutEverywhere = async () => {
  try {
    if (getCurrentAuthProvider() === remoteAuthProvider) {
      await remoteAuthProvider.logoutEverywhere();
    }
  } finally {
    await localAuthProvider.logoutEverywhere();
    setActiveAuthProvider(localAuthProvider);
  }
};

export const updateStoredProfile = (
  user: Parameters<AuthProvider["updateStoredProfile"]>[0]
) => getCurrentAuthProvider().updateStoredProfile(user);

export const register = async (
  payload: Parameters<AuthProvider["register"]>[0]
) => {
  const provider = await getAvailableAuthProvider();
  return provider.register(payload);
};

export const login = async (email: string, password: string) => {
  const provider = await getAvailableAuthProvider();
  return provider.login(email, password);
};

export const requestPasswordReset = async (email: string) => {
  const provider = await getAvailableAuthProvider();
  return provider.requestPasswordReset(email);
};

export const resetPassword = async (token: string, password: string) => {
  const provider = await getAvailableAuthProvider();
  return provider.resetPassword(token, password);
};

export const deleteAccount = (email: string) =>
  getCurrentAuthProvider().deleteAccount(email);

export const getAuthRuntimeInfo = () => getCurrentAuthProvider().getRuntimeInfo();

export const isCloudSyncActive = () => isRemoteAuthMode();
export const syncRemoteProfileState = pushRemoteProfileState;
export const syncRemoteMealState = pushRemoteMealState;
export const syncRemoteWaterState = pushRemoteWaterState;
export const syncRemoteFridgeState = pushRemoteFridgeState;
export const syncRemoteCommunityState = pushRemoteCommunityState;
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
