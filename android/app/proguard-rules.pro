# Retrofit / Gson keep rules
-keepattributes Signature, *Annotation*
-keep class com.ken.fittrack.model.** { *; }
-keepclassmembers class * { @com.google.gson.annotations.SerializedName <fields>; }
