export const ROLES = {
  USER: 1,
  TEAM_LEAD: 2,
  MANAGER: 3,
  ADMIN: 4,
  SUPER_ADMIN: 5,
};

export const DEFAULT_ROLES = [
  { id: ROLES.USER, name: "User" },
  { id: ROLES.TEAM_LEAD, name: "Team Lead" },
  { id: ROLES.MANAGER, name: "Manager" },
  { id: ROLES.ADMIN, name: "Admin" },
  { id: ROLES.SUPER_ADMIN, name: "Super Admin" },
];

export const roleRequiresTeam = (roleId) =>
  [ROLES.USER, ROLES.TEAM_LEAD].includes(Number(roleId));

export const roleRequiresDepartment = (roleId) =>
  Number(roleId) === ROLES.MANAGER;

export const canManageTasks = (roleId) => Number(roleId) >= ROLES.TEAM_LEAD;

export const canManageProjects = (roleId) => Number(roleId) >= ROLES.MANAGER;

export const canManageAttendance = (roleId) => Number(roleId) >= ROLES.MANAGER;

export const canSubmitLeave = (roleId) => Number(roleId) !== ROLES.SUPER_ADMIN;

export const canApproveLeave = canManageTasks;

export const canApproveLeaveFor = (approverRoleId, requesterRoleId, approverUserId, requesterUserId) =>
  Number(approverUserId) !== Number(requesterUserId) &&
  Number(approverRoleId) > Number(requesterRoleId);

export const canManageUsers = (roleId) => Number(roleId) >= ROLES.SUPER_ADMIN;

export const canManagePayroll = (roleId) => Number(roleId) >= ROLES.SUPER_ADMIN;

export const canManageDepartments = (roleId) => Number(roleId) >= ROLES.SUPER_ADMIN;

export const canManageTeams = (roleId) => Number(roleId) >= ROLES.MANAGER;
