import { localAuthProvider, AuthApiError } from "./authLocal";
import {
  addRemoteMealEntries,
  analyzeRemoteMealPhoto,
  addRemoteMealTemplate,
  checkRemoteBackendAvailability,
  fetchRemoteAppState,
  fetchRemoteStateMeta,
  getRemoteBaseUrl,
  getRemoteAuthRuntimeInfo,
  getRemoteSessionToken,
  isRemoteAuthAvailable,
  isRemoteAuthMode,
  removeRemoteMealEntry,
  removeRemoteMealProduct,
  removeRemoteMealTemplate,
  pushRemoteMealState,
  pushRemoteProfileState,
  remoteAuthProvider,
  type RemoteSyncResult,
  upsertRemoteMealProduct,
} from "./authRemote";

export type { RegisterPayload, AuthRuntimeInfo } from "./authProvider";
export type { RemoteSyncResult };
export { AuthApiError };
export const restoreSession = async () => {
  if (isRemoteAuthMode()) {
    const remoteSession = await remoteAuthProvider.restoreSession();

    if (remoteSession) {
      return remoteSession;
    }
  }

  return localAuthProvider.restoreSession();
};

export const logout = () =>
  isRemoteAuthMode() ? remoteAuthProvider.logout() : localAuthProvider.logout();

export const logoutEverywhere = () =>
  isRemoteAuthMode()
    ? remoteAuthProvider.logoutEverywhere()
    : localAuthProvider.logoutEverywhere();

export const updateStoredProfile = async (
  user: Parameters<typeof localAuthProvider.updateStoredProfile>[0]
) =>
  isRemoteAuthMode()
    ? remoteAuthProvider.updateStoredProfile(user)
    : localAuthProvider.updateStoredProfile(user);

export const register = async (
  payload: Parameters<typeof localAuthProvider.register>[0]
) =>
  (await isRemoteAuthAvailable())
    ? remoteAuthProvider.register(payload)
    : localAuthProvider.register(payload);

export const login = async (email: string, password: string) =>
  (await isRemoteAuthAvailable())
    ? remoteAuthProvider.login(email, password)
    : localAuthProvider.login(email, password);

export const deleteAccount = (email: string) =>
  isRemoteAuthMode()
    ? remoteAuthProvider.deleteAccount(email)
    : localAuthProvider.deleteAccount(email);

export const getAuthRuntimeInfo = () =>
  isRemoteAuthMode()
    ? getRemoteAuthRuntimeInfo()
    : localAuthProvider.getRuntimeInfo();

export const isCloudSyncActive = () => isRemoteAuthMode();
export const syncRemoteProfileState = pushRemoteProfileState;
export const syncRemoteMealState = pushRemoteMealState;
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
