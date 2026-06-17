import { createId, isOwnerRole, PlatformApiError, toPublicUser } from "../lib/domain.mjs";
import { readJsonBody, sendJson, sendNoContent } from "../lib/http.mjs";
import { assertRole } from "../lib/requireRole.mjs";

const getRouteParam = (context, name) => context.params?.[name] ?? null;

const readTargetUserId = (context, body = {}) =>
  getRouteParam(context, "userId") ?? body.userId ?? body.id ?? null;

const assertMutableUser = ({ currentUser, targetUser }) => {
  if (!targetUser) {
    throw new PlatformApiError("USER_NOT_FOUND", "Target user was not found.");
  }

  if (targetUser.id === currentUser.id || isOwnerRole(targetUser.role)) {
    throw new PlatformApiError(
      "ROLE_CHANGE_NOT_ALLOWED",
      "This account cannot be changed from the admin center."
    );
  }
};

export const createAdminController = ({
  platformService,
  adminRepository,
  bodyLimitBytes,
}) => ({
  getUsers: async ({ response, auth }) => {
    assertRole(auth.user, "admin");
    sendJson(response, 200, { items: await platformService.listUsers(auth.user) });
  },

  updateRole: async (context) => {
    assertRole(context.auth.user, "admin");
    const body = await readJsonBody(context.request, bodyLimitBytes);
    const userId = readTargetUserId(context, body);

    sendJson(
      context.response,
      200,
      await platformService.updateUserRole(context.auth.user, userId, body)
    );
  },

  banUser: async (context) => {
    assertRole(context.auth.user, "admin");
    const body = await readJsonBody(context.request, bodyLimitBytes);
    const userId = readTargetUserId(context, body);

    sendJson(
      context.response,
      200,
      await platformService.updateUserBan(context.auth.user, userId, {
        banned: body.banned ?? true,
        reason: body.reason,
      })
    );
  },

  deleteUser: async (context) => {
    assertRole(context.auth.user, "owner");
    const body =
      context.request.method === "DELETE"
        ? {}
        : await readJsonBody(context.request, bodyLimitBytes);
    const userId = readTargetUserId(context, body);
    const targetUser = (await adminRepository.getAllUsers()).find((user) => user.id === userId);

    assertMutableUser({ currentUser: context.auth.user, targetUser });
    await adminRepository.deleteUser(userId);
    await adminRepository.createAuditLog?.({
      id: createId("audit"),
      actorUserId: context.auth.user.id,
      actorRole: context.auth.user.role,
      action: "access.user_deleted",
      targetType: "user",
      targetId: userId,
      details: {
        email: targetUser.email,
        role: targetUser.role,
      },
      createdAt: new Date().toISOString(),
    });
    sendNoContent(context.response);
  },

  getStats: async ({ response, auth }) => {
    assertRole(auth.user, "admin");
    sendJson(response, 200, await adminRepository.getStats());
  },

  listModerationQueue: async ({ response, auth, url }) => {
    sendJson(response, 200, {
      items: await platformService.listModerationQueue(auth.user, {
        status: url.searchParams.get("status"),
        search: url.searchParams.get("search") ?? "",
        limit: url.searchParams.get("limit") ?? undefined,
      }),
    });
  },

  reviewCatalogProduct: async (context) => {
    const body = await readJsonBody(context.request, bodyLimitBytes);

    sendJson(
      context.response,
      200,
      await platformService.reviewCatalogProduct(
        context.auth.user,
        getRouteParam(context, "submissionId"),
        body
      )
    );
  },

  listAuditLogs: async ({ response, auth, url }) => {
    sendJson(response, 200, {
      items: await platformService.listAuditLogs(auth.user, {
        limit: url.searchParams.get("limit") ?? undefined,
      }),
    });
  },

  createContentReport: async (context) => {
    const body = await readJsonBody(context.request, bodyLimitBytes);
    sendJson(
      context.response,
      201,
      await platformService.createContentReport(context.auth.user, body)
    );
  },

  listContentReports: async ({ response, auth, url }) => {
    sendJson(response, 200, {
      items: await platformService.listContentReports(auth.user, {
        limit: url.searchParams.get("limit") ?? undefined,
      }),
    });
  },

  getAllUsersRaw: async ({ response, auth }) => {
    assertRole(auth.user, "admin");
    sendJson(response, 200, (await adminRepository.getAllUsers()).map(toPublicUser));
  },
});
