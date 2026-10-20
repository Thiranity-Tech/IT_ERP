const { PrismaClient } = require("@prisma/client");
const tenantContext = require("../services/tenantContext");

// Reuse the database client while a Vercel function instance is warm. Creating
// a fresh Prisma client per request adds a costly database connection handshake.
const prismaGlobal = globalThis;
const basePrisma = prismaGlobal.__itErpPrisma || new PrismaClient();
prismaGlobal.__itErpPrisma = basePrisma;

const TENANT_MODELS = new Set([
  "User", "Department", "Team", "Project", "Task", "Attendance",
  "OfficeSetting", "LeaveRequest", "Payroll", "Incentive", "Client",
  "SupportTicket", "Notification", "SupportTicketNote", "SupportTicketEvent",
  "DailyScrum", "Report", "ProjectNote", "PasswordResetRequest"
]);

const scopedWhere = (where, companyId) => ({
  AND: [where || {}, { companyId }]
});

// Every workspace request automatically receives a company filter and every
// record it creates receives the same company ID. This is defense in depth:
// controllers cannot accidentally expose another company's data.
const prisma = basePrisma.$extends({ query: { $allModels: { async $allOperations({ model, operation, args, query }) {
  const context = tenantContext.get();
  const companyId = context.companyId;

  if (!companyId || context.isPlatformAdmin || !TENANT_MODELS.has(model)) {
    return query(args);
  }

  const readActions = new Set([
    "findMany", "findFirst", "findFirstOrThrow", "count", "aggregate", "groupBy"
  ]);

  if (readActions.has(operation)) {
    args = args || {};
    args.where = scopedWhere(args.where, companyId);
  }

  if (operation === "findUnique" || operation === "findUniqueOrThrow") {
    // Prisma extensions cannot safely turn a unique query into a filtered one.
    // Validate ownership first, then run the original unique query.
    const delegate = basePrisma[model.charAt(0).toLowerCase() + model.slice(1)];
    const existing = await delegate.findFirst({ where: scopedWhere(args.where, companyId), select: { id: true } });
    if (!existing) {
      if (operation === "findUnique") return null;
      const error = new Error("Record not found in this workspace.");
      error.code = "TENANT_RECORD_NOT_FOUND";
      throw error;
    }
  }

  if (operation === "create") {
    args.data.companyId = companyId;
  }

  if (operation === "createMany") {
    const records = Array.isArray(args.data) ? args.data : [args.data];
    records.forEach((record) => { record.companyId = companyId; });
  }

  if (["update", "delete", "upsert"].includes(operation)) {
    const delegate = basePrisma[model.charAt(0).toLowerCase() + model.slice(1)];
    const existing = await delegate.findFirst({ where: scopedWhere(args.where, companyId), select: { id: true } });
    if (operation === "upsert" && !existing) {
      args.create.companyId = companyId;
      return query(args);
    }
    if (!existing) {
      const error = new Error("Record not found in this workspace.");
      error.code = "TENANT_RECORD_NOT_FOUND";
      throw error;
    }
    args.where = { id: existing.id };
    if (operation === "upsert") {
      args.create.companyId = companyId;
    }
  }

  if (["updateMany", "deleteMany"].includes(operation)) {
    args = args || {};
    args.where = scopedWhere(args.where, companyId);
  }

  return query(args);
} } } });

module.exports = prisma;
