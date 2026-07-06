package com.iterp.mobile;

import android.content.Context;
import android.content.SharedPreferences;
import android.net.Uri;

import org.json.JSONObject;

public class SessionManager {
    private static final String PREFS = "it_erp_session";
    private static final String KEY_TOKEN = "token";
    private static final String KEY_ROLE_ID = "role_id";
    private static final String KEY_ROLE_NAME = "role_name";
    private static final String KEY_USER_ID = "user_id";
    private static final String KEY_BASE_URL = "base_url";

    private final SharedPreferences prefs;

    public SessionManager(Context context) {
        prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    public boolean saveLogin(JSONObject response) {
        String token = response.optString("token", "").trim();
        if (token.isEmpty() || "null".equalsIgnoreCase(token)) {
            return false;
        }

        return prefs.edit()
                .putString(KEY_TOKEN, token)
                .putInt(KEY_ROLE_ID, response.optInt("roleId", 0))
                .putString(KEY_ROLE_NAME, response.optString("roleName", "User"))
                .putInt(KEY_USER_ID, response.optInt("userId", 0))
                .commit();
    }

    public boolean isLoggedIn() {
        return getToken() != null && !getToken().isEmpty();
    }

    public String getToken() {
        return prefs.getString(KEY_TOKEN, "");
    }

    public int getRoleId() {
        return prefs.getInt(KEY_ROLE_ID, 0);
    }

    public String getRoleName() {
        return prefs.getString(KEY_ROLE_NAME, "User");
    }

    public int getUserId() {
        return prefs.getInt(KEY_USER_ID, 0);
    }

    public String getBaseUrl() {
        if (!BuildConfig.ALLOW_API_SETTINGS) {
            return BuildConfig.API_BASE_URL;
        }

        String saved = prefs.getString(KEY_BASE_URL, "");
        if (saved == null || saved.isEmpty()) {
            return BuildConfig.API_BASE_URL;
        }

        if (shouldMigrateLoopbackUrl(saved)) {
            String current = BuildConfig.API_BASE_URL;
            prefs.edit().putString(KEY_BASE_URL, current).commit();
            return current;
        }

        return normalizeBaseUrl(saved);
    }

    public void setBaseUrl(String baseUrl) {
        prefs.edit().putString(KEY_BASE_URL, normalizeBaseUrl(baseUrl)).commit();
    }

    public void clear() {
        String baseUrl = getBaseUrl();
        prefs.edit().clear().putString(KEY_BASE_URL, baseUrl).commit();
    }

    private String normalizeBaseUrl(String value) {
        String cleaned = value == null ? "" : value.trim();
        if (cleaned.isEmpty()) {
            return BuildConfig.API_BASE_URL;
        }

        if (!cleaned.startsWith("http://") && !cleaned.startsWith("https://")) {
            cleaned = "http://" + cleaned;
        }

        while (cleaned.endsWith("/")) {
            cleaned = cleaned.substring(0, cleaned.length() - 1);
        }

        return cleaned.isEmpty() ? BuildConfig.API_BASE_URL : cleaned;
    }

    private boolean shouldMigrateLoopbackUrl(String baseUrl) {
        try {
            String host = Uri.parse(baseUrl).getHost();
            if (host == null) {
                return false;
            }

            String lower = host.toLowerCase();
            return "localhost".equals(lower)
                    || "127.0.0.1".equals(lower)
                    || "10.0.2.2".equals(lower)
                    || "10.0.3.2".equals(lower);
        } catch (Exception ignored) {
            return false;
        }
    }
}
