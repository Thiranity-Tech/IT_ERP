package com.iterp.mobile;

import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;

public class SettingsActivity extends android.app.Activity {
    private SessionManager session;
    private ApiClient api;
    private EditText baseUrlInput;
    private AppShell.Shell shell;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        session = new SessionManager(this);
        api = new ApiClient(this);

        LinearLayout root;
        if (!BuildConfig.ALLOW_API_SETTINGS) {
            shell = AppShell.create(this, "Backend Config", "This published build uses the backend URL from the app package.");
            AppShell.populateDefaultDrawer(this, session, shell);
            root = shell.content();
            root.addView(ErpUi.body(this, "API settings are locked in this build. To change the backend, rebuild the app with a new API_BASE_URL."));

            Button back = ErpUi.button(this, "Back", ErpUi.MUTED);
            back.setOnClickListener(view -> finish());
            root.addView(back);
            return;
        }

        shell = AppShell.create(this, "API Settings", "For debug builds, you can keep one backend URL saved and reuse it every time.");
        AppShell.populateDefaultDrawer(this, session, shell);
        root = shell.content();
        root.addView(ErpUi.body(this, "Set the backend URL once and the app will remember it. For a phone on USB, either use adb reverse or your LAN IP."));

        baseUrlInput = ErpUi.input(this, "Backend URL");
        baseUrlInput.setText(session.getBaseUrl());
        root.addView(baseUrlInput);

        Button save = ErpUi.button(this, "Save URL", ErpUi.BLUE);
        save.setOnClickListener(view -> saveUrl());
        root.addView(save);

        Button test = ErpUi.button(this, "Test connection", ErpUi.GREEN);
        test.setOnClickListener(view -> testConnection());
        root.addView(test);

        Button back = ErpUi.button(this, "Back", ErpUi.MUTED);
        back.setOnClickListener(view -> finish());
        root.addView(back);
    }

    private void saveUrl() {
        session.setBaseUrl(baseUrlInput.getText().toString());
        api = new ApiClient(this);
        ErpUi.toast(this, "API URL saved");
    }

    private void testConnection() {
        saveUrl();
        api.get("/", new ApiClient.Callback() {
            @Override
            public void onComplete(int code, String body) {
                if (code >= 200 && code < 300) {
                    ErpUi.toast(SettingsActivity.this, "Connected to backend");
                } else {
                    ErpUi.toast(SettingsActivity.this, body.isEmpty() ? "Backend returned " + code : body);
                }
            }

            @Override
            public void onError(String message) {
                ErpUi.toast(SettingsActivity.this, "Cannot connect: " + message);
            }
        });
    }
}
