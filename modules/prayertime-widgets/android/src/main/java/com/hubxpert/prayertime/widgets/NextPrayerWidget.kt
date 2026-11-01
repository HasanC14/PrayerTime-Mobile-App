package com.hubxpert.prayertime.widgets

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.res.Configuration
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.os.Build
import android.os.SystemClock
import android.content.res.ColorStateList
import android.util.TypedValue
import android.view.View
import android.widget.RemoteViews
import org.json.JSONArray
import org.json.JSONObject

open class NextPrayerWidget : AppWidgetProvider() {
  override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) = WidgetStore.refresh(context)
  override fun onAppWidgetOptionsChanged(context: Context, manager: AppWidgetManager, id: Int, options: Bundle) = WidgetStore.refresh(context)
  override fun onDisabled(context: Context) = WidgetStore.refresh(context)
}
class DaySummaryWidget : NextPrayerWidget()
class PrayerTimesWidget : NextPrayerWidget()
class PrayerHeroWidget : NextPrayerWidget()

class WidgetRefreshReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) = WidgetStore.refresh(context)
}

object WidgetStore {
  fun preferences(context: Context) = context.getSharedPreferences("prayertime_widgets", Context.MODE_PRIVATE)
  private fun alarmIntent(context: Context): PendingIntent = PendingIntent.getBroadcast(
    context, 912, Intent(context, WidgetRefreshReceiver::class.java).setAction("com.hubxpert.prayertime.WIDGET_REFRESH"),
    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
  )
  fun cancelAlarm(context: Context) {
    (context.getSystemService(Context.ALARM_SERVICE) as AlarmManager).cancel(alarmIntent(context))
  }
  @Synchronized fun refresh(context: Context) {
    val manager = AppWidgetManager.getInstance(context)
    val providers = listOf(NextPrayerWidget::class.java, DaySummaryWidget::class.java, PrayerTimesWidget::class.java, PrayerHeroWidget::class.java)
    val installed = providers.map { it to manager.getAppWidgetIds(ComponentName(context, it)) }
    if (installed.all { it.second.isEmpty() }) { cancelAlarm(context); return }
    val now = System.currentTimeMillis()
    var current: JSONObject? = null
    var next: Long? = null
    try {
      val entries = JSONArray(preferences(context).getString("timeline", "[]"))
      for (index in 0 until entries.length()) {
        val entry = entries.getJSONObject(index)
        val timestamp = entry.getLong("timestamp")
        if (timestamp <= now) current = entry.getJSONObject("props")
        else if (next == null) next = timestamp
      }
    } catch (_: Exception) {
      // Corrupt/missing data gets an honest setup prompt, never an old prayer time.
      current = null
      next = null
    }
    val props = current ?: JSONObject().apply {
      put("label", "PrayerTime"); put("prayer", "Open PrayerTime")
      put("date", "Choose your location"); put("location", ""); put("time", "")
    }
    for ((provider, ids) in installed) {
      if (ids.isNotEmpty()) manager.updateAppWidget(ids, buildViews(context, provider, props))
    }
    val alarms = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    alarms.cancel(alarmIntent(context))
    next?.let {
      // Use existing precise-timing access if granted, without requesting it for widgets.
      try {
        if (Build.VERSION.SDK_INT < 31 || alarms.canScheduleExactAlarms()) {
          alarms.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, it, alarmIntent(context))
        } else alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, it, alarmIntent(context))
      } catch (_: SecurityException) {
        alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, it, alarmIntent(context))
      }
    }
  }

  fun preview(context: Context, provider: Class<out NextPrayerWidget>): RemoteViews {
    var props: JSONObject? = null
    try {
      val entries = JSONArray(preferences(context).getString("timeline", "[]"))
      for (index in 0 until entries.length()) {
        val entry = entries.getJSONObject(index)
        if (entry.getLong("timestamp") <= System.currentTimeMillis()) props = entry.getJSONObject("props")
      }
    } catch (_: Exception) { props = null }
    return buildViews(context, provider, props ?: JSONObject().apply {
      put("label", "PrayerTime"); put("prayer", "Open PrayerTime")
    })
  }

  private fun buildViews(context: Context, provider: Class<out NextPrayerWidget>, props: JSONObject): RemoteViews {
    val systemDark = context.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK == Configuration.UI_MODE_NIGHT_YES
    val classic = props.optString("theme") == "classic-dark"
    val dark = classic || props.optString("theme") == "dark" || (props.optString("theme") != "light" && systemDark)
    val ink = Color.parseColor(if (classic) "#F4EBFB" else if (dark) "#E4E1E8" else "#24143A")
    val accent = Color.parseColor(if (classic) "#C39BE5" else if (dark) "#B5A2CC" else "#6F4B94")
    val summary = props.optJSONObject("summary")
    val hero = props.optJSONObject("hero")
    val heroStyle = provider == PrayerHeroWidget::class.java && hero != null && !props.optBoolean("empty")
    val detailed = (provider == DaySummaryWidget::class.java || provider == PrayerTimesWidget::class.java) && summary != null && !props.optBoolean("empty")
    val times = detailed && provider == PrayerTimesWidget::class.java
    val layout = if (heroStyle) R.layout.prayertime_hero_widget else if (times) R.layout.prayertime_times_widget else if (detailed) R.layout.prayertime_summary_widget else R.layout.prayertime_widget
    val views = RemoteViews(context.packageName, layout)
    views.setInt(R.id.widget_root, "setBackgroundResource", if (dark) R.drawable.prayertime_widget_background_dark else R.drawable.prayertime_widget_background)
    views.setInt(R.id.widget_root, "setLayoutDirection", if (props.optBoolean("isRTL")) View.LAYOUT_DIRECTION_RTL else View.LAYOUT_DIRECTION_LTR)
    val kind = if (heroStyle) "hero" else if (times) "times" else if (detailed) "summary" else "next"
    views.setImageViewBitmap(R.id.widget_artwork, WidgetArtwork.render(context, props, dark, kind))
    if (heroStyle) {
      val danger = hero!!.optBoolean("danger")
      val heroInk = if (danger) Color.parseColor(if (dark) "#C9C4D1" else "#514C5B") else ink
      for ((id, value) in mapOf(R.id.widget_prayer to hero.optString("prayer"), R.id.widget_phase to hero.optString("phaseLabel"), R.id.widget_target to (hero.optString("targetLabel") + " · " + hero.optString("targetTime")), R.id.widget_footer to hero.optString("footerLabel"), R.id.widget_footer_time to hero.optString("footerTime"))) {
        views.setTextViewText(id, value)
        views.setTextColor(id, heroInk)
      }
      val now = System.currentTimeMillis()
      val remaining = (hero.optLong("target") - now).coerceAtLeast(0)
      views.setChronometerCountDown(R.id.widget_countdown, true)
      views.setChronometer(R.id.widget_countdown, SystemClock.elapsedRealtime() + remaining, null, remaining > 0)
      views.setTextColor(R.id.widget_countdown, heroInk)
      val duration = (hero.optLong("target") - hero.optLong("start")).coerceAtLeast(1)
      val progress = ((now - hero.optLong("start")) * 1000 / duration).coerceIn(0, 1000).toInt()
      views.setProgressBar(R.id.widget_progress, 1000, progress, false)
      if (Build.VERSION.SDK_INT >= 31) views.setColorStateList(R.id.widget_progress, "setProgressTintList", ColorStateList.valueOf(if (danger) heroInk else accent))
      views.setContentDescription(R.id.widget_root, hero.optString("prayer") + ", " + hero.optString("targetLabel") + " " + hero.optString("targetTime") + ", " + hero.optString("footerLabel") + " " + hero.optString("footerTime"))
    } else {
    val fields = mutableMapOf(R.id.widget_label to props.optString("label"), R.id.widget_date to props.optString("date"), R.id.widget_location to props.optString("location"))
    if (!times) {
      fields[R.id.widget_prayer] = props.optString("prayer")
      fields[R.id.widget_time] = props.optString("time")
    }
    if (detailed) {
      fields[R.id.widget_label] = if (times) summary.optString("timesLabel") else summary.optString("hijri")
      fields[R.id.widget_date] = if (times) summary.optString("hijri") + " · " + summary.optString("date") else summary.optString("date")
      if (times) {
        val rows = summary.optJSONArray("rows") ?: JSONArray()
        val rowIds = listOf(R.id.widget_row_0, R.id.widget_row_1, R.id.widget_row_2, R.id.widget_row_3, R.id.widget_row_4)
        for ((index, id) in rowIds.withIndex()) {
          val row = rows.optJSONObject(index)
          fields[id] = (row?.optString("name") ?: "") + "\n" + (row?.optString("time") ?: "")
        }
      } else {
        fields[R.id.widget_summary_label] = summary.optString("label")
        fields[R.id.widget_prayer] = summary.optString("prayer")
        fields[R.id.widget_time] = summary.optString("range")
        for ((id, key) in mapOf(R.id.widget_sunrise to "sunrise", R.id.widget_sunset to "sunset", R.id.widget_sehri to "sehri", R.id.widget_iftar to "iftar")) {
          val value = summary.optString(key)
          fields[id] = summary.optString(key + "Label") + " · " + value
          views.setViewVisibility(id, if (value.isEmpty()) View.GONE else View.VISIBLE)
        }
      }
    }
    for ((id, value) in fields) {
      views.setTextViewText(id, value)
      views.setTextColor(id, ink)
    }
    views.setTextColor(R.id.widget_label, accent)
    views.setTextColor(R.id.widget_location, accent)
    if (times) {
      val rows = summary.optJSONArray("rows")
      for ((index, id) in listOf(R.id.widget_row_0, R.id.widget_row_1, R.id.widget_row_2, R.id.widget_row_3, R.id.widget_row_4).withIndex()) {
        if (rows?.optJSONObject(index)?.optBoolean("active") == true) views.setTextColor(id, accent)
      }
    }
    val scale = props.optDouble("textScale", 1.0).coerceIn(0.9, 1.2).toFloat()
    if (!times) {
      views.setTextViewTextSize(R.id.widget_prayer, TypedValue.COMPLEX_UNIT_SP, 26f * scale)
      views.setViewVisibility(R.id.widget_time, if (fields[R.id.widget_time].isNullOrEmpty()) View.GONE else View.VISIBLE)
    }
    views.setContentDescription(R.id.widget_root, fields.values.joinToString(", "))
    }
    // Explicit launch intent cannot be intercepted by another application.
    context.packageManager.getLaunchIntentForPackage(context.packageName)?.let { launch ->
      launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
      launch.data = Uri.parse("prayertime://prayer")
      views.setOnClickPendingIntent(R.id.widget_root, PendingIntent.getActivity(context, 913, launch, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE))
    }
    return views
  }
}
