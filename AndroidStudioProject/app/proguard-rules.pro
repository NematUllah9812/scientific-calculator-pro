# Keep the JavaScript bridge intact — reflection is used by the WebView.
-keepclassmembers class com.scientific.calculator.pro.MainActivity$WebAppInterface {
    public *;
}
-keepattributes JavascriptInterface
-keepattributes *Annotation*

-keep public class com.scientific.calculator.pro.MainActivity { *; }
-keep public class * extends android.app.Activity

# WebView with JS callbacks
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
