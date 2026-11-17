package com.hubxpert.prayertime.widgets

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.res.Configuration
import android.graphics.Color
import android.graphics.Typeface
import android.text.SpannableString
import android.text.Spanned
import android.text.style.RelativeSizeSpan
import android.text.style.StyleSpan
import android.text.style.ForegroundColorSpan
import android.net.Uri
import android.os.Bundle
import android.os.Build
import android.os.SystemClock
import android.util.SizeF
import android.view.View
import android.widget.RemoteViews
import java.util.concurrent.Executors
import java.util.concurrent.ScheduledFuture
import java.util.concurrent.TimeUnit
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject

open class NextPrayerWidget : AppWidgetProvider() {
  override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) = WidgetStore.enqueue(context, goAsync())
  override fun onAppWidgetOptionsChanged(context: Context, manager: AppWidgetManager, id: Int, options: Bundle) = WidgetStore.enqueue(context, goAsync())
  override fun onDisabled(context: Context) = WidgetStore.enqueue(context, goAsync())
}
class DaySummaryWidget : NextPrayerWidget()
class PrayerTimesWidget : NextPrayerWidget()
class PrayerHeroWidget : NextPrayerWidget()

class WidgetRefreshReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) = WidgetStore.enqueue(context, goAsync())
}

object WidgetStore {
  private val worker = Executors.newSingleThreadScheduledExecutor()
  private val queueLock = Any()
  private var queued: ScheduledFuture<*>? = null
  private val completions = mutableListOf<BroadcastReceiver.PendingResult>()

  // Keep broadcast callbacks short; group screen-on/unlock/duplicate alarms.
  fun enqueue(context: Context, completion: BroadcastReceiver.PendingResult) {
    val app = context.applicationContext
    synchronized(queueLock) {
      completions.add(completion)
      if (queued != null) return
      queued = worker.schedule({
        val batch = synchronized(queueLock) {
          queued = null
          completions.toList().also { completions.clear() }
        }
        try { refresh(app) }
        catch (_: Exception) { Log.w("PrayerTimeWidgets", "Widget refresh failed") }
        finally { batch.forEach { it.finish() } }
      }, 75, TimeUnit.MILLISECONDS)
    }
  }

  fun palette(props: JSONObject, systemDark: Boolean): JSONObject? {
    val appearance = props.optJSONObject("appearance") ?: return null
    return appearance.optJSONObject(if (appearance.optBoolean("followsSystem") && systemDark) "dark" else "light")
  }
  private var screenReceiver: BroadcastReceiver? = null

  private fun watchScreen(context: Context) {
    if (screenReceiver != null) return
    val receiver = object : BroadcastReceiver() {
      override fun onReceive(context: Context, intent: Intent) = enqueue(context, goAsync())
    }
    val filter = IntentFilter().apply {
      addAction(Intent.ACTION_SCREEN_ON)
      addAction(Intent.ACTION_USER_PRESENT)
      addAction(Intent.ACTION_CONFIGURATION_CHANGED)
    }
    val app = context.applicationContext
    if (Build.VERSION.SDK_INT >= 33) app.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
    else app.registerReceiver(receiver, filter)
    screenReceiver = receiver
  }

