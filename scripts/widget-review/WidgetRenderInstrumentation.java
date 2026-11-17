package com.hasanbuilds.prayertime;
import android.app.Instrumentation;
import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.res.Configuration;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.BitmapDrawable;
import android.os.Bundle;
import android.os.Parcel;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.RemoteViews;
import android.widget.TextView;
import android.widget.ImageView;
import java.io.File;
import java.io.FileOutputStream;
import java.lang.reflect.Method;
import java.nio.file.Files;
import org.json.JSONArray;
import org.json.JSONObject;

public class WidgetRenderInstrumentation extends Instrumentation {
  @Override public void onCreate(Bundle args) {super.onCreate(args); start();}
  @Override public void onStart() {
    Bundle result = new Bundle();
    try {
      Context base = getTargetContext();
      JSONArray cases = new JSONArray(new String(Files.readAllBytes(new File(base.getFilesDir(), "widget-cases.json").toPath()), "UTF-8"));
      Class<?> storeClass = Class.forName("com.hubxpert.prayertime.widgets.WidgetStore");
      Object store = storeClass.getField("INSTANCE").get(null);
      Method preview = storeClass.getMethod("preview", Context.class, Class.class, int.class, int.class);
      File output = new File(base.getCacheDir(), "widget-review"); output.mkdirs();
      JSONArray report = new JSONArray();
      SharedPreferences saved = base.getSharedPreferences("prayertime_widgets", Context.MODE_PRIVATE);
      String original = saved.getString("timeline", null);
      try {
        for (int i=0; i<cases.length(); i++) {
          JSONObject c = cases.getJSONObject(i);
          Configuration config = new Configuration(base.getResources().getConfiguration());
          config.fontScale = (float)c.optDouble("fontScale", 1);
          Context context = base.createConfigurationContext(config);
          JSONObject props = c.getJSONObject("props");
          if(c.has("progress")) {
            long clock=System.currentTimeMillis(), duration=3600000;
            JSONObject hero=props.getJSONObject("hero");
            long start=clock-duration*c.getInt("progress")/100;
            hero.put("start",start);hero.put("target",start+duration);
          }
          if (c.optBoolean("noTimeline")) saved.edit().remove("timeline").commit();
          else saved.edit().putString("timeline", new JSONArray().put(new JSONObject().put("timestamp", 1).put("props", props)).toString()).commit();
          RemoteViews originalViews;
          if (c.has("gallery")) {
            int resource = context.getResources().getIdentifier(c.getString("gallery"), "layout", context.getPackageName());
            if (resource == 0) throw new IllegalStateException("Gallery layout missing");
            originalViews = new RemoteViews(context.getPackageName(), resource);
          } else {
            Class<?> provider = Class.forName("com.hubxpert.prayertime.widgets." + c.getString("provider"));
            originalViews = (RemoteViews)preview.invoke(store, context, provider, c.getInt("width"), c.getInt("height"));
          }
          Parcel parcel = Parcel.obtain();
          originalViews.writeToParcel(parcel, 0); parcel.setDataPosition(0);
          RemoteViews remote = RemoteViews.CREATOR.createFromParcel(parcel);
          parcel.recycle();
          final Throwable[] failure = new Throwable[1];
          final JSONArray[] issues = new JSONArray[1];
          final Bitmap[] bitmap = new Bitmap[1];
          runOnMainSync(() -> {
            try {
              float density = context.getResources().getDisplayMetrics().density;
              int width = (int)(c.optInt("width")*density), height = (int)(c.optInt("height")*density);
              View view = remote.apply(context, new FrameLayout(context));
              view.measure(View.MeasureSpec.makeMeasureSpec(width, View.MeasureSpec.EXACTLY), View.MeasureSpec.makeMeasureSpec(height, View.MeasureSpec.EXACTLY));
              view.layout(0,0,width,height);
              bitmap[0] = Bitmap.createBitmap(width,height,Bitmap.Config.ARGB_8888);
              view.draw(new Canvas(bitmap[0]));
              issues[0] = new JSONArray();
              if(c.has("gallery")&&(view.getLayoutParams()==null||view.getLayoutParams().width<=0||view.getLayoutParams().height<=0))
                issues[0].put(new JSONObject().put("id","gallery_preview").put("unboundedPreviewSize",true));
              inspect(view,0,0,width,height,issues[0]);
              if(c.has("progress")) inspectProgress(context,view,c.getInt("progress"),props,issues[0]);
            } catch(Throwable error) {failure[0]=error;}
          });
          if (failure[0]!=null) throw new RuntimeException(c.getString("name"), failure[0]);
          try(FileOutputStream file = new FileOutputStream(new File(output,c.getString("name")+".png"))) {bitmap[0].compress(Bitmap.CompressFormat.PNG,100,file);}
          bitmap[0].recycle();
          report.put(new JSONObject().put("name",c.getString("name")).put("issues",issues[0]));
        }
      } finally {
        if(original==null) saved.edit().remove("timeline").commit(); else saved.edit().putString("timeline",original).commit();
      }
      Files.write(new File(output,"report.json").toPath(), report.toString(2).getBytes("UTF-8"));
      result.putString("renders",Integer.toString(cases.length()));
      finish(Activity.RESULT_OK,result);
    } catch(Throwable error) {result.putString("error",android.util.Log.getStackTraceString(error));finish(Activity.RESULT_CANCELED,result);}
  }
  private static void inspectProgress(Context context,View root,int expected,JSONObject props,JSONArray issues) throws Exception {
    boolean rtl=props.optBoolean("isRTL");
    int id=context.getResources().getIdentifier("widget_progress","id",context.getPackageName());
    ImageView strip=root.findViewById(id);
    if(strip==null||strip.getVisibility()!=View.VISIBLE||strip.getHeight()==0||!(strip.getDrawable() instanceof BitmapDrawable)) {
      issues.put(new JSONObject().put("id","widget_progress").put("missing",true));return;
    }
    Bitmap pixels=((BitmapDrawable)strip.getDrawable()).getBitmap();
    int first=pixels.getPixel(rtl?pixels.getWidth()-2:1,pixels.getHeight()/2);
    int last=pixels.getPixel(rtl?1:pixels.getWidth()-2,pixels.getHeight()/2);
    JSONObject palette=props.getJSONObject("appearance").getJSONObject("light");
    boolean danger=props.getJSONObject("hero").optBoolean("danger");
    String colorKey=expected==0?(danger?"dangerTrack":"track"):(danger?"dangerInk":"accent");
    if(first!=android.graphics.Color.parseColor(palette.getString(colorKey)))
      issues.put(new JSONObject().put("id","widget_progress").put("incorrectThemeColour",true));
    if(android.graphics.Color.alpha(first)<250||android.graphics.Color.alpha(last)<250)
      issues.put(new JSONObject().put("id","widget_progress").put("transparentTrack",true));
    if(expected>0&&expected<100&&first==last)
      issues.put(new JSONObject().put("id","widget_progress").put("missingFillOrTrack",true));
    int transitions=0;
    for(int x=2;x<pixels.getWidth()-2;x++) {
      int pixel=pixels.getPixel(rtl?pixels.getWidth()-1-x:x,pixels.getHeight()/2);
      if(pixel!=first)transitions++;
    }
    double expectedTrack=(100-expected)/100.0*pixels.getWidth();
    if(expected>0&&expected<100&&Math.abs(transitions-expectedTrack)>8)
      issues.put(new JSONObject().put("id","widget_progress").put("incorrectFill",true));
  }
  private static void inspect(View view,int left,int top,int width,int height,JSONArray issues) throws Exception {
    if(view.getVisibility()!=View.VISIBLE) return;
    int x=left+view.getLeft(),y=top+view.getTop();
    if(view instanceof TextView) {
      TextView text=(TextView)view;
      if(text.length()>0) {
        String id=view.getResources().getResourceEntryName(view.getId());
        int ellipsis=0;
        if(text.getLayout()!=null) for(int i=0;i<text.getLayout().getLineCount();i++) ellipsis+=text.getLayout().getEllipsisCount(i);
        boolean overflow=x<0||y<0||x+view.getWidth()>width+1||y+view.getHeight()>height+1;
        boolean clipped=text.getLayout()!=null && text.getLayout().getHeight()+text.getCompoundPaddingTop()+text.getCompoundPaddingBottom()>view.getHeight()+1;
        if(overflow||clipped||ellipsis>0) issues.put(new JSONObject().put("id",id).put("overflow",overflow).put("clipped",clipped).put("ellipsis",ellipsis));
      }
    }
    if(view instanceof ViewGroup) {ViewGroup group=(ViewGroup)view;for(int i=0;i<group.getChildCount();i++) inspect(group.getChildAt(i),x,y,width,height,issues);}
  }
}
