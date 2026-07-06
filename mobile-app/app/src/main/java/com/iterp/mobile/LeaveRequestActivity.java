package com.iterp.mobile;

import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;

import org.json.JSONObject;

public class LeaveRequestActivity extends android.app.Activity {
    private SessionManager session;
    private ApiClient api;
    private EditText typeInput;
    private EditText reasonInput;
    private EditText startInput;
    private EditText endInput;
    private Button submitButton;
    private AppShell.Shell shell;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        session = new SessionManager(this);
        api = new ApiClient(this);

        shell = AppShell.create(this, "Apply Leave", "Leave types from the SRS: Sick Leave, Casual Leave, Emergency Leave.");
        AppShell.populateDefaultDrawer(this, session, shell);
        LinearLayout root = shell.content();

        typeInput = ErpUi.input(this, "Leave type");
        reasonInput = ErpUi.input(this, "Reason");
        startInput = ErpUi.input(this, "Start date, for example 2026-06-25");
        endInput = ErpUi.input(this, "End date, for example 2026-06-27");
        root.addView(typeInput);
        root.addView(reasonInput);
        root.addView(startInput);
        root.addView(endInput);

        submitButton = ErpUi.button(this, "Submit leave request", ErpUi.GREEN);
        submitButton.setOnClickListener(view -> submit());
        root.addView(submitButton);

        Button back = ErpUi.button(this, "Back", ErpUi.MUTED);
        back.setOnClickListener(view -> finish());
        root.addView(back);
    }

    private void submit() {
        String leaveType = typeInput.getText().toString().trim();
        String reason = reasonInput.getText().toString().trim();
        String startDate = startInput.getText().toString().trim();
        String endDate = endInput.getText().toString().trim();

        if (leaveType.isEmpty() || reason.isEmpty() || startDate.isEmpty() || endDate.isEmpty()) {
            ErpUi.toast(this, "Fill all leave fields");
            return;
        }

        submitButton.setEnabled(false);
        submitButton.setText("Submitting...");
        try {
            JSONObject body = new JSONObject();
            body.put("leaveType", leaveType);
            body.put("reason", reason);
            body.put("startDate", normalizeDate(startDate));
            body.put("endDate", normalizeDate(endDate));
            body.put("userId", session.getUserId());

            api.post("/leave-requests", body, new ApiClient.Callback() {
                @Override
                public void onComplete(int code, String responseBody) {
                    submitButton.setEnabled(true);
                    submitButton.setText("Submit leave request");
                    if (code >= 200 && code < 300) {
                        ErpUi.toast(LeaveRequestActivity.this, "Leave request submitted");
                        finish();
                    } else {
                        ErpUi.toast(LeaveRequestActivity.this, responseBody.isEmpty() ? "Submit failed" : responseBody);
                    }
                }

                @Override
                public void onError(String message) {
                    submitButton.setEnabled(true);
                    submitButton.setText("Submit leave request");
                    ErpUi.toast(LeaveRequestActivity.this, "Cannot submit: " + message);
                }
            });
        } catch (Exception exception) {
            submitButton.setEnabled(true);
            submitButton.setText("Submit leave request");
            ErpUi.toast(this, exception.getMessage());
        }
    }

    private String normalizeDate(String value) {
        return value.matches("\\d{4}-\\d{2}-\\d{2}") ? value + "T00:00:00.000Z" : value;
    }
}
