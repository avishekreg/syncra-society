package in.syncrasystems.society;

import android.app.Notification;
import android.content.Context;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;

/**
 * OS notification listener for courier / food-delivery app alerts.
 * Only notification text is considered; matching is performed on-device.
 */
public class DeliveryNotificationListenerService extends NotificationListenerService {
  @Override
  public void onNotificationPosted(StatusBarNotification sbn) {
    if (sbn == null) return;
    Context context = getApplicationContext();
    if (!"granted".equals(DeliveryEventStore.getConsent(context))) return;

    try {
      if (sbn.isOngoing()) return;
      String packageName = sbn.getPackageName();
      if (packageName != null && packageName.equals(getPackageName())) return;

      Notification notification = sbn.getNotification();
      if (notification == null) return;

      Bundle extras = notification.extras;
      if (extras == null) return;

      CharSequence titleCs = extras.getCharSequence(Notification.EXTRA_TITLE);
      CharSequence textCs = extras.getCharSequence(Notification.EXTRA_TEXT);
      CharSequence bigCs = extras.getCharSequence(Notification.EXTRA_BIG_TEXT);

      String title = titleCs == null ? "" : titleCs.toString();
      String text = textCs == null ? "" : textCs.toString();
      String big = bigCs == null ? "" : bigCs.toString();

      String body = (title + "\n" + text + "\n" + big).trim();
      if (body.isEmpty()) return;

      DeliveryEventStore.enqueue(context, "notification", title, packageName, body);
    } catch (Exception ignored) {
      // Non-blocking background path.
    }
  }
}
