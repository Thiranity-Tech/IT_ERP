import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import Layout from "../components/Layout";
import { canManagePayroll } from "../constants/roles";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const currentMonth = () => new Date().toISOString().slice(0, 7);

function Payroll() {
  const roleId = Number(localStorage.getItem("roleId") || 1);
  const canEditPayroll = canManagePayroll(roleId);
  const [payrolls, setPayrolls] = useState([]);
  const [summary, setSummary] = useState({
    payrollCount: 0,
    totalSalaryPaid: 0,
    totalIncentives: 0,
    totalLossOfPay: 0,
    averageSalary: 0,
  });
  const [users, setUsers] = useState([]);
  const [month, setMonth] = useState(currentMonth());
  const [userId, setUserId] = useState("");
  const [overtimeAmount, setOvertimeAmount] = useState("");
  const [incentiveAmount, setIncentiveAmount] = useState("");
  const [lossOfPay, setLossOfPay] = useState("");
  const [generating, setGenerating] = useState(false);
  const [lastDetails, setLastDetails] = useState(null);

  const fetchPayroll = useCallback(async () => {
    try {
      const [payrollRes, summaryRes] = await Promise.all([
        api.get("/payrolls"),
        api.get("/payrolls/summary"),
      ]);
      setPayrolls(payrollRes.data);
      setSummary(summaryRes.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    Promise.all([
      api.get("/payrolls"),
      api.get("/payrolls/summary"),
    ])
      .then(([payrollRes, summaryRes]) => {
        setPayrolls(payrollRes.data);
        setSummary(summaryRes.data);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (!canEditPayroll) return;

    api
      .get("/users")
      .then((res) => {
        setUsers(res.data);
        if (res.data?.length) setUserId(String(res.data[0].id));
      })
      .catch((err) => console.error(err));
  }, [canEditPayroll]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!month || !userId) return;

    const payload = {
      month,
      userId,
      ...(overtimeAmount !== "" ? { overtimeAmount } : {}),
      ...(incentiveAmount !== "" ? { incentiveAmount } : {}),
      ...(lossOfPay !== "" ? { lossOfPay } : {}),
    };

    try {
      setGenerating(true);
      const res = await api.post("/payrolls/generate", payload);
      setLastDetails(res.data.details || null);
      setOvertimeAmount("");
      setIncentiveAmount("");
      setLossOfPay("");
      await fetchPayroll();
      alert("Payroll generated successfully");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to generate payroll");
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this payroll record?")) return;

    try {
      await api.delete(`/payrolls/${id}`);
      await fetchPayroll();
      alert("Payroll deleted successfully");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to delete payroll");
    }
  };

  const handleDownloadPayslip = (payroll) => {
    const pdfBlob = buildPayslipPdf(payroll);
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `payslip-${String(payroll.user?.employeeId || payroll.user?.name || "employee")
      .replace(/[^a-z0-9-_]+/gi, "-")
      .toLowerCase()}-${payroll.month}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <Layout>
      <div className="dashboard-page">
        <div className="table-toolbar">
          <div>
            <h1>Payroll</h1>
            <p className="subtle">
              Payslips, overtime, manual payroll incentives, and loss-of-pay for the current workspace.
            </p>
          </div>
        </div>

        <section className="stats-grid">
          <div className="stat-card">
            <div className="label">Payroll Records</div>
            <div className="value">{summary.payrollCount || 0}</div>
            <div className="hint">Generated payslips</div>
          </div>
          <div className="stat-card">
            <div className="label">Salary Paid</div>
            <div className="value">{currency.format(summary.totalSalaryPaid || 0)}</div>
            <div className="hint">Total final salary</div>
          </div>
          <div className="stat-card">
            <div className="label">Incentives</div>
            <div className="value">{currency.format(summary.totalIncentives || 0)}</div>
            <div className="hint">Stored payroll incentive amounts</div>
          </div>
          <div className="stat-card">
            <div className="label">Loss Of Pay</div>
            <div className="value">{currency.format(summary.totalLossOfPay || 0)}</div>
            <div className="hint">Absence deductions</div>
          </div>
        </section>

        {canEditPayroll && (
          <section className="section-grid payroll-grid">
            <div className="workspace-card">
              <h3>Generate Payroll</h3>
              <form className="form-grid" onSubmit={handleGenerate}>
                <label className="field">
                  <span>Month</span>
                  <input
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    required
                  />
                </label>

                <label className="field">
                  <span>Employee</span>
                  <select
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    required
                  >
                    <option value="">Select employee</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.employeeId} - {user.name}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="form-row">
                  <label className="field">
                    <span>Overtime Override</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Auto"
                      value={overtimeAmount}
                      onChange={(e) => setOvertimeAmount(e.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>Manual Payroll Incentive</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Only if added"
                      value={incentiveAmount}
                      onChange={(e) => setIncentiveAmount(e.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>Loss Of Pay Override</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Auto"
                      value={lossOfPay}
                      onChange={(e) => setLossOfPay(e.target.value)}
                    />
                  </label>
                </div>

                <div className="form-actions">
                  <button
                    className="btn btn-primary"
                    disabled={generating || !userId}
                    type="submit"
                  >
                    {generating ? "Generating..." : "Generate Payroll"}
                  </button>
                </div>
              </form>
            </div>

            <div className="workspace-card">
              <h3>Calculation Snapshot</h3>
              {lastDetails ? (
                <div className="dashboard-list">
                  <PayrollMetric label="Base salary" value={currency.format(lastDetails.baseSalary || 0)} />
                  <PayrollMetric label="Working days" value={lastDetails.workingDays || 0} />
                  <PayrollMetric label="Present days" value={lastDetails.presentDays || 0} />
                  <PayrollMetric label="Absent days" value={lastDetails.absentDays || 0} />
                  <PayrollMetric label="Overtime minutes" value={lastDetails.overtimeMinutes || 0} />
                  <PayrollMetric
                    label="Recorded incentives"
                    value={currency.format(lastDetails.recordedIncentives || 0)}
                  />
                </div>
              ) : (
                <div className="empty-state">Generate payroll to see the attendance calculation.</div>
              )}
            </div>
          </section>
        )}

        <div className="table-panel">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Month</th>
                <th>Attendance</th>
                <th>Overtime</th>
                <th>Incentive</th>
                <th>Loss Of Pay</th>
                <th>Final Salary</th>
                <th>Payslip</th>
                {canEditPayroll && <th>Actions</th>}
              </tr>
            </thead>

            <tbody>
              {payrolls.map((payroll) => (
                <tr key={payroll.id}>
                  <td>
                    <strong>{payroll.user?.name || "Employee"}</strong>
                    <span className="table-subtext">
                      {payroll.user?.employeeId || "-"}
                      {payroll.user?.designation ? ` | ${payroll.user.designation}` : ""}
                    </span>
                  </td>
                  <td>{payroll.month}</td>
                  <td>{payroll.attendancePercentage}%</td>
                  <td>{currency.format(payroll.overtimeAmount || 0)}</td>
                  <td>{currency.format(payroll.incentiveAmount || 0)}</td>
                  <td>{currency.format(payroll.lossOfPay || 0)}</td>
                  <td>
                    <strong>{currency.format(payroll.finalSalary || 0)}</strong>
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleDownloadPayslip(payroll)}
                      type="button"
                    >
                      Download PDF
                    </button>
                  </td>
                  {canEditPayroll && (
                    <td>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(payroll.id)}
                        type="button"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {!payrolls.length && (
                <tr>
                    <td colSpan={canEditPayroll ? 9 : 8}>
                    <div className="empty-state">No payroll records found.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}

function PayrollMetric({ label, value }) {
  return (
    <div className="activity-row">
      <div>
        <strong>{label}</strong>
        <span>Generated from attendance and payroll rules</span>
      </div>
      <span className="pill pill-blue">{value}</span>
    </div>
  );
}

function buildPayslipPdf(payroll) {
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 40;
  const lines = [];

  const addLine = (x1, y1, x2, y2, width = 1) => {
    lines.push(`${width} w ${x1} ${y1} m ${x2} ${y2} l S`);
  };

  const addRect = (x, y, w, h, width = 1) => {
    lines.push(`${width} w ${x} ${y} ${w} ${h} re S`);
  };

  const text = (x, y, size, value, bold = false) => {
    const font = bold ? "/F2" : "/F1";
    lines.push(`BT ${font} ${size} Tf ${x} ${y} Td (${escapePdf(value)}) Tj ET`);
  };

  lines.push("0 0 0 RG");

  const headerTop = pageHeight - margin;
  text(margin, headerTop - 10, 10, "IT ERP PAYSLIP", true);
  text(margin, headerTop - 35, 24, "Payslip", true);
  text(margin, headerTop - 58, 10, "Generated from IT ERP payroll records");

  addLine(margin, headerTop - 76, pageWidth - margin, headerTop - 76, 1.2);

  const cardWidth = (pageWidth - margin * 2 - 12) / 2;
  const boxHeight = 64;
  const firstRowTop = headerTop - 102;
  const secondRowTop = firstRowTop - boxHeight - 16;

  const drawInfoCard = (x, y, label, value) => {
    addRect(x, y - boxHeight, cardWidth, boxHeight, 0.8);
    text(x + 14, y - 16, 9, label);
    text(x + 14, y - 36, 16, value, true);
  };

  drawInfoCard(margin, firstRowTop, "Employee", payroll.user?.name || "-");
  drawInfoCard(margin + cardWidth + 12, firstRowTop, "Employee ID", payroll.user?.employeeId || "-");
  drawInfoCard(margin, secondRowTop, "Month", payroll.month || "-");
  drawInfoCard(margin + cardWidth + 12, secondRowTop, "Designation", payroll.user?.designation || "-");

  const tableTop = secondRowTop - boxHeight - 36;
  const left = margin;
  const tableWidth = pageWidth - margin * 2;
  const halfWidth = (tableWidth - 12) / 2;
  const sectionHeight = 146;
  const earningsX = left;
  const deductionsX = left + halfWidth + 12;

  addRect(left, tableTop - sectionHeight, tableWidth, sectionHeight, 0.9);
  addLine(left + halfWidth, tableTop - sectionHeight, left + halfWidth, tableTop, 0.8);
  text(earningsX + 12, tableTop - 10, 12, "Earnings", true);
  text(deductionsX + 12, tableTop - 10, 12, "Deductions", true);
  addLine(left, tableTop - 22, left + tableWidth, tableTop - 22, 0.8);

  const baseSalary = roundNumber(
    payroll.baseSalary ?? payroll.user?.salary ?? (
      roundNumber(payroll.finalSalary || 0) -
      roundNumber(payroll.overtimeAmount || 0) -
      roundNumber(payroll.incentiveAmount || 0) +
      roundNumber(payroll.lossOfPay || 0)
    )
  );
  const grossPay = roundNumber(baseSalary + (payroll.overtimeAmount || 0) + (payroll.incentiveAmount || 0));
  const netPay = roundNumber(payroll.finalSalary || 0);

  const earnings = [
    ["Basic Salary", formatPdfMoney(baseSalary)],
    ["Overtime Pay", formatPdfMoney(roundNumber(payroll.overtimeAmount || 0))],
    ["Bonus / Incentive", formatPdfMoney(roundNumber(payroll.incentiveAmount || 0))],
    ["Gross Salary", formatPdfMoney(grossPay)],
  ];
  const deductions = [
    ["Loss of Pay", formatPdfMoney(roundNumber(payroll.lossOfPay || 0))],
    ["Net Pay", formatPdfMoney(netPay)],
    ["Attendance", `${roundNumber(payroll.attendancePercentage || 0)}%`],
    ["", ""],
  ];

  earnings.forEach((item, index) => {
    const y = tableTop - 48 - index * 24;
    text(earningsX + 12, y, 9, item[0]);
    text(earningsX + halfWidth - 88, y, 9, item[1], true);
  });

  deductions.forEach((item, index) => {
    const y = tableTop - 48 - index * 24;
    text(deductionsX + 12, y, 9, item[0]);
    text(deductionsX + halfWidth - 88, y, 9, item[1], true);
  });

  const totalY = tableTop - 190;
  addRect(margin, totalY - 10, pageWidth - margin * 2, 70, 1.0);
  text(margin + 12, totalY + 32, 9, "Net Pay", true);
  text(margin + 12, totalY + 12, 22, currency.format(roundNumber(payroll.finalSalary || 0)), true);
  text(pageWidth - margin - 200, totalY + 18, 10, "Prepared by IT ERP");

  addLine(margin, totalY - 18, pageWidth - margin, totalY - 18, 0.8);
  text(margin, totalY - 38, 8, "If you have questions, contact the finance department.");

  const content = lines.join("\n");
  return createPdfBlob(content, pageWidth, pageHeight);
}

function roundNumber(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function formatPdfMoney(value) {
  return `INR ${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0
  }).format(roundNumber(value || 0))}`;
}

function escapePdf(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function createPdfBlob(content, pageWidth, pageHeight) {
  const objects = [];
  const encoder = new TextEncoder();
  const addObject = (body) => {
    objects.push(body);
    return objects.length;
  };

  const font1 = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const font2 = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  const stream = addObject(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  const page = addObject(
    `<< /Type /Page /Parent 5 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${font1} 0 R /F2 ${font2} 0 R >> >> /Contents ${stream} 0 R >>`
  );
  const pages = addObject(`<< /Type /Pages /Kids [${page} 0 R] /Count 1 >>`);
  const catalog = addObject(`<< /Type /Catalog /Pages ${pages} 0 R >>`);

  const parts = [];
  const offsets = [0];
  let position = 0;
  const pushChunk = (value) => {
    const chunk = encoder.encode(value);
    parts.push(chunk);
    position += chunk.length;
  };

  pushChunk("%PDF-1.4\n");

  objects.forEach((body, index) => {
    offsets[index + 1] = position;
    pushChunk(`${index + 1} 0 obj\n${body}\nendobj\n`);
  });

  const xrefStart = position;
  pushChunk(`xref\n0 ${objects.length + 1}\n`);
  pushChunk("0000000000 65535 f \n");
  for (let i = 1; i <= objects.length; i += 1) {
    pushChunk(`${String(offsets[i]).padStart(10, "0")} 00000 n \n`);
  }
  pushChunk(`trailer\n<< /Size ${objects.length + 1} /Root ${catalog} 0 R >>\nstartxref\n${xrefStart}\n%%EOF`);

  const totalLength = parts.reduce((sum, chunk) => sum + chunk.length, 0);
  const output = new Uint8Array(totalLength);
  let offset = 0;

  parts.forEach((chunk) => {
    output.set(chunk, offset);
    offset += chunk.length;
  });

  return new Blob([output], { type: "application/pdf" });
}

export default Payroll;
