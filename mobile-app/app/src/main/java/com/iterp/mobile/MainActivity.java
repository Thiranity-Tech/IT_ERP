package com.iterp.mobile;

import android.content.Intent;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.LinearLayout;

import org.json.JSONObject;

public class MainActivity extends android.app.Activity {
    private SessionManager session;
    private ApiClient api;
    private AppShell.Shell shell;
    private LinearLayout metricsContainer;
    private LinearLayout recentProjectsBox;
    private LinearLayout recentLeavesBox;
    private LinearLayout recentTicketsBox;
    private LinearLayout recentPayrollBox;
    private LinearLayout root;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        session = new SessionManager(this);
        api = new ApiClient(this);

        if (!session.isLoggedIn()) {
            logout();
            return;
        }

        render();
        loadDashboard();
    }

    private void render() {
        shell = AppShell.create(this, "IT ERP Workspace", "Workspace-driven dashboard inspired by ERPNext.");
        AppShell.populateDefaultDrawer(this, session, shell);
        root = shell.content();

        root.addView(ErpUi.section(this, "Summary"));
        metricsContainer = new LinearLayout(this);
        metricsContainer.setOrientation(LinearLayout.VERTICAL);
        root.addView(metricsContainer);

        root.addView(ErpUi.section(this, "Quick Actions"));
        root.addView(twoTileRow(
                tile("Apply Leave", "Submit a leave request", ErpUi.GREEN, v -> startActivity(new Intent(this, LeaveRequestActivity.class))),
                tile("Daily Scrum", "Share yesterday, today, blockers", ErpUi.BLUE, v -> startActivity(new Intent(this, DailyScrumActivity.class)))
        ));
        root.addView(twoTileRow(
                tile("Change Password", "Update your login password", ErpUi.GOLD, v -> startActivity(new Intent(this, ChangePasswordActivity.class))),
                tile("Notifications", "Open your announcements", ErpUi.MUTED, v -> openList("Notifications", "/notifications"))
        ));

        root.addView(ErpUi.section(this, "Development"));
        root.addView(twoTileRow(
                tile("Projects", "Deadlines, priorities, clients", ErpUi.BLUE, v -> openList("Projects", "/projects")),
                tile("Tasks", "Assigned work and status", ErpUi.GREEN, v -> openList("Tasks", "/tasks"))
        ));
        root.addView(twoTileRow(
                tile("Daily Scrums", "Team progress updates", ErpUi.GOLD, v -> openList("Daily Scrums", "/daily-scrums")),
                tile("Project Notes", "Project documentation notes", ErpUi.MUTED, v -> openList("Project Notes", "/project-notes"))
        ));

        root.addView(ErpUi.section(this, "HR"));
        root.addView(twoTileRow(
                tile("Attendance", "Uploaded records and reports", ErpUi.GOLD, v -> openList("Attendance", "/attendance")),
                tile("Leave Requests", "Approvals and history", ErpUi.RED, v -> openList("Leave Requests", "/leave-requests"))
        ));
        root.addView(twoTileRow(
                tile("Payrolls", "Salary and deductions", ErpUi.BLUE, v -> openList("Payrolls", "/payrolls")),
                tile("Incentives", "Rewards and bonuses", ErpUi.GREEN, v -> openList("Incentives", "/incentives"))
        ));

        root.addView(ErpUi.section(this, "CRM & Support"));
        root.addView(twoTileRow(
                tile("Support Tickets", "Helpdesk and client issues", ErpUi.MUTED, v -> openList("Support Tickets", "/support-tickets")),
                tile("Reports", "Exports and document lists", ErpUi.BLUE, v -> openList("Reports", "/reports"))
        ));
        root.addView(twoTileRow(
                tile("Notifications", "Inbox and announcements", ErpUi.MUTED, v -> openList("Notifications", "/notifications")),
                tile("Leave Requests", "Review your leave history", ErpUi.RED, v -> openList("Leave Requests", "/leave-requests"))
        ));

        if (isTeamLeaderOrAbove()) {
            root.addView(ErpUi.section(this, "Team Tools"));
            root.addView(twoTileRow(
                    tile("Users", "Team members and profiles", ErpUi.MUTED, v -> openList("Users", "/users")),
                    tile("Teams", "Team structure and members", ErpUi.MUTED, v -> openList("Teams", "/teams"))
            ));
        }

        if (isAdminOrAbove()) {
            root.addView(ErpUi.section(this, "Administration"));
            root.addView(twoTileRow(
                    tile("Departments", "Department structure", ErpUi.MUTED, v -> openList("Departments", "/departments")),
                    tile("Analytics", "Charts and summaries", ErpUi.GOLD, v -> openList("Analytics", "/analytics/overview"))
            ));
            root.addView(twoTileRow(
                    tile("Users", "Manage accounts", ErpUi.MUTED, v -> openList("Users", "/users")),
                    tile("Teams", "Organizational groups", ErpUi.MUTED, v -> openList("Teams", "/teams"))
            ));
        }

        if (isManagerOrAbove()) {
            root.addView(ErpUi.section(this, "Finance & CRM"));
            root.addView(twoTileRow(
                    tile("Payrolls", "Salary and deductions", ErpUi.BLUE, v -> openList("Payrolls", "/payrolls")),
                    tile("Clients", "Client registry", ErpUi.GREEN, v -> openList("Clients", "/clients"))
            ));
            root.addView(twoTileRow(
                    tile("Leave Approvals", "Review team leave requests", ErpUi.RED, v -> openList("Leave Requests", "/leave-requests")),
                    tile("Incentives", "Rewards and bonuses", ErpUi.GREEN, v -> openList("Incentives", "/incentives"))
            ));
        }

        if (isSuperAdmin()) {
            root.addView(ErpUi.section(this, "System"));
            root.addView(twoTileRow(
                    tile("Roles", "Available user roles", ErpUi.MUTED, v -> openList("Roles", "/roles")),
                    tile("Office Settings", "Company-wide configuration", ErpUi.GOLD, v -> openList("Office Settings", "/api/office-settings"))
            ));
            root.addView(twoTileRow(
                    tile("Reports", "All uploaded reports", ErpUi.BLUE, v -> openList("Reports", "/reports")),
                    tile("Analytics", "Company-wide insights", ErpUi.GREEN, v -> openList("Analytics", "/analytics/overview"))
            ));
        }

        root.addView(ErpUi.section(this, "Recent Activity"));

        recentProjectsBox = ErpUi.card(this);
        recentProjectsBox.addView(ErpUi.text(this, "Recent Projects", 16, ErpUi.TEXT, true));
        root.addView(recentProjectsBox);

        recentLeavesBox = ErpUi.card(this);
        recentLeavesBox.addView(ErpUi.text(this, "Recent Leaves", 16, ErpUi.TEXT, true));
        root.addView(recentLeavesBox);

        recentTicketsBox = ErpUi.card(this);
        recentTicketsBox.addView(ErpUi.text(this, "Recent Tickets", 16, ErpUi.TEXT, true));
        root.addView(recentTicketsBox);

        recentPayrollBox = ErpUi.card(this);
        recentPayrollBox.addView(ErpUi.text(this, "Recent Payroll", 16, ErpUi.TEXT, true));
        root.addView(recentPayrollBox);
    }

    private void loadDashboard() {
        metricsContainer.removeAllViews();
        metricsContainer.addView(loadingCard("Loading dashboard..."));
        recentProjectsBox.removeAllViews();
        recentProjectsBox.addView(ErpUi.text(this, "Recent Projects", 16, ErpUi.TEXT, true));
        recentProjectsBox.addView(ErpUi.body(this, "Loading..."));
        recentLeavesBox.removeAllViews();
        recentLeavesBox.addView(ErpUi.text(this, "Recent Leaves", 16, ErpUi.TEXT, true));
        recentLeavesBox.addView(ErpUi.body(this, "Loading..."));
        recentTicketsBox.removeAllViews();
        recentTicketsBox.addView(ErpUi.text(this, "Recent Tickets", 16, ErpUi.TEXT, true));
        recentTicketsBox.addView(ErpUi.body(this, "Loading..."));
        recentPayrollBox.removeAllViews();
        recentPayrollBox.addView(ErpUi.text(this, "Recent Payroll", 16, ErpUi.TEXT, true));
        recentPayrollBox.addView(ErpUi.body(this, "Loading..."));

        api.get("/dashboard", new ApiClient.Callback() {
            @Override
            public void onComplete(int code, String body) {
                metricsContainer.removeAllViews();
                if (code >= 200 && code < 300) {
                    try {
                        JSONObject dashboard = new JSONObject(body);
                        addMetricRow(
                                metricTile("Employees", dashboard.optString("totalEmployees", "0"), "Current user accounts", ErpUi.BLUE),
                                metricTile("Projects", dashboard.optString("totalProjects", "0"), "Tracked projects", ErpUi.GREEN)
                        );
                        addMetricRow(
                                metricTile("Active", dashboard.optString("activeProjects", "0"), "Active projects", ErpUi.GOLD),
                                metricTile("Pending Leaves", dashboard.optString("pendingLeaves", "0"), "Awaiting approval", ErpUi.RED)
                        );
                        addMetricRow(
                                metricTile("Open Tickets", dashboard.optString("openTickets", "0"), "Support queue", ErpUi.MUTED),
                                metricSpacer()
                        );
                        renderRecentProjects(dashboard.optJSONArray("recentProjects"));
                        renderRecentLeaves(dashboard.optJSONArray("recentLeaves"));
                        renderRecentTickets(dashboard.optJSONArray("recentTickets"));
                        renderRecentPayroll(dashboard.optJSONArray("recentPayrolls"));
                    } catch (Exception exception) {
                        metricsContainer.addView(loadingCard("Dashboard response could not be read."));
                    }
                } else {
                    metricsContainer.addView(loadingCard(body.isEmpty() ? "Dashboard failed." : body));
                }
            }

            @Override
            public void onError(String message) {
                metricsContainer.removeAllViews();
                metricsContainer.addView(loadingCard("Cannot load dashboard: " + message));
            }
        });
    }

    private void renderRecentProjects(org.json.JSONArray projects) {
        recentProjectsBox.removeAllViews();
        recentProjectsBox.addView(ErpUi.text(this, "Recent Projects", 16, ErpUi.TEXT, true));
        if (projects == null || projects.length() == 0) {
            recentProjectsBox.addView(ErpUi.body(this, "No recent projects."));
            return;
        }
        for (int i = 0; i < projects.length(); i++) {
            JSONObject project = projects.optJSONObject(i);
            if (project == null) continue;
            recentProjectsBox.addView(recentRow(
                    project.optString("name", "Project"),
                    project.optString("clientName", ""),
                    project.optString("status", ""),
                    statusColor(project.optString("status", ""))
            ));
        }
    }

    private void renderRecentLeaves(org.json.JSONArray leaves) {
        recentLeavesBox.removeAllViews();
        recentLeavesBox.addView(ErpUi.text(this, "Recent Leaves", 16, ErpUi.TEXT, true));
        if (leaves == null || leaves.length() == 0) {
            recentLeavesBox.addView(ErpUi.body(this, "No recent leave requests."));
            return;
        }
        for (int i = 0; i < leaves.length(); i++) {
            JSONObject leave = leaves.optJSONObject(i);
            if (leave == null) continue;
            JSONObject user = leave.optJSONObject("user");
            recentLeavesBox.addView(recentRow(
                    user != null ? user.optString("name", "Employee") : "Employee",
                    leave.optString("leaveType", ""),
                    leave.optString("status", ""),
                    statusColor(leave.optString("status", ""))
            ));
        }
    }

    private void renderRecentTickets(org.json.JSONArray tickets) {
        recentTicketsBox.removeAllViews();
        recentTicketsBox.addView(ErpUi.text(this, "Recent Tickets", 16, ErpUi.TEXT, true));
        if (tickets == null || tickets.length() == 0) {
            recentTicketsBox.addView(ErpUi.body(this, "No recent tickets."));
            return;
        }
        for (int i = 0; i < tickets.length(); i++) {
            JSONObject ticket = tickets.optJSONObject(i);
            if (ticket == null) continue;
            JSONObject client = ticket.optJSONObject("client");
            recentTicketsBox.addView(recentRow(
                    ticket.optString("title", "Ticket"),
                    client != null ? client.optString("name", "") : "",
                    ticket.optString("status", ""),
                    statusColor(ticket.optString("status", ""))
            ));
        }
    }

    private void renderRecentPayroll(org.json.JSONArray payrolls) {
        recentPayrollBox.removeAllViews();
        recentPayrollBox.addView(ErpUi.text(this, "Recent Payroll", 16, ErpUi.TEXT, true));
        if (payrolls == null || payrolls.length() == 0) {
            recentPayrollBox.addView(ErpUi.body(this, "No payroll records yet."));
            return;
        }
        for (int i = 0; i < payrolls.length(); i++) {
            JSONObject payroll = payrolls.optJSONObject(i);
            if (payroll == null) continue;
            JSONObject user = payroll.optJSONObject("user");
            recentPayrollBox.addView(recentRow(
                    user != null ? user.optString("name", "Employee") : "Employee",
                    payroll.optString("month", ""),
                    payroll.optString("finalSalary", ""),
                    ErpUi.BLUE
            ));
        }
    }

    private LinearLayout recentRow(String title, String subtitle, String status, int tint) {
        LinearLayout row = ErpUi.card(this);
        row.setPadding(ErpUi.dp(this, 14), ErpUi.dp(this, 12), ErpUi.dp(this, 14), ErpUi.dp(this, 12));
        row.addView(ErpUi.text(this, title, 15, ErpUi.TEXT, true));
        if (subtitle != null && !subtitle.isEmpty()) {
            row.addView(ErpUi.body(this, subtitle));
        }
        if (status != null && !status.isEmpty()) {
            LinearLayout badgeRow = ErpUi.row(this);
            badgeRow.addView(badge(status, tint));
            row.addView(badgeRow);
        }
        return row;
    }

    private LinearLayout badge(String text, int tint) {
        LinearLayout badge = ErpUi.tintedCard(this, tint);
        badge.setPadding(ErpUi.dp(this, 10), ErpUi.dp(this, 6), ErpUi.dp(this, 10), ErpUi.dp(this, 6));
        badge.removeAllViews();
        badge.addView(ErpUi.text(this, text, 12, tint, true));
        return badge;
    }

    private LinearLayout loadingCard(String message) {
        LinearLayout card = ErpUi.card(this);
        card.addView(ErpUi.body(this, message));
        return card;
    }

    private void addMetricRow(LinearLayout left, LinearLayout right) {
        LinearLayout row = ErpUi.row(this);
        row.setGravity(Gravity.CENTER_VERTICAL);
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        params.setMargins(0, 0, ErpUi.dp(this, 8), ErpUi.dp(this, 8));
        left.setLayoutParams(params);
        LinearLayout.LayoutParams paramsRight = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        paramsRight.setMargins(ErpUi.dp(this, 8), 0, 0, ErpUi.dp(this, 8));
        right.setLayoutParams(paramsRight);
        row.addView(left);
        row.addView(right);
        metricsContainer.addView(row);
    }

    private LinearLayout metricTile(String label, String value, String hint, int tint) {
        LinearLayout tile = ErpUi.tintedCard(this, tint);
        tile.setPadding(ErpUi.dp(this, 14), ErpUi.dp(this, 12), ErpUi.dp(this, 14), ErpUi.dp(this, 12));
        tile.addView(ErpUi.text(this, label, 13, tint, true));
        tile.addView(ErpUi.text(this, value, 24, ErpUi.TEXT, true));
        tile.addView(ErpUi.body(this, hint));
        return tile;
    }

    private LinearLayout metricSpacer() {
        LinearLayout spacer = ErpUi.card(this);
        spacer.setVisibility(View.INVISIBLE);
        return spacer;
    }

    private LinearLayout tile(String title, String subtitle, int tint, View.OnClickListener listener) {
        LinearLayout tile = ErpUi.tintedCard(this, tint);
        tile.setPadding(ErpUi.dp(this, 14), ErpUi.dp(this, 14), ErpUi.dp(this, 14), ErpUi.dp(this, 14));
        tile.setClickable(true);
        tile.setFocusable(true);
        tile.setOnClickListener(listener);
        tile.addView(ErpUi.text(this, title, 15, ErpUi.TEXT, true));
        tile.addView(ErpUi.body(this, subtitle));
        return tile;
    }

    private LinearLayout twoTileRow(LinearLayout left, LinearLayout right) {
        LinearLayout row = ErpUi.row(this);
        LinearLayout.LayoutParams leftParams = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        leftParams.setMargins(0, 0, ErpUi.dp(this, 8), ErpUi.dp(this, 8));
        left.setLayoutParams(leftParams);
        LinearLayout.LayoutParams rightParams = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        rightParams.setMargins(ErpUi.dp(this, 8), 0, 0, ErpUi.dp(this, 8));
        right.setLayoutParams(rightParams);
        row.addView(left);
        row.addView(right);
        return row;
    }

    private Button actionButton(String label, int tint, View.OnClickListener listener) {
        Button button = ErpUi.button(this, label, tint);
        button.setLayoutParams(new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        ));
        button.setOnClickListener(listener);
        return button;
    }

    private void openList(String title, String endpoint) {
        Intent intent = new Intent(this, JsonListActivity.class);
        intent.putExtra(JsonListActivity.EXTRA_TITLE, title);
        intent.putExtra(JsonListActivity.EXTRA_ENDPOINT, endpoint);
        startActivity(intent);
    }

    private boolean isTeamLeaderOrAbove() {
        return session.getRoleId() >= 2;
    }

    private boolean isAdminOrAbove() {
        return session.getRoleId() >= 4;
    }

    private boolean isManagerOrAbove() {
        return session.getRoleId() >= 3;
    }

    private boolean isSuperAdmin() {
        return session.getRoleId() >= 5;
    }

    private int statusColor(String status) {
        String normalized = String.valueOf(status).toUpperCase();
        if (normalized.contains("APPRO") || normalized.contains("COMP") || normalized.contains("CLOS")) {
            return ErpUi.GREEN;
        }
        if (normalized.contains("REJ") || normalized.contains("OVER")) {
            return ErpUi.RED;
        }
        if (normalized.contains("ACT") || normalized.contains("PROG")) {
            return ErpUi.BLUE;
        }
        if (normalized.contains("PEND") || normalized.contains("OPEN")) {
            return ErpUi.GOLD;
        }
        return ErpUi.MUTED;
    }

    private void logout() {
        session.clear();
        startActivity(new Intent(this, LoginActivity.class));
        finish();
    }
}
