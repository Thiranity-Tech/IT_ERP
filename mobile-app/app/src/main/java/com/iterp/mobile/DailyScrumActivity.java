package com.iterp.mobile;

import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;

import org.json.JSONObject;

public class DailyScrumActivity extends android.app.Activity {
    private SessionManager session;
    private ApiClient api;
    private EditText yesterdayInput;
    private EditText todayInput;
    private EditText blockersInput;
    private Button submitButton;
    private AppShell.Shell shell;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        session = new SessionManager(this);
        api = new ApiClient(this);

        shell = AppShell.create(this, "Daily Scrum", "Submit yesterday, today, and blocker updates to the ERP backend.");
        AppShell.populateDefaultDrawer(this, session, shell);
        LinearLayout root = shell.content();

        yesterdayInput = ErpUi.input(this, "Yesterday");
        todayInput = ErpUi.input(this, "Today");
        blockersInput = ErpUi.input(this, "Blockers");
        root.addView(yesterdayInput);
        root.addView(todayInput);
        root.addView(blockersInput);

        submitButton = ErpUi.button(this, "Submit scrum", ErpUi.GREEN);
        submitButton.setOnClickListener(view -> submit());
        root.addView(submitButton);

        Button back = ErpUi.button(this, "Back", ErpUi.MUTED);
        back.setOnClickListener(view -> finish());
        root.addView(back);
    }

    private void submit() {
        String today = todayInput.getText().toString().trim();
        if (today.isEmpty()) {
            ErpUi.toast(this, "Today field is required");
            return;
        }

        submitButton.setEnabled(false);
        submitButton.setText("Submitting...");
        try {
            JSONObject body = new JSONObject();
            body.put("yesterday", yesterdayInput.getText().toString().trim());
            body.put("today", today);
            body.put("blockers", blockersInput.getText().toString().trim());
            body.put("userId", session.getUserId());

            api.post("/daily-scrums", body, new ApiClient.Callback() {
                @Override
                public void onComplete(int code, String responseBody) {
                    submitButton.setEnabled(true);
                    submitButton.setText("Submit scrum");
                    if (code >= 200 && code < 300) {
                        ErpUi.toast(DailyScrumActivity.this, "Scrum submitted");
                        finish();
                    } else {
                        ErpUi.toast(DailyScrumActivity.this, responseBody.isEmpty() ? "Submit failed" : responseBody);
                    }
                }

                @Override
                public void onError(String message) {
                    submitButton.setEnabled(true);
                    submitButton.setText("Submit scrum");
                    ErpUi.toast(DailyScrumActivity.this, "Cannot submit: " + message);
                }
            });
        } catch (Exception exception) {
            submitButton.setEnabled(true);
            submitButton.setText("Submit scrum");
            ErpUi.toast(this, exception.getMessage());
        }
    }
}
