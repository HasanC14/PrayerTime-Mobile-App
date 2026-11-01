// Short, source-checked English excerpts. Keep quotation text separate from app
// advice. Add reviewed translations here rather than machine-translating scripture.
export type ReflectionTheme = "starting" | "returning" | "consistency" | "maintaining";
export interface PrayerPassage {
  id: string;
  text: string;
  reference: string;
  attribution: string;
  url: string;
  themes: readonly ReflectionTheme[];
}
const quranAttribution = "Quran translation excerpt · Dr. Mustafa Khattab, The Clear Quran";
export const PRAYER_PASSAGES: readonly PrayerPassage[] = [
  {id: "quran-2-45", text: "And seek help through patience and prayer.", reference: "Quran 2:45", attribution: quranAttribution,
    url: "https://quran.com/2/45", themes: ["starting", "returning"]},
  {id: "quran-20-14", text: "and establish prayer for My remembrance.", reference: "Quran 20:14", attribution: quranAttribution,
    url: "https://quran.com/20/14", themes: ["starting", "returning", "maintaining"]},
  {id: "muslim-223", text: "and prayer is a light", reference: "Sahih Muslim 223", attribution: "Hadith excerpt · Sahih Muslim · English translation: Sunnah.com",
    url: "https://sunnah.com/muslim:223", themes: ["starting", "returning", "maintaining"]},
  {id: "quran-4-103", text: "Indeed, performing prayers is a duty on the believers at the appointed times.", reference: "Quran 4:103", attribution: quranAttribution,
    url: "https://quran.com/4/103", themes: ["returning", "consistency"]},
  {id: "quran-2-238", text: "Observe the ˹five obligatory˺ prayers—especially the middle prayer—and stand in true devotion to Allah.", reference: "Quran 2:238", attribution: quranAttribution,
    url: "https://quran.com/2/238", themes: ["consistency", "maintaining"]},
  {id: "bukhari-6464", text: "the most beloved deed to Allah is the most regular and constant even if it were little.", reference: "Sahih al-Bukhari 6464", attribution: "Hadith excerpt · Sahih al-Bukhari · English translation: Sunnah.com",
    url: "https://sunnah.com/bukhari:6464", themes: ["consistency", "maintaining"]},
  {id: "quran-29-45", text: "Recite what has been revealed to you of the Book and establish prayer.", reference: "Quran 29:45", attribution: quranAttribution,
    url: "https://quran.com/29/45", themes: ["starting", "consistency"]},
  {id: "quran-17-78", text: "for certainly the dawn prayer is witnessed ˹by angels˺.", reference: "Quran 17:78", attribution: quranAttribution,
    url: "https://quran.com/17/78", themes: ["maintaining"]},
];
