package in.syncrasystems.society;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Durable local queue for filtered delivery events.
 * Survives process death until the Capacitor bridge drains it.
 */
public final class DeliveryEventStore {
  private static final String PREFS = "mai_delivery_listener";
  private static final String KEY_QUEUE = "pending_events";
  private static final String KEY_CONSENT = "sms_consent";
  private static final String KEY_ENABLED = "listener_enabled";
  private static final String CHANNEL_ID = "mai_delivery_silent";
  private static final int NOTIFY_ID_BASE = 71041;

  private static volatile DeliveryListenerPlugin pluginRef;

  private DeliveryEventStore() {}

  public static void bindPlugin(DeliveryListenerPlugin plugin) {
    pluginRef = plugin;
  }

  public static void unbindPlugin(DeliveryListenerPlugin plugin) {
    if (pluginRef == plugin) pluginRef = null;
  }

  public static SharedPreferences prefs(Context context) {
    return context.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
  }

  public static void setConsent(Context context, String value) {
    prefs(context).edit().putString(KEY_CONSENT, value).apply();
  }

  public static String getConsent(Context context) {
    return prefs(context).getString(KEY_CONSENT, "unknown");
  }

  public static void setEnabled(Context context, boolean enabled) {
    prefs(context).edit().putBoolean(KEY_ENABLED, enabled).apply();
  }

  public static boolean isEnabled(Context context) {
    return prefs(context).getBoolean(KEY_ENABLED, false);
  }

  public static synchronized void enqueue(
    Context context,
    String source,
    String sender,
    String packageName,
    String body
  ) {
    if (!"granted".equals(getConsent(context))) return;
    if (!DeliveryMatchFilter.shouldCapture(packageName, sender, body)) return;

    JSONObject event = new JSONObject();
    try {
      event.put("id", UUID.randomUUID().toString());
      event.put("source", source == null ? "unknown" : source);
      event.put("sender", sender == null ? "" : sender);
      event.put("packageName", packageName == null ? "" : packageName);
      event.put("body", body);
      event.put("providerHint", DeliveryMatchFilter.guessProviderLabel(body));
      event.put("capturedAt", System.currentTimeMillis());
    } catch (JSONException ignored) {
      return;
    }

    SharedPreferences sp = prefs(context);
    JSONArray queue = readQueue(sp);
    queue.put(event);
    while (queue.length() > 40) {
      queue.remove(0);
    }
    sp.edit().putString(KEY_QUEUE, queue.toString()).apply();

    DeliveryListenerPlugin plugin = pluginRef;
    if (plugin != null) {
      plugin.emitDeliveryDetected(event);
    }
  }

  public static synchronized List<JSONObject> drain(Context context) {
    SharedPreferences sp = prefs(context);
    JSONArray queue = readQueue(sp);
    List<JSONObject> out = new ArrayList<>();
    for (int i = 0; i < queue.length(); i++) {
      JSONObject item = queue.optJSONObject(i);
      if (item != null) out.add(item);
    }
    sp.edit().putString(KEY_QUEUE, "[]").apply();
    return out;
  }

  /** Silent local notice after JS confirms a Supabase pre-approval write. */
  public static void showPreApprovalNotice(Context context, String provider, int hours) {
    String label = (provider == null || provider.isEmpty()) ? "Delivery" : provider;
    int windowHours = hours > 0 ? hours : 2;
    postSilentLocalNotification(
      context,
      label + " delivery detected",
      label + " delivery detected. Gate entry pre-approved for " + windowHours + " hours."
    );
  }

  private static JSONArray readQueue(SharedPreferences sp) {
    String raw = sp.getString(KEY_QUEUE, "[]");
    try {
      return new JSONArray(raw);
    } catch (JSONException e) {
      return new JSONArray();
    }
  }

  private static void ensureChannel(Context context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
    NotificationManager manager = context.getSystemService(NotificationManager.class);
    if (manager == null) return;
    NotificationChannel channel = new NotificationChannel(
      CHANNEL_ID,
      "Delivery pre-approval",
      NotificationManager.IMPORTANCE_LOW
    );
    channel.setDescription("Silent gate pre-approval updates from delivery SMS");
    channel.setShowBadge(false);
    manager.createNotificationChannel(channel);
  }

  private static void postSilentLocalNotification(Context context, String title, String body) {
    try {
      ensureChannel(context);
      Intent launch = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
      PendingIntent pending = null;
      if (launch != null) {
        launch.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        pending = PendingIntent.getActivity(
          context,
          0,
          launch,
          PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
      }

      NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
        .setSmallIcon(android.R.drawable.ic_dialog_info)
        .setContentTitle(title)
        .setContentText(body)
        .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
        .setPriority(NotificationCompat.PRIORITY_LOW)
        .setCategory(NotificationCompat.CATEGORY_STATUS)
        .setAutoCancel(true)
        .setSilent(true);

      if (pending != null) builder.setContentIntent(pending);

      NotificationManagerCompat.from(context).notify(
        NOTIFY_ID_BASE + (int) (System.currentTimeMillis() % 1000),
        builder.build()
      );
    } catch (SecurityException ignored) {
      // POST_NOTIFICATIONS may be denied — JS bridge still processes the queue.
    } catch (Exception ignored) {
      // Never crash SMS/NLS paths.
    }
  }
}
