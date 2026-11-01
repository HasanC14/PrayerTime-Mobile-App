package com.hubxpert.prayertime.widgets

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Shader
import org.json.JSONObject

object WidgetArtwork {
  fun render(context: Context, props: JSONObject, dark: Boolean, kind: String): Bitmap {
    // Bounded output keeps RemoteViews bitmap memory well below launcher limits.
    val width = if (kind == "next") 480 else 720
    val height = if (kind == "next") 480 else if (kind == "times") 800 else 400
    val result = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(result)
    val classic = props.optString("theme") == "classic-dark"
    val danger = kind == "hero" && props.optJSONObject("hero")?.optBoolean("danger") == true
    val start = Color.parseColor(if (danger) { if (dark) "#303035" else "#E7E4EA" } else { if (classic) "#3C2850" else if (dark) "#35323D" else "#E3D2F3" })
    val end = Color.parseColor(if (danger) { if (dark) "#3B393F" else "#D8D4DE" } else { if (classic) "#60417C" else if (dark) "#464050" else "#C5A7E2" })
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
          paint.alpha = if (classic) 76 else if (dark) 46 else if (kind == "times") 125 else 240
          val imageHeight = width.toFloat() * source.height / source.width
          canvas.drawBitmap(source, null, RectF(0f, 0f, width.toFloat(), imageHeight), paint)
          canvas.restore()
          source.recycle()
        }
      } catch (_: Exception) { /* Keep the gradient when a bundled image is unavailable. */ }
    }
    paint.alpha = 255
    val left = if (rtl) width.toFloat() else 0f
    val right = if (rtl) 0f else width.toFloat()
    paint.shader = LinearGradient(left, 0f, right, 0f, intArrayOf(withAlpha(start, 242), withAlpha(start, 179), withAlpha(start, 0)), floatArrayOf(0f, 0.28f, 0.76f), Shader.TileMode.CLAMP)
    canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), paint)
    paint.shader = LinearGradient(0f, 0f, 0f, height.toFloat(), intArrayOf(withAlpha(end, 0), withAlpha(end, 0), withAlpha(end, 179), withAlpha(end, 242)), floatArrayOf(0f, 0.5f, 0.82f, 1f), Shader.TileMode.CLAMP)
    canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), paint)
    return result
  }

  private fun withAlpha(color: Int, alpha: Int) = (color and 0x00FFFFFF) or (alpha shl 24)
}