  fun preferences(context: Context) = context.getSharedPreferences("prayertime_widgets", Context.MODE_PRIVATE)
  private fun alarmIntent(context: Context, idle: Boolean = true): PendingIntent = PendingIntent.getBroadcast(
    context, if (idle) 912 else 914, Intent(context, WidgetRefreshReceiver::class.java).setAction("com.hubxpert.prayertime.WIDGET_REFRESH"),
    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
  )
  fun cancelAlarm(context: Context) {
    val alarms = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    alarms.cancel(alarmIntent(context))
    alarms.cancel(alarmIntent(context, false))
  }
  @Synchronized fun refresh(context: Context) {
    val manager = AppWidgetManager.getInstance(context)
    val providers = listOf(NextPrayerWidget::class.java, DaySummaryWidget::class.java, PrayerTimesWidget::class.java, PrayerHeroWidget::class.java)
    val installed = providers.map { it to manager.getAppWidgetIds(ComponentName(context, it)) }
    if (installed.all { it.second.isEmpty() }) {
      cancelAlarm(context)
      screenReceiver?.let { context.applicationContext.unregisterReceiver(it) }
      screenReceiver = null
      return
    }
    watchScreen(context)
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
      put("empty", true); put("theme", "light")
    }
    for ((provider, ids) in installed) {
      for (id in ids) {
        val options = manager.getAppWidgetOptions(id)
        val width = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH).takeIf { it > 0 } ?: if (provider == NextPrayerWidget::class.java) 160 else 320
        val height = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT).takeIf { it > 0 } ?: when (provider) {PrayerTimesWidget::class.java -> 300; DaySummaryWidget::class.java -> 200; else -> 170}
        if (Build.VERSION.SDK_INT >= 31) {
          @Suppress("DEPRECATION")
          val sizes = options.getParcelableArrayList<SizeF>(AppWidgetManager.OPTION_APPWIDGET_SIZES)
            ?.filter { it.width in 100f..1000f && it.height in 100f..1000f }?.distinct()?.take(2)
          if (!sizes.isNullOrEmpty()) {
            manager.updateAppWidget(id, RemoteViews(sizes.associateWith { size -> buildViews(context, provider, props, size.width.toInt(), size.height.toInt()) }))
          } else manager.updateAppWidget(id, buildViews(context, provider, props, width, height))
        } else manager.updateAppWidget(id, buildViews(context, provider, props, width, height))
      }
    }
    val alarms = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    cancelAlarm(context)
    next?.let {
      // Use existing precise-timing access if granted, without requesting it for widgets.
      try {
        if (Build.VERSION.SDK_INT < 31 || alarms.canScheduleExactAlarms()) {
          // Idle-allowed alarms are throttled, even for the six-minute noon
          // window. Keep a normal exact alarm too: it can update a visible
          // widget promptly while awake or when leaving Doze.
          alarms.setExact(AlarmManager.RTC, it, alarmIntent(context, false))
          alarms.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, it, alarmIntent(context))
        } else {
          alarms.set(AlarmManager.RTC, it, alarmIntent(context, false))
          alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, it, alarmIntent(context))
        }
      } catch (_: SecurityException) {
        alarms.set(AlarmManager.RTC, it, alarmIntent(context, false))
        alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, it, alarmIntent(context))
      }
    }
  }

  fun preview(context: Context, provider: Class<out NextPrayerWidget>, width: Int = if (provider == NextPrayerWidget::class.java) 160 else 320,
    height: Int = when (provider) {PrayerTimesWidget::class.java -> 300; DaySummaryWidget::class.java -> 200; NextPrayerWidget::class.java -> 160; else -> 170}): RemoteViews {
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
      put("date", "Choose your location"); put("empty", true); put("theme", "light")
    }, width, height)
  }

  private fun buildViews(context: Context, provider: Class<out NextPrayerWidget>, props: JSONObject, width: Int, height: Int): RemoteViews {
    val systemDark = context.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK == Configuration.UI_MODE_NIGHT_YES
    val classic = props.optString("theme") == "classic-dark"
    val palette = palette(props, systemDark)
    val dark = palette?.optBoolean("dark") ?: (classic || props.optString("theme") == "dark" || props.optString("theme") == "midnight-blue" || ((props.optString("theme").isEmpty() || props.optString("theme") == "system") && systemDark))
    fun color(key: String, fallback: String): Int = try { Color.parseColor(palette?.optString(key, fallback) ?: fallback) }
      catch (_: IllegalArgumentException) { Color.parseColor(fallback) }
    val ink = color("ink", if (dark) "#EEEAF2" else "#24143A")
    val accent = color("accent", if (dark) "#C0ACD7" else "#6F4B94")
    val muted = color("muted", if (dark) "#BBB5C4" else "#746A7D")
    val heroMuted = color("heroMuted", if (dark) "#CEC4DA" else "#503E5D")
    val line = color("line", if (dark) "#34343E" else "#ECE5F1")
    val highlight = color("highlight", if (dark) "#35303F" else "#F1E8F7")
    val summary = props.optJSONObject("summary")
    val hero = props.optJSONObject("hero")
    val heroStyle = provider == PrayerHeroWidget::class.java && hero != null && !props.optBoolean("empty")
    val detailed = (provider == DaySummaryWidget::class.java || provider == PrayerTimesWidget::class.java) && summary != null && !props.optBoolean("empty")
    val times = detailed && provider == PrayerTimesWidget::class.java
    val layout = if (heroStyle) R.layout.prayertime_hero_widget else if (times) R.layout.prayertime_times_widget else if (detailed) R.layout.prayertime_summary_widget else R.layout.prayertime_widget
    val views = RemoteViews(context.packageName, layout)
    views.setInt(R.id.widget_root, "setBackgroundResource", if (dark) R.drawable.prayertime_widget_background_dark else R.drawable.prayertime_widget_background)
    views.setInt(R.id.widget_root, "setLayoutDirection", if (props.optBoolean("isRTL")) View.LAYOUT_DIRECTION_RTL else View.LAYOUT_DIRECTION_LTR)
    val inset = if (width < 280 || height < 156) 12 else 16
    val dp = context.resources.displayMetrics.density
    views.setViewPadding(R.id.widget_content, (inset * dp).toInt(), (inset * dp).toInt(), (inset * dp).toInt(), (inset * dp).toInt())
    val kind = if (heroStyle) "hero" else if (times) "times" else if (detailed) "summary" else "next"
    views.setImageViewBitmap(R.id.widget_artwork, WidgetArtwork.render(context, props, dark, kind, width, height))
    val description = mutableListOf<String>()
    val requestedScale = props.optDouble("textScale", 1.0).coerceIn(.9, 1.2).toFloat()
    val systemScale = context.resources.configuration.fontScale.coerceAtLeast(.5f)
    // Honour the larger enlargement setting rather than multiplying two of them.
    val textScale = if (requestedScale >= 1f) maxOf(requestedScale, systemScale) / systemScale else requestedScale
    val effectiveScale = textScale * systemScale
    val largeText = effectiveScale > 1.1f
    fun field(id: Int, value: String, textColor: Int = ink, bold: Boolean = false) {
      val text = SpannableString(value)
      if (text.isNotEmpty()) {
        if (textScale != 1f) text.setSpan(RelativeSizeSpan(textScale), 0, text.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        if (bold) text.setSpan(StyleSpan(Typeface.BOLD), 0, text.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
      }
      views.setTextViewText(id, text)
      views.setTextColor(id, textColor)
      if (value.isNotBlank()) description.add(value)
    }
    if (heroStyle) {
      val danger = hero!!.optBoolean("danger")
      val heroInk = if (danger) color("dangerInk", if (dark) "#D9D2E2" else "#514C5B") else ink
      val name = hero.optString("prayer")
      val heading = SpannableString(name + "  " + hero.optString("phaseLabel"))
      if (textScale != 1f) heading.setSpan(RelativeSizeSpan(textScale), 0, heading.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
      if (heading.length > name.length + 2) {
        heading.setSpan(RelativeSizeSpan(.5f), name.length + 2, heading.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        heading.setSpan(StyleSpan(Typeface.NORMAL), name.length + 2, heading.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        heading.setSpan(ForegroundColorSpan(if (danger) heroInk else heroMuted), name.length + 2, heading.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
      }
      views.setTextViewText(R.id.widget_prayer, heading)
      views.setTextColor(R.id.widget_prayer, heroInk)
      description.add(heading.toString())
      val window = if (hero.optString("phase") == "starts") hero.optString("targetLabel") + " " + hero.optString("targetTime") else hero.optString("windowRange")
      field(R.id.widget_window, window, if (danger) heroInk else heroMuted)
      views.setViewVisibility(R.id.widget_window, if (window.isNotEmpty() && height >= if (largeText) 180 else 160) View.VISIBLE else View.GONE)
      field(R.id.widget_footer, hero.optString("footerLabel"), if (danger) heroInk else heroMuted)
      field(R.id.widget_footer_time, hero.optString("footerTime"), heroInk)
      val now = System.currentTimeMillis()
      val remaining = (hero.optLong("target") - now).coerceAtLeast(0)
      views.setChronometerCountDown(R.id.widget_countdown, true)
      views.setChronometer(R.id.widget_countdown, SystemClock.elapsedRealtime() + remaining, null, remaining > 0)
      views.setTextColor(R.id.widget_countdown, heroInk)
      val duration = (hero.optLong("target") - hero.optLong("start")).coerceAtLeast(1)
      val progress = ((now - hero.optLong("start")) * 1000 / duration).coerceIn(0, 1000).toInt()
      val track = color(if (danger) "dangerTrack" else "track", if (dark) "#696274" else "#AB8BC5")
      views.setImageViewBitmap(R.id.widget_progress, WidgetArtwork.progress(if (danger) heroInk else accent, track, progress, props.optBoolean("isRTL")))
      description.add(hero.optString("targetLabel") + " " + hero.optString("targetTime"))
    } else if (times) {
      field(R.id.widget_label, summary!!.optString("timesLabel"))
      field(R.id.widget_date, summary.optString("hijri"), accent)
      field(R.id.widget_location, props.optString("location"), muted)
      val rows = summary.optJSONArray("rows") ?: JSONArray()
      val names = listOf(R.id.widget_row_0_name, R.id.widget_row_1_name, R.id.widget_row_2_name, R.id.widget_row_3_name, R.id.widget_row_4_name)
      val clocks = listOf(R.id.widget_row_0_time, R.id.widget_row_1_time, R.id.widget_row_2_time, R.id.widget_row_3_time, R.id.widget_row_4_time)
      val backgrounds = listOf(R.id.widget_row_0_background, R.id.widget_row_1_background, R.id.widget_row_2_background, R.id.widget_row_3_background, R.id.widget_row_4_background)
      for (index in 0..4) {
        val row = rows.optJSONObject(index)
        val active = row?.optBoolean("active") == true
        field(names[index], row?.optString("name") ?: "", if (active) accent else ink, active)
        field(clocks[index], row?.optString("startTime", row.optString("time")) ?: "", if (active) accent else ink)
        views.setViewVisibility(backgrounds[index], if (active) View.VISIBLE else View.GONE)
        if (active) views.setImageViewBitmap(backgrounds[index], WidgetArtwork.highlight(highlight))
        // Preserve full period details for screen readers while displaying starts.
        row?.optString("time")?.takeIf { it.isNotEmpty() }?.let { description.add(it) }
      }
    } else if (detailed) {
      field(R.id.widget_label, summary!!.optString("hijri"), accent)
      field(R.id.widget_date, summary.optString("date"), muted)
      field(R.id.widget_summary_label, summary.optString("label"), accent)
      field(R.id.widget_prayer, summary.optString("prayer"))
      field(R.id.widget_time, summary.optString("range"), muted)
      val fasting = summary.optString("sehri").isNotEmpty() && summary.optString("iftar").isNotEmpty()
      for ((index, key) in (if (fasting) listOf("sehri", "iftar") else listOf("sunrise", "sunset")).withIndex()) {
        field(if (index == 0) R.id.widget_stat_0_label else R.id.widget_stat_1_label, summary.optString(key + "Label"), muted)
        field(if (index == 0) R.id.widget_stat_0_value else R.id.widget_stat_1_value, summary.optString(key))
      }
      views.setInt(R.id.widget_divider, "setBackgroundColor", line)
      views.setViewVisibility(R.id.widget_date, if (height < if (largeText) 200 else 190) View.GONE else View.VISIBLE)
      views.setViewVisibility(R.id.widget_summary_label, if (height < if (largeText) 224 else 190) View.GONE else View.VISIBLE)
      field(R.id.widget_location, props.optString("location"), muted)
      views.setViewVisibility(R.id.widget_location, if (height >= if (largeText) 252 else 224) View.VISIBLE else View.GONE)
    } else {
      field(R.id.widget_label, props.optString("label"), accent)
      field(R.id.widget_prayer, props.optString("prayer"))
      field(R.id.widget_time, props.optString("time"))
      field(R.id.widget_date, props.optString("date"), heroMuted)
      field(R.id.widget_location, props.optString("location"), heroMuted)
      views.setViewVisibility(R.id.widget_time, if (props.optString("time").isEmpty()) View.GONE else View.VISIBLE)
      views.setViewVisibility(R.id.widget_date, if (width >= 250 && height >= 190 || props.optBoolean("empty")) View.VISIBLE else View.GONE)
      views.setViewVisibility(R.id.widget_location, if (height < 150 + (maxOf(1f, effectiveScale) - 1f) * 150 || props.optBoolean("empty")) View.GONE else View.VISIBLE)
      views.setInt(R.id.widget_prayer, "setMaxLines", if (props.optBoolean("empty")) 2 else 1)
    }
    views.setContentDescription(R.id.widget_root, description.joinToString(", "))
    // Explicit launch intent cannot be intercepted by another application.
    context.packageManager.getLaunchIntentForPackage(context.packageName)?.let { launch ->
      launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
      launch.data = Uri.parse("prayertime://prayer")
      views.setOnClickPendingIntent(R.id.widget_root, PendingIntent.getActivity(context, 913, launch, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE))
    }
    return views
  }
}
