package com.iterp.mobile;

import android.os.Bundle;
import android.content.Intent;
import android.net.Uri;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.LinearLayout;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Iterator;

public class JsonListActivity extends android.app.Activity {
    public static final String EXTRA_TITLE = "title";
    public static final String EXTRA_ENDPOINT = "endpoint";

    private SessionManager session;
    private ApiClient api;
    private AppShell.Shell shell;
    private LinearLayout listBox;
    private String title;
    private String endpoint;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        session = new SessionManager(this);
        api = new ApiClient(this);
        title = getIntent().getStringExtra(EXTRA_TITLE);
        endpoint = getIntent().getStringExtra(EXTRA_ENDPOINT);
        if (title == null) {
            title = "Records";
        }
        if (endpoint == null) {
            endpoint = "/";
        }
        render();
        load();
    }

    private void render() {
        shell = AppShell.create(this, title, endpoint);
        AppShell.populateDefaultDrawer(this, session, shell);
        LinearLayout root = shell.content();

        Button refresh = ErpUi.button(this, "Refresh", ErpUi.BLUE);
        refresh.setOnClickListener(view -> load());
        root.addView(refresh);

        Button back = ErpUi.button(this, "Back", ErpUi.MUTED);
        back.setOnClickListener(view -> finish());
        root.addView(back);

        listBox = new LinearLayout(this);
        listBox.setOrientation(LinearLayout.VERTICAL);
        root.addView(listBox, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        ));
    }

    private void load() {
        listBox.removeAllViews();
        listBox.addView(ErpUi.body(this, "Loading..."));
        api.get(endpoint, new ApiClient.Callback() {
            @Override
            public void onComplete(int code, String body) {
                listBox.removeAllViews();
                if (code >= 200 && code < 300) {
                    renderBody(body);
                } else {
                    listBox.addView(ErpUi.body(JsonListActivity.this, body.isEmpty() ? "Request failed." : body));
                }
            }

            @Override
            public void onError(String message) {
                listBox.removeAllViews();
                listBox.addView(ErpUi.body(JsonListActivity.this, "Cannot reach API: " + message));
            }
        });
    }

    private void renderBody(String body) {
        try {
            String trimmed = body == null ? "" : body.trim();
            if (trimmed.startsWith("[")) {
                JSONArray array = new JSONArray(trimmed);
                if (array.length() == 0) {
                    listBox.addView(ErpUi.body(this, "No records found."));
                    return;
                }
                for (int i = 0; i < array.length(); i++) {
                    renderObject(array.optJSONObject(i), i + 1);
                }
            } else {
                renderObject(new JSONObject(trimmed), 1);
            }
        } catch (Exception exception) {
            listBox.addView(ErpUi.body(this, body));
        }
    }

    private void renderObject(JSONObject object, int index) {
        if (object == null) {
            return;
        }
        LinearLayout card = ErpUi.card(this);
        card.addView(ErpUi.text(this, displayTitle(object, index), 17, ErpUi.TEXT, true));
        String subtitle = displaySubtitle(object);
        if (!subtitle.isEmpty()) {
            card.addView(ErpUi.body(this, subtitle));
        }
        card.addView(ErpUi.body(this, formatObject(object)));
        addInlineActions(card, object);
        listBox.addView(card);
    }

    private String displayTitle(JSONObject object, int index) {
        String[] keys = {"name", "title", "leaveType", "message", "month", "employeeId"};
        for (String key : keys) {
            String value = object.optString(key, "");
            if (!value.isEmpty()) {
                return value;
            }
        }
        int id = object.optInt("id", index);
        return title + " #" + id;
    }

    private String displaySubtitle(JSONObject object) {
        StringBuilder builder = new StringBuilder();
        appendIfPresent(builder, "Status", object.optString("status", ""));
        appendIfPresent(builder, "Priority", object.optString("priority", ""));
        appendIfPresent(builder, "Category", object.optString("category", ""));
        appendIfPresent(builder, "Channel", object.optString("sourceChannel", ""));
        appendIfPresent(builder, "Deadline", object.optString("deadline", ""));
        appendIfPresent(builder, "Date", object.optString("date", ""));
        appendIfPresent(builder, "Amount", object.optString("amount", ""));
        appendIfPresent(builder, "Salary", object.optString("finalSalary", ""));
        appendIfPresent(builder, "Type", object.optString("leaveType", ""));
        appendIfPresent(builder, "Reason", object.optString("reason", ""));
        JSONObject user = object.optJSONObject("user");
        if (user != null) {
            appendIfPresent(builder, "User", user.optString("name", user.optString("employeeId", "")));
        }
        JSONObject assignedTo = object.optJSONObject("assignedTo");
        if (assignedTo != null) {
            appendIfPresent(builder, "Assigned To", assignedTo.optString("name", assignedTo.optString("employeeId", "")));
        }
        JSONObject project = object.optJSONObject("project");
        if (project != null) {
            appendIfPresent(builder, "Project", project.optString("name", ""));
        }
        JSONObject client = object.optJSONObject("client");
        if (client != null) {
            appendIfPresent(builder, "Client", client.optString("name", ""));
        }
        appendIfPresent(builder, "File", object.optString("fileUrl", ""));
        return builder.toString();
    }

    private void appendIfPresent(StringBuilder builder, String label, String value) {
        if (value == null || value.isEmpty() || value.equals("null")) {
            return;
        }
        if (builder.length() > 0) {
            builder.append(" | ");
        }
        builder.append(label).append(": ").append(shortValue(value));
    }

    private String formatObject(JSONObject object) {
        StringBuilder builder = new StringBuilder();
        Iterator<String> keys = object.keys();
        while (keys.hasNext()) {
            String key = keys.next();
            Object value = object.opt(key);
            if (value instanceof JSONObject) {
                builder.append(key).append(": ").append(formatNested((JSONObject) value)).append('\n');
            } else if (value instanceof JSONArray) {
                builder.append(key).append(": ").append(((JSONArray) value).length()).append(" items\n");
            } else {
                builder.append(key).append(": ").append(shortValue(String.valueOf(value))).append('\n');
            }
        }
        return builder.toString().trim();
    }

    private String formatNested(JSONObject object) {
        String name = object.optString("name", "");
        String employeeId = object.optString("employeeId", "");
        String email = object.optString("email", "");
        if (!name.isEmpty() && !employeeId.isEmpty()) {
            return name + " (" + employeeId + ")";
        }
        if (!name.isEmpty()) {
            return name;
        }
        if (!email.isEmpty()) {
            return email;
        }
        return object.toString();
    }

    private String shortValue(String value) {
        if (value == null || value.equals("null")) {
            return "";
        }
        return value.length() > 90 ? value.substring(0, 87) + "..." : value;
    }

    private void addInlineActions(LinearLayout card, JSONObject object) {
        int id = object.optInt("id", 0);
        if (id == 0) {
            return;
        }

        if ("/notifications".equals(endpoint) && !object.optBoolean("isRead", false)) {
            Button markRead = ErpUi.button(this, "Mark as read", ErpUi.GREEN);
            markRead.setOnClickListener(view -> updateStatus("/notifications/" + id + "/read", new JSONObject()));
            card.addView(markRead);
        }

        if ("/leave-requests".equals(endpoint) && session.getRoleId() >= 3) {
            Button approve = ErpUi.button(this, "Approve leave", ErpUi.GREEN);
            approve.setOnClickListener(view -> updateLeaveStatus(id, "APPROVED"));
            card.addView(approve);

            Button reject = ErpUi.button(this, "Reject leave", ErpUi.RED);
            reject.setOnClickListener(view -> updateLeaveStatus(id, "REJECTED"));
            card.addView(reject);
        }

        if ("/reports".equals(endpoint)) {
            String fileUrl = object.optString("fileUrl", "");
            if (!fileUrl.isEmpty()) {
                Button openFile = ErpUi.button(this, "Open file", ErpUi.BLUE);
                openFile.setOnClickListener(view -> openExternal(fileUrl));
                card.addView(openFile);
            }
        }
    }

    private void updateLeaveStatus(int id, String status) {
        try {
            JSONObject body = new JSONObject();
            body.put("status", status);
            updateStatus("/leave-requests/" + id + "/status", body);
        } catch (Exception exception) {
            ErpUi.toast(this, exception.getMessage());
        }
    }

    private void updateStatus(String path, JSONObject body) {
        api.put(path, body, new ApiClient.Callback() {
            @Override
            public void onComplete(int code, String responseBody) {
                if (code >= 200 && code < 300) {
                    ErpUi.toast(JsonListActivity.this, "Updated");
                    load();
                } else {
                    ErpUi.toast(JsonListActivity.this, responseBody.isEmpty() ? "Update failed" : responseBody);
                }
            }

            @Override
            public void onError(String message) {
                ErpUi.toast(JsonListActivity.this, "Cannot update: " + message);
            }
        });
    }

    private void openExternal(String url) {
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            startActivity(intent);
        } catch (Exception exception) {
            ErpUi.toast(this, "Cannot open file: " + exception.getMessage());
        }
    }
}
