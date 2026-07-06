const PROJECT_STATUS_ALIASES = {
  PENDING: "Pending",
  ACTIVE: "Active",
  "IN_PROGRESS": "Active",
  INPROGRESS: "Active",
  COMPLETED: "Completed",
  DONE: "Completed",
  CLOSED: "Completed"
};

const PROJECT_STATUSES = ["Pending", "Active", "Completed"];

const PROJECT_STATUS_GROUPS = {
  pending: ["Pending"],
  active: ["Active", "In Progress"],
  completed: ["Completed"]
};

const normalizeProjectStatus = (value) => {
  const key = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  return PROJECT_STATUS_ALIASES[key] || null;
};

const requireProjectStatus = (value) => {
  const normalized = normalizeProjectStatus(value);
  if (!normalized) {
    throw new Error(`Project status must be one of: ${PROJECT_STATUSES.join(", ")}.`);
  }
  return normalized;
};

const serializeProject = (project) => {
  if (!project) {
    return project;
  }

  return {
    ...project,
    status: normalizeProjectStatus(project.status) || project.status
  };
};

const statusCountFilter = (statuses) => ({
  in: statuses
});

module.exports = {
  PROJECT_STATUSES,
  PROJECT_STATUS_GROUPS,
  normalizeProjectStatus,
  requireProjectStatus,
  serializeProject,
  statusCountFilter
};
