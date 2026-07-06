package com.iterp.mobile;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class ApiClient {
    public interface Callback {
        void onComplete(int code, String body);

        void onError(String message);
    }

    private static final int TIMEOUT_MS = 3000;

    private final SessionManager session;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private final ExecutorService executor = Executors.newCachedThreadPool();

    public ApiClient(Context context) {
        session = new SessionManager(context);
    }

    public void get(String path, Callback callback) {
        request("GET", path, null, callback);
    }

    public void post(String path, JSONObject body, Callback callback) {
        request("POST", path, body, callback);
    }

    public void put(String path, JSONObject body, Callback callback) {
        request("PUT", path, body, callback);
    }

    private void request(String method, String path, JSONObject body, Callback callback) {
        executor.execute(() -> {
            HttpURLConnection connection = null;
            try {
                URL url = new URL(resolveUrl(path));
                connection = (HttpURLConnection) url.openConnection();
                connection.setRequestMethod(method);
                connection.setConnectTimeout(TIMEOUT_MS);
                connection.setReadTimeout(TIMEOUT_MS);
                connection.setRequestProperty("Accept", "application/json");

                String token = session.getToken();
                if (token != null && !token.isEmpty()) {
                    connection.setRequestProperty("Authorization", "Bearer " + token);
                }

                if (body != null) {
                    connection.setDoOutput(true);
                    connection.setRequestProperty("Content-Type", "application/json");
                    byte[] payload = body.toString().getBytes(StandardCharsets.UTF_8);
                    try (OutputStream outputStream = connection.getOutputStream()) {
                        outputStream.write(payload);
                    }
                }

                int code = connection.getResponseCode();
                InputStream stream = code >= 400 ? connection.getErrorStream() : connection.getInputStream();
                String responseBody = readAll(stream);
                mainHandler.post(() -> callback.onComplete(code, responseBody));
            } catch (Exception exception) {
                mainHandler.post(() -> callback.onError(exception.getMessage()));
            } finally {
                if (connection != null) {
                    connection.disconnect();
                }
            }
        });
    }

    private String resolveUrl(String path) {
        if (path == null || path.trim().isEmpty()) {
            return session.getBaseUrl();
        }

        path = path.trim();
        if (path.startsWith("http://") || path.startsWith("https://")) {
            return path;
        }
        String prefix = path.startsWith("/") ? "" : "/";
        return session.getBaseUrl() + prefix + path;
    }

    private String readAll(InputStream stream) throws Exception {
        if (stream == null) {
            return "";
        }
        StringBuilder builder = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                builder.append(line).append('\n');
            }
        }
        return builder.toString().trim();
    }
}
