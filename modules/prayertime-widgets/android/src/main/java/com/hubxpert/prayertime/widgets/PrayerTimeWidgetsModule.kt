package com.hubxpert.prayertime.widgets

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.os.Build
import android.os.Bundle
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.json.JSONArray

class PrayerTimeWidgetsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PrayerTimeWidgets")
    AsyncFunction("updateTimeline") { json: String ->
      val context = requireNotNull(appContext.reactContext)
      // Validate before replacing the previously persisted timeline.
      val entries = JSONArray(json)
      require(entries.length() in 1..200) { "Invalid widget timeline" }
      var previous = -1L
      for (index in 0 until entries.length()) {
        val entry = entries.getJSONObject(index)
        val timestamp = entry.getLong("timestamp")
        require(timestamp > previous) { "Widget dates must increase" }
        entry.getJSONObject("props")
        previous = timestamp
      }
      check(WidgetStore.preferences(context).edit().putString("timeline", json).commit()) { "Could not save widget times" }
      WidgetStore.refresh(context)
    }
    AsyncFunction("requestPin") { kind: String ->
      val context = requireNotNull(appContext.reactContext)
      val manager = AppWidgetManager.getInstance(context)
      if (Build.VERSION.SDK_INT >= 26 && manager.isRequestPinAppWidgetSupported) {
        val provider = when (kind) {
          "hero" -> PrayerHeroWidget::class.java
          "next" -> NextPrayerWidget::class.java
          "summary" -> DaySummaryWidget::class.java
          "times" -> PrayerTimesWidget::class.java
          else -> throw IllegalArgumentException("Unknown widget style")
        }
        val extras = Bundle().apply {
          putParcelable(AppWidgetManager.EXTRA_APPWIDGET_PREVIEW, WidgetStore.preview(context, provider))
        }
        manager.requestPinAppWidget(ComponentName(context, provider), extras, null)
      } else false
    }
  }
}
