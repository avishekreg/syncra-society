package in.syncrasystems.society;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.provider.Telephony;
import android.telephony.SmsMessage;

/**
 * Captures inbound SMS for delivery vendors / keywords.
 * Filtering is local-only; non-matching messages are discarded immediately.
 */
public class DeliverySmsReceiver extends BroadcastReceiver {
  @Override
  public void onReceive(Context context, Intent intent) {
    if (intent == null || context == null) return;
    if (!Telephony.Sms.Intents.SMS_RECEIVED_ACTION.equals(intent.getAction())) return;
    if (!"granted".equals(DeliveryEventStore.getConsent(context))) return;

    try {
      Bundle extras = intent.getExtras();
      if (extras == null) return;

      Object[] pdus = (Object[]) extras.get("pdus");
      if (pdus == null || pdus.length == 0) return;

      String format = extras.getString("format");
      StringBuilder body = new StringBuilder();
      String sender = "";

      for (Object pdu : pdus) {
        SmsMessage message;
        if (format != null) {
          message = SmsMessage.createFromPdu((byte[]) pdu, format);
        } else {
          message = SmsMessage.createFromPdu((byte[]) pdu);
        }
        if (message == null) continue;
        if (sender.isEmpty()) {
          String from = message.getDisplayOriginatingAddress();
          sender = from == null ? "" : from;
        }
        String part = message.getMessageBody();
        if (part != null) body.append(part);
      }

      String text = body.toString().trim();
      if (text.isEmpty()) return;

      DeliveryEventStore.enqueue(context, "sms", sender, null, text);
    } catch (Exception ignored) {
      // Non-blocking: never throw from SMS receiver.
    }
  }
}
