package com.iterp.mobile;

import android.content.Intent;
import android.os.Bundle;
import android.text.InputType;
import android.util.Log;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;

import org.json.JSONObject;

public class LoginActivity extends android.app.Activity {
    private static final String TAG = "IT_ERP_Login";

    private SessionManager session;
    private ApiClient api;
    private EditText employeeIdInput;
    private EditText passwordInput;
    private Button loginButton;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        session = new SessionManager(this);
        api = new ApiClient(this);

        if (session.isLoggedIn()) {
            openMain();
            return;
        }

        LinearLayout root = ErpUi.screen(this);
        LinearLayout hero = ErpUi.tintedCard(this, ErpUi.BLUE);
        hero.setPadding(ErpUi.dp(this, 18), ErpUi.dp(this, 16), ErpUi.dp(this, 18), ErpUi.dp(this, 16));
        hero.addView(ErpUi.text(this, "IT ERP Mobile", 24, ErpUi.TEXT, true));
        hero.addView(ErpUi.body(this, "A compact workspace for employees, managers, and admins."));
        root.addView(hero);

        LinearLayout loginCard = ErpUi.card(this);
        loginCard.addView(ErpUi.text(this, "Login", 16, ErpUi.TEXT, true));
        loginCard.addView(ErpUi.body(this, "Use the same ERP credentials you use in the web app."));
        employeeIdInput = ErpUi.input(this, "Employee ID, for example SA001");
        passwordInput = ErpUi.input(this, "Password");
        passwordInput.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD);
        loginCard.addView(employeeIdInput);
        loginCard.addView(passwordInput);
        loginButton = ErpUi.button(this, "Login", ErpUi.BLUE);
        loginButton.setOnClickListener(view -> login());
        loginCard.addView(loginButton);
        root.addView(loginCard);

        if (BuildConfig.ALLOW_API_SETTINGS) {
            Button settingsButton = ErpUi.button(this, "API Settings", ErpUi.MUTED);
            settingsButton.setOnClickListener(view -> startActivity(new Intent(this, SettingsActivity.class)));
            root.addView(settingsButton);
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (!session.isLoggedIn()) {
            api = new ApiClient(this);
        }
    }

    private void login() {
        String employeeId = employeeIdInput.getText().toString().trim();
        String password = passwordInput.getText().toString();

        if (employeeId.isEmpty() || password.isEmpty()) {
            ErpUi.toast(this, "Enter employee ID and password");
            return;
        }

        loginButton.setEnabled(false);
        loginButton.setText("Logging in...");

        try {
            JSONObject body = new JSONObject();
            body.put("employeeId", employeeId);
            body.put("password", password);

            api.post("/auth/login", body, new ApiClient.Callback() {
                @Override
                public void onComplete(int code, String responseBody) {
                    loginButton.setEnabled(true);
                    loginButton.setText("Login");
                    if (code >= 200 && code < 300) {
                        try {
                            if (session.saveLogin(new JSONObject(responseBody))) {
                                openMain();
                            } else {
                                Log.w(TAG, "Login response did not include a usable token: " + responseBody);
                                ErpUi.toast(LoginActivity.this, "Login succeeded but token was missing");
                            }
                        } catch (Exception exception) {
                            Log.w(TAG, "Login succeeded but response could not be parsed: " + responseBody, exception);
                            ErpUi.toast(LoginActivity.this, "Login response could not be read");
                        }
                    } else {
                        String reason = extractErrorMessage(responseBody);
                        Log.w(TAG, "Login failed with HTTP " + code + ": " + reason + " | raw=" + responseBody);
                        ErpUi.toast(LoginActivity.this, "Login failed (" + code + "): " + reason);
                    }
                }

                @Override
                public void onError(String message) {
                    loginButton.setEnabled(true);
                    loginButton.setText("Login");
                    Log.e(TAG, "Login request could not reach API: " + message);
                    ErpUi.toast(LoginActivity.this, "Cannot reach API: " + message);
                }
            });
        } catch (Exception exception) {
            loginButton.setEnabled(true);
            loginButton.setText("Login");
            Log.e(TAG, "Login request could not be prepared", exception);
            ErpUi.toast(this, exception.getMessage());
        }
    }

    private String extractErrorMessage(String responseBody) {
        if (responseBody == null || responseBody.trim().isEmpty()) {
            return "Login failed";
        }

        String trimmed = responseBody.trim();
        if (trimmed.startsWith("{")) {
            try {
                JSONObject json = new JSONObject(trimmed);
                String message = json.optString("message", "");
                if (!message.isEmpty()) {
                    return message;
                }

                String error = json.optString("error", "");
                if (!error.isEmpty()) {
                    return error;
                }
            } catch (Exception ignored) {
                // Fall back to the raw body below.
            }
        }

        return trimmed;
    }

    private void openMain() {
        startActivity(new Intent(this, MainActivity.class));
        finish();
    }
}
