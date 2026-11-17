import {writeFileSync} from 'node:fs';
import {buildHomeWidgetTimeline} from '../../src/services/widgetTimeline';
import {calculatePrayerCalendar} from '../../src/services/prayerTimes';
import {DEFAULT_SETTINGS,FALLBACK_LOCATION} from '../../src/constants/settings';
import type {AppLanguage,ThemeMode} from '../../src/types';
const now=new Date();
type Kind = 'hero' | 'next' | 'summary' | 'times';
const providers: Record<Kind,string>={hero:'PrayerHeroWidget',next:'NextPrayerWidget',summary:'DaySummaryWidget',times:'PrayerTimesWidget'};
const sizes: Record<Kind,[number,number]>={hero:[320,170],next:[160,160],summary:[320,200],times:[320,300]};
const cases:object[]=[];
for(const language of ['en','bn','ar'] as AppLanguage[])for(const theme of ['light','dark','classic-dark','sand','rose','midnight-blue'] as ThemeMode[]){
 if(language!=='en'&&theme!=='light'&&theme!=='dark')continue;
 const settings={...DEFAULT_SETTINGS,language,themeMode:theme};
 const props=buildHomeWidgetTimeline(calculatePrayerCalendar(FALLBACK_LOCATION,settings,now,1,15),FALLBACK_LOCATION,settings,now)[0].props;
 for(const kind of (Object.keys(providers) as Kind[])){
  const [width,height]=sizes[kind];
  cases.push({name:`${language}-${theme}-${kind}`,provider:providers[kind],width,height,props});
  if(theme==='light')cases.push({name:`${language}-compact-${kind}`,provider:providers[kind],width:kind==='next'?136:250,height:kind==='next'?136:kind==='hero'?136:kind==='summary'?170:260,fontScale:1.2,props});
 }
 if(theme==='light'&&language==='en'){
  const fastingSettings={...settings,ramadanMode:'always' as const};
  const fasting=buildHomeWidgetTimeline(calculatePrayerCalendar(FALLBACK_LOCATION,fastingSettings,now,1,15),FALLBACK_LOCATION,fastingSettings,now)[0].props;
  cases.push({name:'en-fasting-summary',provider:providers.summary,width:320,height:200,props:fasting});
 }
}
for (const language of ['en','bn','ar'] as AppLanguage[]) {
 const settings={...DEFAULT_SETTINGS,language,textScale:1.2};
 const props=buildHomeWidgetTimeline(calculatePrayerCalendar(FALLBACK_LOCATION,settings,now,1,15),FALLBACK_LOCATION,settings,now)[0].props;
 for (const kind of (Object.keys(providers) as Kind[])) {
  cases.push({name:`${language}-large-text-${kind}`,provider:providers[kind],width:kind==='next'?160:280,height:kind==='next'?160:kind==='hero'?150:kind==='summary'?180:280,fontScale:1.2,props});
 }
 const empty=buildHomeWidgetTimeline([],null,settings,now)[0].props;
 cases.push({name:`${language}-empty`,provider:providers.next,width:160,height:160,props:empty});
 if(props.hero) {
  const danger={...props,hero:{...props.hero,danger:true,prayer:language==='ar'?'وقت النهي':language==='bn'?'নিষিদ্ধ সময়':'Prohibited time',start:Date.now()-120000,target:Date.now()+300000}};
  cases.push({name:`${language}-danger`,provider:providers.hero,width:280,height:150,props:danger});
 }
 cases.push({name:`${language}-wide-next`,provider:providers.next,width:320,height:170,props});
}
// The original matrix covers the default illustration. Exercise the other two
// in both colour schemes and each script, including their distinct source ratio.
for (const language of ['en','bn','ar'] as AppLanguage[]) for (const themeMode of ['light','dark'] as const) {
 const settings={...DEFAULT_SETTINGS,language,themeMode};
 const calendar=calculatePrayerCalendar(FALLBACK_LOCATION,settings,now,1,15);
 const props=buildHomeWidgetTimeline(calendar,FALLBACK_LOCATION,settings,now)[0].props;
 for (const artwork of ['skyline','moonlit'] as const) for (const kind of Object.keys(providers) as Kind[]) {
  const [width,height]=sizes[kind];
  cases.push({name:`${language}-${themeMode}-${artwork}-${kind}`,provider:providers[kind],width,height,props:{...props,artwork}});
 }
 for (const progress of [0,1,50,99,100]) for (const danger of [false,true]) {
  if(!props.hero)continue;
  cases.push({name:`${language}-${themeMode}-${danger?'danger':'normal'}-progress-${progress}`,provider:providers.hero,
   width:320,height:170,progress,props:{...props,hero:{...props.hero,danger}}});
 }
}
if (process.argv.includes('--gallery')) for (const kind of Object.keys(providers) as Kind[]) {
 const settings = {...DEFAULT_SETTINGS};
 const props = buildHomeWidgetTimeline(calculatePrayerCalendar(FALLBACK_LOCATION,settings,now,1,15),FALLBACK_LOCATION,settings,now)[0].props;
 const [width,height] = sizes[kind];
 cases.push({name:`en-gallery-${kind}`,gallery:`prayertime_${kind}_gallery`,width,height,props});
}
// A native upgrade may initially receive the previous binary's saved payload.
const legacy=JSON.parse(JSON.stringify(buildHomeWidgetTimeline(calculatePrayerCalendar(FALLBACK_LOCATION,DEFAULT_SETTINGS,now,1,15),FALLBACK_LOCATION,DEFAULT_SETTINGS,now)[0].props));
for(const palette of [legacy.appearance.light,legacy.appearance.dark]) {
 for(const field of ['detailStart','detailEnd','detailArtworkOpacity','dangerTrack'])delete palette[field];
 palette.track='rgba(255,255,255,0.50)';
}
if(legacy.hero)delete legacy.hero.windowRange;
cases.push({name:'native-legacy-hero',provider:providers.hero,width:320,height:170,props:legacy});
cases.push({name:'native-missing-data',provider:providers.next,width:160,height:160,noTimeline:true,props:{}});
writeFileSync(process.argv[2],JSON.stringify(cases));
console.log(cases.length+' native render cases');
