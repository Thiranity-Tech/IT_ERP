const prisma = require("../prisma/client");
const { DEFAULT_ROLES, ROLES } = require("../constants/roles");

const roleNameById = DEFAULT_ROLES.reduce((map, role) => {
  map[role.id] = role.name;
  return map;
}, {});

const getRoleName = (roleId) => roleNameById[Number(roleId)] || "User";

const normalizeNotificationPayload = (payload) => {
  if (payload && typeof payload === "object") {
    return {
      text: String(payload.text || payload.message || "").trim(),
      targetPath: payload.targetPath || null,
      recordType: payload.recordType || null,
      recordId: payload.recordId || null
    };
  }

  return {
    text: String(payload || "").trim(),
    targetPath: null,
    recordType: null,
    recordId: null
  };
};

const serializeNotificationMessage = (payload) =>
  JSON.stringify(normalizeNotificationPayload(payload));

const parseNotificationMessage = (message) => {
  const raw = String(message || "");

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return normalizeNotificationPayload(parsed);
    }
  } catch (error) {
    // fall through to plain-text handling
  }

  return normalizeNotificationPayload(raw);
};

const uniqueIds = (ids = []) =>
  [...new Set(ids.map((id) => Number(id)).filter((id) => Number.isInteger(id)))];

const createNotifications = async (client, userIds, message) => {
  const ids = uniqueIds(userIds);
  const serialized = serializeNotificationMessage(message);

  if (!ids.length || !serialized) {
    return [];
  }

  return client.notification.createMany({
    data: ids.map((userId) => ({
      userId,
      message: serialized
    }))
  });
};

const notifyUsers = (client, userIds, message) =>
  createNotifications(client, userIds, message);

const notifyUser = (client, userId, message) =>
  createNotifications(client, [userId], message);

const getUsersByRoleScope = async (client, { roleIds, teamId = null, departmentId = null }) => {
  const where = {
    roleId: {
      in: roleIds.map((roleId) => Number(roleId))
    }
  };

  if (teamId !== null && teamId !== undefined) {
    where.teamId = Number(teamId);
  }

  if (departmentId !== null && departmentId !== undefined) {
    where.departmentId = Number(departmentId);
  }

  const users = await client.user.findMany({
    where,
    select: {
      id: true
    }
  });

  return users.map((user) => user.id);
};

const notifyByRoleScope = async (client, scope, message) =>
  notifyUsers(client, await getUsersByRoleScope(client, scope), message);

const getLeaveRequestRecipients = async (client, requester) => {
  const requesterRoleId = Number(requester.roleId);
  const teamDepartmentId = requester.team?.departmentId || requester.departmentId || null;

  if (requesterRoleId === ROLES.USER) {
    const [teamLeads, managers, admins] = await Promise.all([
      getUsersByRoleScope(client, {
        roleIds: [ROLES.TEAM_LEAD],
        teamId: requester.teamId
      }),
      getUsersByRoleScope(client, {
        roleIds: [ROLES.MANAGER, ROLES.ADMIN],
        departmentId: teamDepartmentId
      }),
      Promise.resolve([])
    ]);

    return uniqueIds([...teamLeads, ...managers, ...admins]);
  }

  if (requesterRoleId === ROLES.TEAM_LEAD) {
    const [managers, admins] = await Promise.all([
      getUsersByRoleScope(client, {
        roleIds: [ROLES.MANAGER],
        departmentId: teamDepartmentId
      }),
      getUsersByRoleScope(client, {
        roleIds: [ROLES.ADMIN],
        departmentId: teamDepartmentId
      })
    ]);

    return uniqueIds([...managers, ...admins]);
  }

  if (requesterRoleId === ROLES.MANAGER || requesterRoleId === ROLES.ADMIN) {
    return getUsersByRoleScope(client, {
      roleIds: [ROLES.SUPER_ADMIN]
    });
  }

  return [];
};

const describeUser = (user) => user?.name || "the user";

const describeTeam = (user) => user?.team?.name || "your team";

module.exports = {
  createNotifications,
  notifyUsers,
  notifyUser,
  notifyByRoleScope,
  getUsersByRoleScope,
  getLeaveRequestRecipients,
  getRoleName,
  parseNotificationMessage,
  describeUser,
  describeTeam,
  roleNameById
};
