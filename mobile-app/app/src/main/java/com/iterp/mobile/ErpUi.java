package com.iterp.mobile;

import android.app.Activity;
import android.content.Context;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.graphics.Typeface;
import android.text.InputType;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

public final class ErpUi {
    public static final int BG = Color.rgb(242, 244, 247);
    public static final int SURFACE = Color.WHITE;
    public static final int TEXT = Color.rgb(15, 23, 42);
    public static final int MUTED = Color.rgb(100, 116, 139);
    public static final int BLUE = Color.rgb(37, 99, 235);
    public static final int GREEN = Color.rgb(20, 184, 166);
    public static final int RED = Color.rgb(220, 38, 38);
    public static final int GOLD = Color.rgb(245, 158, 11);
    public static final int BORDER = Color.rgb(226, 232, 240);

    private ErpUi() {
    }

    public static LinearLayout screen(Activity activity) {
        ScrollView scrollView = new ScrollView(activity);
        scrollView.setFillViewport(true);
        scrollView.setBackgroundColor(BG);

        LinearLayout content = new LinearLayout(activity);
        content.setOrientation(LinearLayout.VERTICAL);
        content.setPadding(dp(activity, 18), dp(activity, 20), dp(activity, 18), dp(activity, 28));
        content.setClipToPadding(false);
        scrollView.addView(content, new ScrollView.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        ));

        activity.setContentView(scrollView);
        return content;
    }

    public static TextView title(Context context, String text) {
        TextView view = text(context, text, 28, TEXT, true);
        view.setPadding(0, 0, 0, dp(context, 4));
        return view;
    }

    public static TextView section(Context context, String text) {
        TextView view = text(context, text, 18, TEXT, true);
        view.setPadding(0, dp(context, 18), 0, dp(context, 8));
        return view;
    }

    public static TextView body(Context context, String text) {
        TextView view = text(context, text, 14, MUTED, false);
        view.setLineSpacing(dp(context, 2), 1.0f);
        return view;
    }

    public static TextView text(Context context, String text, int sp, int color, boolean bold) {
        TextView view = new TextView(context);
        view.setText(text);
        view.setTextSize(sp);
        view.setTextColor(color);
        view.setIncludeFontPadding(true);
        if (bold) {
            view.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        }
        return view;
    }

    public static EditText input(Context context, String hint) {
        EditText editText = new EditText(context);
        editText.setHint(hint);
        editText.setSingleLine(false);
        editText.setMinLines(1);
        editText.setTextColor(TEXT);
        editText.setHintTextColor(MUTED);
        editText.setTextSize(15);
        editText.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_CAP_SENTENCES);
        editText.setPadding(dp(context, 12), dp(context, 8), dp(context, 12), dp(context, 8));
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        params.setMargins(0, dp(context, 6), 0, dp(context, 10));
        editText.setLayoutParams(params);
        return editText;
    }

    public static Button button(Context context, String label, int color) {
        Button button = new Button(context);
        button.setText(label);
        button.setTextColor(Color.WHITE);
        button.setTextSize(14);
        button.setAllCaps(false);
        button.setGravity(Gravity.CENTER);
        button.setPadding(dp(context, 14), dp(context, 12), dp(context, 14), dp(context, 12));
        button.setBackground(rounded(color, color, dp(context, 14)));
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        params.setMargins(0, dp(context, 6), 0, dp(context, 6));
        button.setLayoutParams(params);
        return button;
    }

    public static LinearLayout card(Context context) {
        LinearLayout card = new LinearLayout(context);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setBackground(rounded(SURFACE, BORDER, dp(context, 20)));
        card.setPadding(dp(context, 14), dp(context, 12), dp(context, 14), dp(context, 12));
        card.setElevation(dp(context, 2));
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        params.setMargins(0, dp(context, 8), 0, dp(context, 8));
        card.setLayoutParams(params);
        return card;
    }

    public static LinearLayout tintedCard(Context context, int tint) {
        LinearLayout card = card(context);
        GradientDrawable drawable = rounded(Color.WHITE, tint, dp(context, 20));
        drawable.setColor(Color.argb(255, 255, 255, 255));
        drawable.setStroke(dp(context, 1), tint);
        card.setBackground(drawable);
        return card;
    }

    public static LinearLayout row(Context context) {
        LinearLayout row = new LinearLayout(context);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setGravity(Gravity.CENTER_VERTICAL);
        return row;
    }

    public static void addSpacer(Context context, LinearLayout parent, int dp) {
        View spacer = new View(context);
        parent.addView(spacer, new LinearLayout.LayoutParams(1, dp(context, dp)));
    }

    public static GradientDrawable rounded(int fillColor, int strokeColor, float radiusDp) {
        GradientDrawable drawable = new GradientDrawable();
        drawable.setShape(GradientDrawable.RECTANGLE);
        drawable.setColor(fillColor);
        drawable.setCornerRadius(radiusDp);
        drawable.setStroke(1, strokeColor);
        return drawable;
    }

    public static void toast(Context context, String message) {
        Toast.makeText(context, message, Toast.LENGTH_LONG).show();
    }

    public static int dp(Context context, int value) {
        return Math.round(value * context.getResources().getDisplayMetrics().density);
    }
}
