package in.syncrasystems.society;

import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Local-only filter for delivery SMS / notification bodies.
 * No network I/O — text never leaves the device until the JS bridge decides to act.
 */
public final class DeliveryMatchFilter {
  private DeliveryMatchFilter() {}

  private static final String[] VENDOR_PACKAGES = new String[] {
    "in.swiggy.android",
    "com.application.zomato",
    "com.grofers.customerapp",
    "com.zeptoconsumerapp",
    "com.bigbasket.mobileapp",
    "in.amazon.mShop.android.shopping",
    "com.flipkart.android",
    "com.bluedart",
    "com.delhivery.track",
    "com.dtdc",
    "com.xpressbees",
    "com.shadowfax",
    "com.whatsapp",
    "com.google.android.apps.messaging",
    "com.samsung.android.messaging",
    "com.android.mms"
  };

  private static final String[] SENDER_HINTS = new String[] {
    "swiggy", "zomato", "blinkit", "grofers", "zepto", "bigbasket", "amazon", "amzn",
    "flipkart", "ekart", "delhivery", "bluedart", "blue dart", "dtdc", "xpressbees",
    "shadowfax", "indiapost", "speedpost", "vk-sms", "vm-", "ad-"
  };

  private static final Pattern[] KEYWORD_PATTERNS = new Pattern[] {
    Pattern.compile("out\\s+for\\s+delivery", Pattern.CASE_INSENSITIVE),
    Pattern.compile("arriving\\s+today", Pattern.CASE_INSENSITIVE),
    Pattern.compile("\\bcourier\\b", Pattern.CASE_INSENSITIVE),
    Pattern.compile("speed\\s*post", Pattern.CASE_INSENSITIVE),
    Pattern.compile("\\bshipment\\b", Pattern.CASE_INSENSITIVE),
    Pattern.compile("\\bparcel\\b", Pattern.CASE_INSENSITIVE),
    Pattern.compile("delivery\\s+agent", Pattern.CASE_INSENSITIVE),
    Pattern.compile("your\\s+order\\s+is\\s+on\\s+the\\s+way", Pattern.CASE_INSENSITIVE),
    Pattern.compile("package\\s+has\\s+been\\s+dispatched", Pattern.CASE_INSENSITIVE),
    Pattern.compile("expected\\s+delivery", Pattern.CASE_INSENSITIVE)
  };

  private static final Pattern[] BRAND_PATTERNS = new Pattern[] {
    Pattern.compile("\\bswiggy\\b", Pattern.CASE_INSENSITIVE),
    Pattern.compile("\\bzomato\\b", Pattern.CASE_INSENSITIVE),
    Pattern.compile("\\bblinkit\\b|\\bgrofers\\b", Pattern.CASE_INSENSITIVE),
    Pattern.compile("\\bzepto\\b", Pattern.CASE_INSENSITIVE),
    Pattern.compile("\\bbig\\s*basket\\b|\\bbigbasket\\b", Pattern.CASE_INSENSITIVE),
    Pattern.compile("\\bamazon\\b|\\bamzn\\b", Pattern.CASE_INSENSITIVE),
    Pattern.compile("\\bflipkart\\b|\\bekart\\b", Pattern.CASE_INSENSITIVE),
    Pattern.compile("\\bblue\\s*dart\\b", Pattern.CASE_INSENSITIVE),
    Pattern.compile("\\bdelhivery\\b", Pattern.CASE_INSENSITIVE),
    Pattern.compile("\\bdtdc\\b", Pattern.CASE_INSENSITIVE),
    Pattern.compile("\\bxpress\\s*bees\\b|\\bxpressbees\\b", Pattern.CASE_INSENSITIVE),
    Pattern.compile("\\bshadow\\s*fax\\b|\\bshadowfax\\b", Pattern.CASE_INSENSITIVE),
    Pattern.compile("\\bindia\\s*post\\b|\\bspeed\\s*post\\b", Pattern.CASE_INSENSITIVE)
  };

  private static final String[] BRAND_LABELS = new String[] {
    "Swiggy", "Zomato", "Blinkit", "Zepto", "BigBasket", "Amazon", "Flipkart",
    "Blue Dart", "Delhivery", "DTDC", "Xpressbees", "Shadowfax", "India Post / Speed Post"
  };

  public static boolean isVendorPackage(String packageName) {
    if (packageName == null || packageName.isEmpty()) return false;
    String pkg = packageName.toLowerCase(Locale.US);
    for (String vendor : VENDOR_PACKAGES) {
      if (pkg.equals(vendor) || pkg.startsWith(vendor + ".")) return true;
    }
    return false;
  }

  public static boolean isVendorSender(String sender) {
    if (sender == null || sender.isEmpty()) return false;
    String value = sender.toLowerCase(Locale.US);
    for (String hint : SENDER_HINTS) {
      if (value.contains(hint)) return true;
    }
    return false;
  }

  public static boolean matchesKeywords(String body) {
    if (body == null || body.trim().isEmpty()) return false;
    for (Pattern pattern : KEYWORD_PATTERNS) {
      if (pattern.matcher(body).find()) return true;
    }
    for (Pattern pattern : BRAND_PATTERNS) {
      if (pattern.matcher(body).find()) return true;
    }
    return false;
  }

  /** Returns true when package/sender/body indicates a delivery alert worth forwarding. */
  public static boolean shouldCapture(String packageName, String sender, String body) {
    if (body == null || body.trim().isEmpty()) return false;
    if (isVendorPackage(packageName) && matchesKeywords(body)) return true;
    if (isVendorSender(sender) && matchesKeywords(body)) return true;
    return matchesKeywords(body);
  }

  public static String guessProviderLabel(String body) {
    if (body == null) return "Delivery";
    for (int i = 0; i < BRAND_PATTERNS.length; i++) {
      if (BRAND_PATTERNS[i].matcher(body).find()) return BRAND_LABELS[i];
    }
    return "Courier";
  }
}
