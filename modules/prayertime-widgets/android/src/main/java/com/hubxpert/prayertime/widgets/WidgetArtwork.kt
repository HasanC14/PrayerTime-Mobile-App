package com.hubxpert.prayertime.widgets

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.ColorMatrix
import android.graphics.ColorMatrixColorFilter
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RectF
import android.graphics.Shader
import org.json.JSONObject
import android.util.LruCache

object WidgetArtwork {
  // Cache decorative pixels, never countdowns or prayer labels. Eviction leaves
  // bitmaps alive until RemoteViews has finished parceling them.
  private val cache = object : LruCache<String, Bitmap>(6 * 1024 * 1024) {
    override fun sizeOf(key: String, value: Bitmap): Int = value.allocationByteCount
  }
  @Synchronized fun render(context: Context, props: JSONObject, dark: Boolean, kind: String, widthDp: Int, heightDp: Int): Bitmap {
    val rasterScale = if (kind == "next") 3.0 else 2.25
    val rasterWidth = widthDp.coerceIn(100, 1000) * rasterScale
    val rasterHeight = heightDp.coerceIn(100, 1000) * rasterScale
    val metrics = context.resources.displayMetrics
    val screenPixels = (metrics.widthPixels.toDouble() * metrics.heightPixels).coerceAtLeast(100000.0)
    // Leave room for both orientation variants and their small overlays in IPC.
    val maxPixels = minOf(650000.0, screenPixels * .35)
    val shrink = minOf(1.0, 720.0 / rasterWidth, 960.0 / rasterHeight, Math.sqrt(maxPixels / (rasterWidth * rasterHeight)))
    val width = (rasterWidth * shrink).toInt().coerceAtLeast(1)
    val height = (rasterHeight * shrink).toInt().coerceAtLeast(1)
    val paletteKey = WidgetStore.palette(props, dark)?.toString() ?: "legacy"
    val key = listOf(props.optString("artwork"), props.optString("theme"), dark, kind,
      width, height, props.optBoolean("isRTL"), props.optBoolean("empty"), props.optJSONObject("hero")?.optBoolean("danger") == true, paletteKey).joinToString("|")
    cache.get(key)?.let { return it }
    // Bounded output keeps RemoteViews bitmap memory well below launcher limits.
    val result = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(result)
    val classic = props.optString("theme") == "classic-dark"
    val palette = WidgetStore.palette(props, dark)
    val danger = kind == "hero" && props.optJSONObject("hero")?.optBoolean("danger") == true
    val decorative = kind == "hero" || kind == "next"
    val surface = Color.parseColor(palette?.optString("surface", if (dark) "#222329" else "#FFFFFF") ?: if (dark) "#222329" else "#FFFFFF")
    val heroStart = Color.parseColor(palette?.optString(if (danger) "dangerStart" else "start") ?: if (danger) { if (dark) "#303035" else "#E7E4EA" } else { if (classic) "#3C2850" else if (dark) "#35323D" else "#E3D2F3" })
    val heroEnd = Color.parseColor(palette?.optString(if (danger) "dangerEnd" else "end") ?: if (danger) { if (dark) "#3B393F" else "#D8D4DE" } else { if (classic) "#60417C" else if (dark) "#464050" else "#C5A7E2" })
    val start = if (decorative) heroStart else palette?.optString("detailStart")?.takeIf { it.isNotEmpty() }?.let {Color.parseColor(it)} ?: blend(surface, heroStart, .44f)
    val end = if (decorative) heroEnd else palette?.optString("detailEnd")?.takeIf { it.isNotEmpty() }?.let {Color.parseColor(it)} ?: blend(surface, heroEnd, .28f)
    val radius = width.toFloat() / widthDp.coerceAtLeast(1) * 24f
    canvas.clipPath(Path().apply {addRoundRect(RectF(0f, 0f, width.toFloat(), height.toFloat()), radius, radius, Path.Direction.CW)})
    val paint = Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG)
    paint.shader = LinearGradient(0f, 0f, width.toFloat(), height.toFloat(), start, end, Shader.TileMode.CLAMP)
    canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), paint)
    paint.shader = null
    val rtl = props.optBoolean("isRTL")
    if (!danger && !props.optBoolean("empty")) {
      val file = when (props.optString("artwork")) {
        "serenity" -> "prayer-hero-mosque.png"
        "skyline" -> "prayer-hero-skyline.png"
        else -> "prayer-hero-moonlit.png"
      }
      try {
        val source = context.assets.open("prayertime-widgets/$file").use { stream ->
          BitmapFactory.decodeStream(stream, null, BitmapFactory.Options().apply { inSampleSize = 2 })
        }
        if (source != null) {
          canvas.save()
          if (rtl) canvas.scale(-1f, 1f, width / 2f, height / 2f)
          val artworkOpacity = palette?.optDouble("artworkOpacity", if (classic) .30 else if (dark) .18 else .94)
            ?: if (classic) .30 else if (dark) .18 else .94
          paint.alpha = ((if (!decorative) palette?.optDouble("detailArtworkOpacity", if (dark) .34 else .55) ?: if (dark) .34 else .55 else artworkOpacity).coerceIn(0.0, 1.0) * 255).toInt()
          val hue = palette?.optDouble("artworkHue", 0.0) ?: 0.0
          if (hue != 0.0) paint.colorFilter = hueFilter(hue)
          // A trailing-aligned cover crop preserves the illustration's real
          // proportions and removes the landscape asset's edge in square cards.
          val imageScale = maxOf(width.toFloat() / source.width, height.toFloat() / source.height)
          val imageWidth = source.width * imageScale
          val imageHeight = source.height * imageScale
          canvas.drawBitmap(source, null, RectF(width - imageWidth, 0f, width.toFloat(), imageHeight), paint)
          canvas.restore()
          paint.colorFilter = null
          source.recycle()
        }
      } catch (_: Exception) { /* Keep the gradient when a bundled image is unavailable. */ }
    }
    paint.alpha = 255
    val left = if (rtl) width.toFloat() else 0f
    val right = if (rtl) 0f else width.toFloat()
    paint.shader = LinearGradient(left, 0f, right, 0f, intArrayOf(withAlpha(start, 242), withAlpha(start, 166), withAlpha(start, 0)), floatArrayOf(0f, 0.28f, 0.9f), Shader.TileMode.CLAMP)
    canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), paint)
    paint.shader = LinearGradient(0f, 0f, 0f, height.toFloat(), intArrayOf(withAlpha(end, 0), withAlpha(end, 0), withAlpha(end, 230)), floatArrayOf(0f, 0.48f, 1f), Shader.TileMode.CLAMP)
    canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), paint)
    paint.shader = null
    paint.style = Paint.Style.STROKE
    paint.strokeWidth = width.toFloat() / widthDp.coerceAtLeast(1)
    paint.color = if (decorative) withAlpha(Color.WHITE, if (dark) 28 else 115)
      else Color.parseColor(palette?.optString("line", if (dark) "#34343E" else "#ECE5F1") ?: if (dark) "#34343E" else "#ECE5F1")
    canvas.drawRoundRect(RectF(1f, 1f, width - 1f, height - 1f), radius, radius, paint)
    cache.put(key, result)
    return result
  }

  @Synchronized fun highlight(color: Int): Bitmap {
    val key = "highlight:$color"
    cache.get(key)?.let { return it }
    return Bitmap.createBitmap(600, 80, Bitmap.Config.ARGB_8888).also {
      Canvas(it).drawRoundRect(RectF(0f, 0f, 600f, 80f), 24f, 24f, Paint(Paint.ANTI_ALIAS_FLAG).apply {this.color = color})
      cache.put(key, it)
    }
  }

  // A tiny, uncached strip keeps the selected theme on older launchers too.
  fun progress(color: Int, track: Int, value: Int, rtl: Boolean): Bitmap = Bitmap.createBitmap(600, 8, Bitmap.Config.ARGB_8888).also {
    val canvas = Canvas(it)
    if (rtl) canvas.scale(-1f, 1f, 300f, 4f)
    val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    paint.color = track
    canvas.drawRoundRect(RectF(0f, 0f, 600f, 8f), 4f, 4f, paint)
    paint.color = color
    val end = 600f * value.coerceIn(0, 1000) / 1000f
    if (end > 0) canvas.drawRoundRect(RectF(0f, 0f, end, 8f), minOf(4f, end / 2), 4f, paint)
  }

  private fun blend(first: Int, second: Int, amount: Float): Int = Color.rgb(
    (Color.red(first) * (1 - amount) + Color.red(second) * amount).toInt(),
    (Color.green(first) * (1 - amount) + Color.green(second) * amount).toInt(),
    (Color.blue(first) * (1 - amount) + Color.blue(second) * amount).toInt())

  private fun withAlpha(color: Int, alpha: Int) = (color and 0x00FFFFFF) or (alpha shl 24)

  private fun hueFilter(degrees: Double): ColorMatrixColorFilter {
    val radians = Math.toRadians(degrees)
    val c = Math.cos(radians).toFloat()
    val s = Math.sin(radians).toFloat()
    return ColorMatrixColorFilter(ColorMatrix(floatArrayOf(
      .213f + .787f*c - .213f*s, .715f - .715f*c - .715f*s, .072f - .072f*c + .928f*s, 0f, 0f,
      .213f - .213f*c + .143f*s, .715f + .285f*c + .140f*s, .072f - .072f*c - .283f*s, 0f, 0f,
      .213f - .213f*c - .787f*s, .715f - .715f*c + .715f*s, .072f + .928f*c + .072f*s, 0f, 0f,
      0f, 0f, 0f, 1f, 0f
    )))
  }
}
