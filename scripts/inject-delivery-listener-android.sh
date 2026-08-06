#!/usr/bin/env bash
# Inject maiSociety DeliveryListener native module into a generated Capacitor Android project.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ANDROID_ROOT="${ROOT}/android"
SRC_ROOT="${ROOT}/native/android/delivery-listener/in/syncrasystems/society"
DEST_JAVA="${ANDROID_ROOT}/app/src/main/java/in/syncrasystems/society"
MANIFEST="${ANDROID_ROOT}/app/src/main/AndroidManifest.xml"

if [ ! -d "${ANDROID_ROOT}" ]; then
  echo "ERROR: android/ not found. Run npx cap add android first."
  exit 1
fi

if [ ! -d "${SRC_ROOT}" ]; then
  echo "ERROR: native delivery listener sources missing at ${SRC_ROOT}"
  exit 1
fi

mkdir -p "${DEST_JAVA}"
cp -f "${SRC_ROOT}/"*.java "${DEST_JAVA}/"
echo "Copied DeliveryListener Java sources → ${DEST_JAVA}"

if [ ! -f "${MANIFEST}" ]; then
  echo "ERROR: AndroidManifest.xml not found"
  exit 1
fi

python3 - <<'PY'
from pathlib import Path
import re

manifest_path = Path("android/app/src/main/AndroidManifest.xml")
text = manifest_path.read_text()

permissions = [
    "android.permission.RECEIVE_SMS",
    "android.permission.READ_SMS",
    "android.permission.POST_NOTIFICATIONS",
]
for permission in permissions:
    if permission not in text:
        text = re.sub(
            r"(<application\b)",
            f'    <uses-permission android:name="{permission}" />\\n\\1',
            text,
            count=1,
        )

if "DeliverySmsReceiver" not in text:
    block = '''
        <!-- maiSociety Delivery SMS + Notification Listener -->
        <receiver
            android:name=".DeliverySmsReceiver"
            android:enabled="true"
            android:exported="true"
            android:permission="android.permission.BROADCAST_SMS">
            <intent-filter android:priority="999">
                <action android:name="android.provider.Telephony.SMS_RECEIVED" />
            </intent-filter>
        </receiver>
        <service
            android:name=".DeliveryNotificationListenerService"
            android:exported="true"
            android:label="maiSociety Delivery Listener"
            android:permission="android.permission.BIND_NOTIFICATION_LISTENER_SERVICE">
            <intent-filter>
                <action android:name="android.service.notification.NotificationListenerService" />
            </intent-filter>
        </service>
'''
    if "</application>" not in text:
        raise SystemExit("</application> not found in AndroidManifest.xml")
    text = text.replace("</application>", block + "\n    </application>", 1)
    print("Injected DeliverySmsReceiver + DeliveryNotificationListenerService into manifest")
else:
    print("Manifest already contains DeliverySmsReceiver")

manifest_path.write_text(text)

# Patch MainActivity (Java or Kotlin)
candidates = list(Path("android/app/src/main").rglob("MainActivity.java")) + list(
    Path("android/app/src/main").rglob("MainActivity.kt")
)
if not candidates:
    print("WARNING: MainActivity not found — plugin copied but not registered")
else:
    path = candidates[0]
    src = path.read_text()
    if "DeliveryListenerPlugin" in src and "registerPlugin" in src:
        print(f"MainActivity already registers DeliveryListenerPlugin: {path}")
    elif path.suffix == ".java":
        body = '''package in.syncrasystems.society;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(DeliveryListenerPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
'''
        # Preserve original package if different
        pkg_match = re.search(r"^package\\s+([\\w.]+);", src, re.M)
        if pkg_match:
            body = body.replace("package in.syncrasystems.society;", f"package {pkg_match.group(1)};", 1)
            if pkg_match.group(1) != "in.syncrasystems.society":
                body = body.replace(
                    "import com.getcapacitor.BridgeActivity;",
                    "import com.getcapacitor.BridgeActivity;\nimport in.syncrasystems.society.DeliveryListenerPlugin;",
                    1,
                )
        path.write_text(body)
        print(f"Rewrote MainActivity with DeliveryListenerPlugin registration: {path}")
    else:
        if "import in.syncrasystems.society.DeliveryListenerPlugin" not in src:
            src = "import in.syncrasystems.society.DeliveryListenerPlugin\n" + src
        if "override fun onCreate" in src:
            src = re.sub(
                r"(override fun onCreate\\(savedInstanceState: Bundle\\?\\)\\s*\\{)",
                r"\1\n        registerPlugin(DeliveryListenerPlugin::class.java)",
                src,
                count=1,
            )
        else:
            src = re.sub(
                r"(class MainActivity[^{]*\\{)",
                r"\1\n    override fun onCreate(savedInstanceState: android.os.Bundle?) {\n        registerPlugin(DeliveryListenerPlugin::class.java)\n        super.onCreate(savedInstanceState)\n    }\n",
                src,
                count=1,
            )
        path.write_text(src)
        print(f"Patched Kotlin MainActivity: {path}")

print("Delivery listener Android injection complete.")
PY
