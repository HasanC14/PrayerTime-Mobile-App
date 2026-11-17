// Explanations and practical suggestions are app-authored, not Quran quotations.
// Keep source excerpts unchanged and separate from localized explanations.
import { ADDITIONAL_REFLECTIONS } from "./additionalReflections";
export type ReflectionTheme = "starting" | "returning" | "consistency" | "maintaining";
export interface PrayerReflection {
  id: string;
  title: string;
  explanation: string;
  action: string;
  context: string;
  tone: "encouragement" | "guidance" | "warning";
  themes: readonly ReflectionTheme[];
  exemptionSafe?: boolean;
  focusPrayer?: string;
  source: {
    excerpt: string;
    reference: string;
    attribution: string;
    url: string;
    tafsirUrl: string;
  };
}
function source(verse: string, excerpt: string, tafsirVerse = verse.split("-")[0]): PrayerReflection["source"] {
  return {excerpt, reference: `Quran ${verse}`, attribution: "Dr. Mustafa Khattab, The Clear Quran · English excerpt",
    url: `https://quran.com/${verse.replace(":", "/")}`,
    tafsirUrl: `https://quran.com/${tafsirVerse}/tafsirs/en-tafisr-ibn-kathir`};
}
export const PRAYER_REFLECTIONS: readonly PrayerReflection[] = [
  {
    id: "remember-allah", title: "Remember why you pray",
    explanation: "A busy day can fill your mind with work and worries. Salah gives you a regular time to remember Allah. In the Quran, Allah commands Musa to establish prayer for His remembrance.",
    action: "Before your next salah, pause and remember whom you are standing before.",
    context: "In this passage, Allah speaks to Musa, declares His oneness, and commands worship and prayer. The following ayah reminds him of the coming Hour and accountability.",
    tone: "guidance", themes: ["starting", "returning", "maintaining"],
    source: source("20:14", "and establish prayer for My remembrance.")
  },
  {
    id: "appointed-times", title: "Give salah its time",
    explanation: "It is easy to keep saying, ‘I’ll pray after this.’ But the Quran teaches that salah is an obligation with appointed times. Make room for it while planning your day.",
    action: "Check the next prayer time and decide when you will step away from what you are doing.",
    context: "This ayah follows instructions about prayer during danger. It calls believers to remember Allah and establish regular prayer when secure, and states that prayers have appointed times.",
    tone: "guidance", themes: ["consistency", "maintaining"],
    source: source("4:103", "Indeed, performing prayers is a duty on the believers at the appointed times.")
  },
  {
    id: "prepare-fajr", title: "Prepare for Fajr tonight", focusPrayer: "Fajr",
    explanation: "Getting out of bed for Fajr can be difficult. The Quran gives special attention to the dawn prayer, describing it as witnessed by angels. Prepare for it before the morning arrives.",
    action: "Before sleeping, check Fajr time, set your alarm, and give yourself enough time to get ready.",
    context: "The ayah commands prayer across the day and night and singles out the dawn prayer. Ibn Kathir explains its connection to the angels who attend at dawn.",
    tone: "encouragement", themes: ["consistency", "maintaining"],
    source: source("17:78", "for certainly the dawn prayer is witnessed ˹by angels˺.")
  },
  {
    id: "take-salah-seriously", title: "Take salah seriously",
    explanation: "The Quran describes people in Jahannam acknowledging that they did not pray. The passage also mentions neglecting the poor and denying the Day of Judgment. This is a serious reminder to make salah a priority.",
    action: "Make space for the next salah before your day gets busy.",
    context: "These ayahs describe a conversation about what led people into Saqar, a name for Jahannam. They list several actions and beliefs together. They do not give a verdict about a particular person based on a few missed prayers or journal entries.",
    tone: "warning", themes: ["consistency", "maintaining"],
    source: source("74:42-47", "We were not of those who prayed", "74:43")
  },
  {
    id: "return-to-allah", title: "Return to Allah",
    explanation: "If you have neglected salah, don’t let shame keep you away from it. Allah calls those who have sinned to turn back to Him and not despair of His mercy.",
    action: "Ask Allah for forgiveness and prepare for the next salah.",
    context: "Ayah 53 speaks of Allah’s mercy, and ayah 54 calls people to return to Him and submit to Him. Ibn Kathir explains this as an invitation to sincere repentance, not permission to continue sinning.",
    tone: "encouragement", themes: ["starting", "returning"],
    source: source("39:53-54", "Do not lose hope in Allah’s mercy", "39:53")
  },
  {
    id: "seek-help", title: "Bring your worries to Allah",
    explanation: "When life feels heavy, the Quran directs us to seek help through patience and salah. You can bring your worries to Allah while continuing to take practical steps through your difficulties.",
    action: "Make time for salah, and ask Allah for help with what is weighing on you.",
    context: "The ayah connects seeking help with patience, prayer, and humility. The next ayah describes those who know they will meet their Lord and return to Him. It does not promise that every difficulty will disappear immediately.",
    tone: "encouragement", themes: ["starting", "returning"],
    source: source("2:45", "And seek help through patience and prayer.")
  },
  {
    id: "guard-prayers", title: "Protect all five prayers",
    explanation: "The Quran tells believers to guard their prayers and stand before Allah with devotion. A steady routine needs care, even on days when other things demand your attention.",
    action: "Look ahead at today’s remaining prayers and plan a place and time for each one.",
    context: "This ayah commands care for the prayers, with particular emphasis on the middle prayer. The following ayah addresses prayer in danger and remembrance of Allah when safety returns.",
    tone: "guidance", themes: ["consistency", "maintaining"],
    source: source("2:238", "Observe the ˹five obligatory˺ prayers—especially the middle prayer—and stand in true devotion to Allah.")
  },
  {
    id: "salah-and-character", title: "Carry salah into your day",
    explanation: "The Quran connects salah with turning away from indecency and wrongdoing. Let what you practise in prayer guide the way you speak, work, and treat other people afterwards.",
    action: "Choose one action today that reflects the care and honesty you want to bring to your salah.",
    context: "The ayah brings together reciting revelation, establishing prayer, avoiding wrongdoing, and remembering Allah. It ends by reminding us that Allah knows what we do. Logging a prayer does not measure someone’s character or sincerity.",
    tone: "guidance", themes: ["consistency", "maintaining"],
    source: source("29:45", "Indeed, ˹genuine˺ prayer should deter ˹one˺ from indecency and wickedness.")
  },
  {
    id: "pray-with-attention", title: "Be present in salah",
    explanation: "The Quran describes successful believers as humble in their prayers. Alongside making time for salah, give attention to the prayer itself and to the words you are saying.",
    action: "Put distractions aside before your next salah and take a moment to settle yourself.",
    context: "These are the opening qualities in a longer passage describing believers. Ibn Kathir explains humility in prayer as involving the heart, tranquillity, and attention. A journal cannot measure these inward qualities.",
    tone: "guidance", themes: ["starting", "maintaining"],
    source: source("23:1-2", "those who humble themselves in prayer;", "23:2")
  },
  {
    id: "follow-with-good", title: "Follow a mistake with good",
    explanation: "A mistake should not become a reason to give up doing good. In an ayah about establishing prayer, Allah reminds us that good deeds remove bad deeds. Keep turning back to Him and doing what is right.",
    action: "Ask Allah for forgiveness and choose a good deed you can do today.",
    context: "The ayah commands prayer at times through the day and night, then speaks of good deeds removing bad deeds. This encourages good action; it is not permission to plan wrongdoing or neglect repentance.",
    tone: "encouragement", themes: ["returning", "maintaining"],
    source: source("11:114", "Surely good deeds wipe out evil deeds.")
  },
  {
    id: "neglect-and-return", title: "Don’t let distractions take over",
    explanation: "The Quran warns about people who neglected prayer and followed their desires. The next ayah gives hope to those who repent, believe, and do good. Take both the warning and the invitation to return seriously.",
    action: "Choose one distraction to put aside when the next prayer begins.",
    context: "Read ayahs 59 and 60 together: a warning about neglect is followed by an exception for those who repent, believe, and act rightly. This passage is not a judgment about someone’s unfilled journal.",
    tone: "warning", themes: ["consistency", "maintaining"],
    source: source("19:59-60", "who neglected prayer and followed their lusts", "19:59")
  },
  {
    id: "patience-and-prayer", title: "Keep going with patience",
    explanation: "Building a prayer routine takes care and patience. The Quran calls believers to seek help through patience and salah, and reminds them that Allah is with those who are patient.",
    action: "Prepare for the next salah and ask Allah to help you remain steady.",
    context: "This ayah addresses believers and joins patience with prayer as sources of help. Ibn Kathir discusses patience in facing difficulty alongside gratitude for blessings. The message is broader than a count of completed prayers.",
    tone: "encouragement", themes: ["starting", "returning", "consistency", "maintaining"],
    source: source("2:153", "O believers! Seek comfort in patience and prayer. Allah is truly with those who are patient.")
  },
  ...ADDITIONAL_REFLECTIONS
];
