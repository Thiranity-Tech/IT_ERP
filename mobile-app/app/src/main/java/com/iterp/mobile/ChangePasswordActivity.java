package com.iterp.mobile;

import android.os.Bundle;
import android.text.InputType;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;

import org.json.JSONObject;

public class ChangePasswordActivity extends android.app.Activity {
    private ApiClient api;
    private EditText currentInput;
    private EditText newInput;
    private Button submitButton;
    private SessionManager session;
    private AppShell.Shell shell;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        session = new SessionManager(this);
        api = new ApiClient(this);

        shell = AppShell.create(this, "Change Password", "Update your login password from one place.");
        AppShell.populateDefaultDrawer(this, session, shell);
        LinearLayout root = shell.content();

        currentInput = ErpUi.input(this, "Current password");
        newInput = ErpUi.input(this, "New password");
        currentInput.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD);
        newInput.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD);
        root.addView(currentInput);
        root.addView(newInput);

        submitButton = ErpUi.button(this, "Update password", ErpUi.BLUE);
        submitButton.setOnClickListener(view -> submit());
        root.addView(submitButton);

        Button back = ErpUi.button(this, "Back", ErpUi.MUTED);
        back.setOnClickListener(view -> finish());
        root.addView(back);
    }

    private void submit() {
        String current = currentInput.getText().toString();
        String next = newInput.getText().toString();
        if (current.isEmpty() || next.isEmpty()) {
            ErpUi.toast(this, "Enter both passwords");
            return;
        }

        submitButton.setEnabled(false);
        submitButton.setText("Updating...");
        try {
            JSONObject body = new JSONObject();
            body.put("currentPassword", current);
            body.put("newPassword", next);

            api.put("/auth/change-password", body, new ApiClient.Callback() {
                @Override
                public void onComplete(int code, String responseBody) {
                    submitButton.setEnabled(true);
                    submitButton.setText("Update password");
                    if (code >= 200 && code < 300) {
                        ErpUi.toast(ChangePasswordActivity.this, "Password updated");
                        finish();
                    } else {
                        ErpUi.toast(ChangePasswordActivity.this, responseBody.isEmpty() ? "Update failed" : responseBody);
                    }
                }

                @Override
                public void onError(String message) {
                    submitButton.setEnabled(true);
                    submitButton.setText("Update password");
                    ErpUi.toast(ChangePasswordActivity.this, "Cannot update: " + message);
                }
            });
        } catch (Exception exception) {
            submitButton.setEnabled(true);
            submitButton.setText("Update password");
            ErpUi.toast(this, exception.getMessage());
        }
    }
}
