package in.syncrasystems.society;

import android.Manifest;
import android.content.ComponentName;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.provider.Settings;
import android.text.TextUtils;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import org.json.JSONObject;

import java.util.List;

/**
 * Capacitor bridge for OS-level delivery SMS + notification listening.
 */
@CapacitorPlugin(
  name = "DeliveryListener",
  permissions = {
    @Permission(
      alias = "sms",
      strings = {
        Manifest.permission.RECEIVE_SMS,
        Manifest.permission.READ_SMS
      }
    ),
    @Permission(
      alias = "notifications",
      strings = { Manifest.permission.POST_NOTIFICATIONS }
    )
  }
)
public class DeliveryListenerPlugin extends Plugin {
  public static final String EVENT_DELIVERY_DETECTED = "deliveryDetected";

  @Override
  public void load() {
    DeliveryEventStore.bindPlugin(this);
  }

  @Override
  protected void handleOnDestroy() {
    DeliveryEventStore.unbindPlugin(this);
    super.handleOnDestroy();
  }

  void emitDeliveryDetected(JSONObject event) {
    if (event == null) return;
    try {
      JSObject payload = JSObject.fromJSONObject(event);
      notifyListeners(EVENT_DELIVERY_DETECTED, payload, true);
    } catch (Exception ignored) {
      // Bridge may be mid-teardown.
    }
  }

  @PluginMethod
  public void getStatus(PluginCall call) {
    JSObject result = new JSObject();
    result.put("platform", "android");
    result.put("consent", DeliveryEventStore.getConsent(getContext()));
    result.put("enabled", DeliveryEventStore.isEnabled(getContext()));
    result.put("smsPermission", smsPermissionGranted() ? "granted" : "denied");
    result.put("notificationListenerEnabled", isNotificationServiceEnabled());
    result.put("postNotifications", postNotificationsGranted() ? "granted" : "denied");
    call.resolve(result);
  }

  @PluginMethod
  public void setConsent(PluginCall call) {
    String value = call.getString("consent", "denied");
    if (!"granted".equals(value) && !"denied".equals(value)) {
      call.reject("consent must be 'granted' or 'denied'");
      return;
    }
    DeliveryEventStore.setConsent(getContext(), value);
    DeliveryEventStore.setEnabled(getContext(), "granted".equals(value));
    JSObject result = new JSObject();
    result.put("consent", value);
    call.resolve(result);
  }

  @PluginMethod
  public void startListening(PluginCall call) {
    DeliveryEventStore.setConsent(getContext(), "granted");
    DeliveryEventStore.setEnabled(getContext(), true);
    JSObject result = new JSObject();
    result.put("enabled", true);
    call.resolve(result);
  }

  @PluginMethod
  public void stopListening(PluginCall call) {
    DeliveryEventStore.setEnabled(getContext(), false);
    JSObject result = new JSObject();
    result.put("enabled", false);
    call.resolve(result);
  }

  @PluginMethod
  public void requestSmsPermissions(PluginCall call) {
    if (smsPermissionGranted()) {
      JSObject result = new JSObject();
      result.put("smsPermission", "granted");
      call.resolve(result);
      return;
    }
    requestPermissionForAlias("sms", call, "smsPermsCallback");
  }

  @PermissionCallback
  private void smsPermsCallback(PluginCall call) {
    JSObject result = new JSObject();
    PermissionState state = getPermissionState("sms");
    result.put("smsPermission", state == PermissionState.GRANTED ? "granted" : "denied");
    call.resolve(result);
  }

  @PluginMethod
  public void requestPostNotifications(PluginCall call) {
    if (Build.VERSION.SDK_INT < 33 || postNotificationsGranted()) {
      JSObject result = new JSObject();
      result.put("postNotifications", "granted");
      call.resolve(result);
      return;
    }
    requestPermissionForAlias("notifications", call, "notifyPermsCallback");
  }

  @PermissionCallback
  private void notifyPermsCallback(PluginCall call) {
    JSObject result = new JSObject();
    PermissionState state = getPermissionState("notifications");
    result.put("postNotifications", state == PermissionState.GRANTED ? "granted" : "denied");
    call.resolve(result);
  }

  @PluginMethod
  public void openNotificationListenerSettings(PluginCall call) {
    Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    getContext().startActivity(intent);
    call.resolve();
  }

  @PluginMethod
  public void drainPending(PluginCall call) {
    List<JSONObject> pending = DeliveryEventStore.drain(getContext());
    JSArray events = new JSArray();
    for (JSONObject item : pending) {
      try {
        events.put(JSObject.fromJSONObject(item));
      } catch (Exception ignored) {
        // skip malformed
      }
    }
    JSObject result = new JSObject();
    result.put("events", events);
    call.resolve(result);
  }

  @PluginMethod
  public void showPreApprovalNotice(PluginCall call) {
    String provider = call.getString("provider", "Delivery");
    Integer hours = call.getInt("hours", 2);
    DeliveryEventStore.showPreApprovalNotice(getContext(), provider, hours == null ? 2 : hours);
    call.resolve();
  }

  private boolean smsPermissionGranted() {
    return ContextCompat.checkSelfPermission(getContext(), Manifest.permission.RECEIVE_SMS)
      == PackageManager.PERMISSION_GRANTED
      && ContextCompat.checkSelfPermission(getContext(), Manifest.permission.READ_SMS)
      == PackageManager.PERMISSION_GRANTED;
  }

  private boolean postNotificationsGranted() {
    if (Build.VERSION.SDK_INT < 33) return true;
    return ContextCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS)
      == PackageManager.PERMISSION_GRANTED;
  }

  private boolean isNotificationServiceEnabled() {
    String flat = Settings.Secure.getString(
      getContext().getContentResolver(),
      "enabled_notification_listeners"
    );
    if (flat == null || flat.isEmpty()) return false;
    ComponentName expected = new ComponentName(getContext(), DeliveryNotificationListenerService.class);
    for (String entry : flat.split(":")) {
      ComponentName component = ComponentName.unflattenFromString(entry);
      if (component != null && component.equals(expected)) return true;
      if (!TextUtils.isEmpty(entry) && entry.contains(getContext().getPackageName())) {
        if (entry.contains("DeliveryNotificationListenerService")) return true;
      }
    }
    return false;
  }
}
