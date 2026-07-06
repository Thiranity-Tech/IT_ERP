const ROLES = {
  USER: 1,
  TEAM_LEAD: 2,
  MANAGER: 3,
  ADMIN: 4,
  SUPER_ADMIN: 5,
};

const DEFAULT_ROLES = [
  { id: ROLES.USER, name: "User" },
  { id: ROLES.TEAM_LEAD, name: "Team Lead" },
  { id: ROLES.MANAGER, name: "Manager" },
  { id: ROLES.ADMIN, name: "Admin" },
  { id: ROLES.SUPER_ADMIN, name: "Super Admin" },
];

const TEAM_REQUIRED_ROLE_IDS = [ROLES.USER, ROLES.TEAM_LEAD];
const DEPARTMENT_REQUIRED_ROLE_IDS = [ROLES.MANAGER];
const USER_ADMIN_ROLE_IDS = [ROLES.ADMIN, ROLES.SUPER_ADMIN];
const TEAM_ADMIN_ROLE_IDS = [
  ROLES.MANAGER,
  ROLES.ADMIN,
  ROLES.SUPER_ADMIN,
];
const PROJECT_MANAGER_ROLE_IDS = [
  ROLES.MANAGER,
  ROLES.ADMIN,
  ROLES.SUPER_ADMIN,
];
const TASK_MANAGER_ROLE_IDS = [
  ROLES.TEAM_LEAD,
  ROLES.MANAGER,
  ROLES.ADMIN,
  ROLES.SUPER_ADMIN,
];
const LEAVE_APPROVER_ROLE_IDS = TASK_MANAGER_ROLE_IDS;
const PAYROLL_MANAGER_ROLE_IDS = [
  ROLES.MANAGER,
  ROLES.ADMIN,
  ROLES.SUPER_ADMIN,
];

const roleRequiresTeam = (roleId) =>
  TEAM_REQUIRED_ROLE_IDS.includes(Number(roleId));

const roleRequiresDepartment = (roleId) =>
  DEPARTMENT_REQUIRED_ROLE_IDS.includes(Number(roleId));

const isElevatedRole = (roleId) =>
  Number(roleId) >= ROLES.TEAM_LEAD;

const canSubmitLeave = (roleId) =>
  Number(roleId) !== ROLES.SUPER_ADMIN;

const canApproveLeaveFor = (approverRoleId, approverUserId, requesterRoleId, requesterUserId) =>
  Number(approverUserId) !== Number(requesterUserId) &&
  Number(approverRoleId) > Number(requesterRoleId);

module.exports = {
  ROLES,
  DEFAULT_ROLES,
  TEAM_REQUIRED_ROLE_IDS,
  DEPARTMENT_REQUIRED_ROLE_IDS,
  USER_ADMIN_ROLE_IDS,
  TEAM_ADMIN_ROLE_IDS,
  PROJECT_MANAGER_ROLE_IDS,
  TASK_MANAGER_ROLE_IDS,
  LEAVE_APPROVER_ROLE_IDS,
  PAYROLL_MANAGER_ROLE_IDS,
  roleRequiresTeam,
  roleRequiresDepartment,
  isElevatedRole,
  canSubmitLeave,
  canApproveLeaveFor,
};
