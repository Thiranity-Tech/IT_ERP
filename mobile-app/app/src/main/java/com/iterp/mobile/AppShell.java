package com.iterp.mobile;

import android.app.Activity;
import android.graphics.Color;
import android.graphics.Typeface;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ScrollView;

public final class AppShell {
    private AppShell() {
    }

    public static Shell create(Activity activity, String title, String subtitle) {
        FrameLayout root = new FrameLayout(activity);
        root.setBackgroundColor(ErpUi.BG);

        LinearLayout page = new LinearLayout(activity);
        page.setOrientation(LinearLayout.VERTICAL);
        page.setPadding(ErpUi.dp(activity, 16), ErpUi.dp(activity, 16), ErpUi.dp(activity, 16), ErpUi.dp(activity, 24));

        ScrollView scrollView = new ScrollView(activity);
        scrollView.setFillViewport(true);
        scrollView.setVerticalScrollBarEnabled(false);
        scrollView.addView(page, new ScrollView.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        ));
        root.addView(scrollView, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));

        View scrim = new View(activity);
        scrim.setBackgroundColor(Color.argb(120, 0, 0, 0));
        scrim.setVisibility(View.GONE);
        root.addView(scrim, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));

        LinearLayout drawer = new LinearLayout(activity);
        drawer.setOrientation(LinearLayout.VERTICAL);
        drawer.setBackgroundColor(Color.WHITE);
        drawer.setPadding(ErpUi.dp(activity, 16), ErpUi.dp(activity, 18), ErpUi.dp(activity, 16), ErpUi.dp(activity, 18));

        ScrollView drawerScroll = new ScrollView(activity);
        drawerScroll.setFillViewport(true);
        drawerScroll.setVerticalScrollBarEnabled(false);
        drawerScroll.addView(drawer, new ScrollView.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        ));
        FrameLayout.LayoutParams drawerParams = new FrameLayout.LayoutParams(
                ErpUi.dp(activity, 280),
                ViewGroup.LayoutParams.MATCH_PARENT
        );
        drawerParams.gravity = Gravity.START;
        root.addView(drawerScroll, drawerParams);

        Shell shell = new Shell(root, page, drawer, drawerScroll, scrim);
        scrim.setOnClickListener(v -> shell.close());

        drawerScroll.setTranslationX(-ErpUi.dp(activity, 300));

        LinearLayout header = ErpUi.tintedCard(activity, ErpUi.BLUE);
        header.setPadding(ErpUi.dp(activity, 16), ErpUi.dp(activity, 16), ErpUi.dp(activity, 16), ErpUi.dp(activity, 16));
        LinearLayout headerRow = ErpUi.row(activity);

        LinearLayout headerCopy = new LinearLayout(activity);
        headerCopy.setOrientation(LinearLayout.VERTICAL);
        headerCopy.setPadding(0, 0, 0, 0);
        headerCopy.addView(ErpUi.text(activity, title, 22, ErpUi.TEXT, true));
        if (subtitle != null && !subtitle.isEmpty()) {
            headerCopy.addView(ErpUi.body(activity, subtitle));
        }
        headerRow.addView(headerCopy);
        header.addView(headerRow);
        page.addView(header);

        activity.setContentView(root);
        return shell;
    }

    public static void populateDefaultDrawer(Activity activity, SessionManager session, Shell shell) {
        shell.addDrawerHeader("IT ERP Mobile", session.getRoleName());
        shell.addDrawerSection("Home");
        shell.addDrawerItem("Dashboard", ErpUi.BLUE, v -> launch(activity, MainActivity.class));
        shell.addDrawerItem("Apply Leave", ErpUi.GREEN, v -> launch(activity, LeaveRequestActivity.class));
        shell.addDrawerItem("Daily Scrum", ErpUi.BLUE, v -> launch(activity, DailyScrumActivity.class));
        shell.addDrawerItem("Notifications", ErpUi.MUTED, v -> openList(activity, "Notifications", "/notifications"));
        shell.addDrawerItem("Change Password", ErpUi.GOLD, v -> launch(activity, ChangePasswordActivity.class));
        if (BuildConfig.ALLOW_API_SETTINGS) {
            shell.addDrawerItem("API Settings", ErpUi.MUTED, v -> launch(activity, SettingsActivity.class));
        }

        shell.addDrawerSection("Development");
        shell.addDrawerItem("Projects", ErpUi.BLUE, v -> openList(activity, "Projects", "/projects"));
        shell.addDrawerItem("Tasks", ErpUi.GREEN, v -> openList(activity, "Tasks", "/tasks"));
        shell.addDrawerItem("Daily Scrums", ErpUi.GOLD, v -> openList(activity, "Daily Scrums", "/daily-scrums"));
        shell.addDrawerItem("Project Notes", ErpUi.MUTED, v -> openList(activity, "Project Notes", "/project-notes"));

        shell.addDrawerSection("HR");
        shell.addDrawerItem("Attendance", ErpUi.GOLD, v -> openList(activity, "Attendance", "/attendance"));
        shell.addDrawerItem("Leave Requests", ErpUi.RED, v -> openList(activity, "Leave Requests", "/leave-requests"));
        shell.addDrawerItem("Payrolls", ErpUi.BLUE, v -> openList(activity, "Payrolls", "/payrolls"));
        shell.addDrawerItem("Incentives", ErpUi.GREEN, v -> openList(activity, "Incentives", "/incentives"));

        shell.addDrawerSection("CRM & Support");
        shell.addDrawerItem("Support Tickets", ErpUi.MUTED, v -> openList(activity, "Support Tickets", "/support-tickets"));
        shell.addDrawerItem("Reports", ErpUi.BLUE, v -> openList(activity, "Reports", "/reports"));

        if (session.getRoleId() >= 2) {
            shell.addDrawerSection("Team Tools");
            shell.addDrawerItem("Users", ErpUi.MUTED, v -> openList(activity, "Users", "/users"));
            shell.addDrawerItem("Teams", ErpUi.MUTED, v -> openList(activity, "Teams", "/teams"));
        }

        if (session.getRoleId() >= 4) {
            shell.addDrawerSection("Administration");
            shell.addDrawerItem("Departments", ErpUi.MUTED, v -> openList(activity, "Departments", "/departments"));
            shell.addDrawerItem("Analytics", ErpUi.GOLD, v -> openList(activity, "Analytics", "/analytics/overview"));
        }

        if (session.getRoleId() >= 5) {
            shell.addDrawerSection("System");
            shell.addDrawerItem("Roles", ErpUi.MUTED, v -> openList(activity, "Roles", "/roles"));
            if (BuildConfig.ALLOW_API_SETTINGS) {
                shell.addDrawerItem("Office Settings", ErpUi.GOLD, v -> launch(activity, SettingsActivity.class));
            }
        }

        shell.addDrawerSpacer();
        shell.addDrawerItem("Logout", ErpUi.RED, v -> {
            session.clear();
            launch(activity, LoginActivity.class);
            activity.finish();
        });

        shell.showSidebar();
    }

    private static void openList(Activity activity, String title, String endpoint) {
        android.content.Intent intent = new android.content.Intent(activity, JsonListActivity.class);
        intent.putExtra(JsonListActivity.EXTRA_TITLE, title);
        intent.putExtra(JsonListActivity.EXTRA_ENDPOINT, endpoint);
        launch(activity, intent);
    }

    private static void launch(Activity activity, Class<? extends Activity> target) {
        android.content.Intent intent = new android.content.Intent(activity, target);
        launch(activity, intent);
    }

    private static void launch(Activity activity, android.content.Intent intent) {
        intent.addFlags(android.content.Intent.FLAG_ACTIVITY_CLEAR_TOP | android.content.Intent.FLAG_ACTIVITY_SINGLE_TOP);
        activity.startActivity(intent);
    }

    public static final class Shell {
        private final FrameLayout root;
        private final LinearLayout content;
        private final LinearLayout drawer;
        private final View drawerPanel;
        private final View scrim;
        private boolean open;

        private Shell(FrameLayout root, LinearLayout content, LinearLayout drawer, View drawerPanel, View scrim) {
            this.root = root;
            this.content = content;
            this.drawer = drawer;
            this.drawerPanel = drawerPanel;
            this.scrim = scrim;
        }

        public FrameLayout root() {
            return root;
        }

        public LinearLayout content() {
            return content;
        }

        public LinearLayout drawer() {
            return drawer;
        }

        public void addDrawerHeader(String title, String subtitle) {
            LinearLayout header = ErpUi.tintedCard(drawer.getContext(), ErpUi.BLUE);
            header.setPadding(ErpUi.dp(drawer.getContext(), 14), ErpUi.dp(drawer.getContext(), 14), ErpUi.dp(drawer.getContext(), 14), ErpUi.dp(drawer.getContext(), 14));
            header.addView(ErpUi.text(drawer.getContext(), title, 20, ErpUi.TEXT, true));
            if (subtitle != null && !subtitle.isEmpty()) {
                header.addView(ErpUi.body(drawer.getContext(), subtitle));
            }
            drawer.addView(header);
        }

        public void addDrawerSection(String title) {
            LinearLayout section = new LinearLayout(drawer.getContext());
            section.setOrientation(LinearLayout.VERTICAL);
            section.setPadding(0, ErpUi.dp(drawer.getContext(), 10), 0, 0);
            section.addView(ErpUi.text(drawer.getContext(), title, 14, ErpUi.MUTED, true));
            drawer.addView(section);
        }

        public void addDrawerItem(String label, int tint, View.OnClickListener listener) {
            Button button = ErpUi.button(drawer.getContext(), label, tint);
            button.setAllCaps(false);
            button.setTypeface(Typeface.DEFAULT_BOLD);
            button.setOnClickListener(v -> {
                close();
                listener.onClick(v);
            });
            drawer.addView(button);
        }

        public void addDrawerSpacer() {
            ErpUi.addSpacer(drawer.getContext(), drawer, 8);
        }

        public void open() {
            open = true;
            drawerPanel.animate().translationX(0).setDuration(180).start();
            scrim.setVisibility(View.VISIBLE);
            scrim.animate().alpha(1f).setDuration(180).start();
        }

        public void showSidebar() {
            open = true;
            drawerPanel.animate().translationX(0).setDuration(0).start();
            scrim.setVisibility(View.GONE);
            scrim.setAlpha(0f);
        }

        public void close() {
            open = false;
            drawerPanel.animate().translationX(-ErpUi.dp(drawer.getContext(), 300)).setDuration(180).start();
            scrim.animate().alpha(0f).setDuration(180).withEndAction(() -> scrim.setVisibility(View.GONE)).start();
        }

        public void toggleDrawer() {
            if (open) {
                close();
            } else {
                open();
            }
        }
    }
}
