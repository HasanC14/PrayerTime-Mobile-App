import type { PrayerReflection, ReflectionTheme } from "./prayerReflections";
const c = (en: string, bn: string, ar: string) => ({en, bn, ar});
type Copy = ReturnType<typeof c>;
interface Entry {
  id: string; verse: string; excerpt: string;
  title: Copy; explanation: Copy; action: Copy; context: Copy;
  tone?: PrayerReflection["tone"]; themes?: readonly ReflectionTheme[]; exemptionSafe?: boolean;
}
// App-authored explanations. Translation excerpts retain their source wording.
const entries: Entry[] = [
  {
    id: "quiet-heart", verse: "13:28", excerpt: "Surely in the remembrance of Allah do hearts find comfort.",
    title: c("Give your heart a quiet moment", "মনকে একটু শান্ত সময় দিন", "امنح قلبك لحظة هدوء"),
    explanation: c("When your mind keeps moving from one worry to another, make room to remember Allah. The Quran connects remembrance with comfort for believing hearts.", "এক দুশ্চিন্তা থেকে আরেকটিতে মন ছুটলে আল্লাহকে স্মরণের জন্য সময় রাখুন। কুরআন মুমিনের অন্তরের প্রশান্তির সঙ্গে আল্লাহর স্মরণের সম্পর্ক বলেছে।", "حين ينتقل ذهنك من همّ إلى آخر، اجعل وقتًا لذكر الله. يربط القرآن الذكر بطمأنينة قلوب المؤمنين."),
    action: c("Put your phone aside for a moment and remember Allah.", "কিছুক্ষণ ফোন সরিয়ে রেখে আল্লাহকে স্মরণ করুন।", "ضع هاتفك جانبًا لحظة واذكر الله."),
    context: c("The surrounding passage speaks about turning to Allah, faith, and good deeds. It is not a claim that distress means weak faith.", "আশপাশের আয়াতে আল্লাহর দিকে ফেরা, ঈমান ও সৎকাজের কথা আছে। মানসিক কষ্ট মানেই দুর্বল ঈমান, এমন কথা বলা হয়নি।", "يتناول السياق الرجوع إلى الله والإيمان والعمل الصالح. ولا يعني أن الضيق دليل على ضعف الإيمان."),
    tone: "encouragement"
  },
  {
    id: "notice-blessings", verse: "14:7", excerpt: "If you are grateful, I will certainly give you more.",
    title: c("Notice what you have been given", "যে নিয়ামত পেয়েছেন তা খেয়াল করুন", "انتبه إلى ما أُعطيت"),
    explanation: c("It is easy to notice what is missing and overlook what is already here. Allah calls us to gratitude, with a promise of increase.", "কী নেই তা চোখে পড়ে, কিন্তু যা আছে তা অনেক সময় খেয়াল হয় না। আল্লাহ নিয়ামত বাড়িয়ে দেওয়ার প্রতিশ্রুতির সঙ্গে কৃতজ্ঞ হতে বলেছেন।", "يسهل ملاحظة ما ينقصنا ونسيان ما لدينا. يدعونا الله إلى الشكر مع وعد بالزيادة."),
    action: c("Name one blessing and thank Allah for it.", "একটি নিয়ামতের কথা মনে করে আল্লাহর শুকরিয়া আদায় করুন।", "تذكّر نعمة واحدة واشكر الله عليها."),
    context: c("Musa reminds his people of Allah’s favours. The verse joins gratitude with a warning against ingratitude; it is not a formula for financial gain.", "মুসা তাঁর জাতিকে আল্লাহর অনুগ্রহ স্মরণ করাচ্ছেন। আয়াতে কৃতজ্ঞতার সঙ্গে অকৃতজ্ঞতার সতর্কতা আছে; এটি অর্থ লাভের কোনো সূত্র নয়।", "يذكّر موسى قومه بنعم الله. تجمع الآية بين الشكر والتحذير من الجحود، ولا تقدّم وصفة للربح المالي."),
    tone: "encouragement"
  },
  {
    id: "remember-between-prayers", verse: "2:152", excerpt: "remember Me; I will remember you.",
    title: c("Remember Allah between your tasks", "কাজের ফাঁকেও আল্লাহকে স্মরণ করুন", "اذكر الله بين مشاغلك"),
    explanation: c("Remembrance need not disappear when one task ends and another begins. This ayah invites us to remember Allah and be thankful to Him.", "এক কাজ শেষ করে আরেকটি শুরু করার সময়ও আল্লাহর স্মরণ থাকতে পারে। এই আয়াত আল্লাহকে স্মরণ করতে ও তাঁর প্রতি কৃতজ্ঞ হতে বলে।", "لا يلزم أن يغيب الذكر بين مهمة وأخرى. تدعونا هذه الآية إلى ذكر الله وشكره."),
    action: c("Use one pause in your day for dhikr and gratitude.", "দিনের একটি বিরতি জিকির ও কৃতজ্ঞতায় কাটান।", "اجعل إحدى استراحات يومك للذكر والشكر."),
    context: c("The preceding ayah mentions the Messenger teaching and purifying people. Remembrance and gratitude belong within that wider response to Allah’s guidance.", "আগের আয়াতে রাসুলের শিক্ষা ও আত্মশুদ্ধির কথা আছে। আল্লাহর হেদায়েত গ্রহণের এই বৃহত্তর প্রেক্ষাপটেই স্মরণ ও কৃতজ্ঞতা এসেছে।", "تذكر الآية السابقة تعليم الرسول للناس وتزكيتهم. ويأتي الذكر والشكر ضمن الاستجابة لهداية الله.")
  },
  {
    id: "hardship-and-ease", verse: "94:5-6", excerpt: "So, surely with hardship comes ease.",
    title: c("Difficulty is not the whole story", "কষ্টই পুরো গল্প নয়", "ليست الشدة كل الحكاية"),
    explanation: c("A difficult season can make the future feel closed. These ayahs repeat the reassurance that ease accompanies hardship. Keep taking the next useful step.", "কঠিন সময়ে সামনে কোনো পথ নেই মনে হতে পারে। এই আয়াতগুলো বারবার আশ্বাস দেয় যে কষ্টের সঙ্গে স্বস্তিও আছে। উপকারী পরের পদক্ষেপটি নিতে থাকুন।", "قد تجعلك الأيام الصعبة تشعر أن الأفق مغلق. تكرّر هاتان الآيتان أن مع العسر يسرًا. واصل اتخاذ الخطوة النافعة التالية."),
    action: c("Choose one manageable step and ask Allah for help.", "সাধ্যের মধ্যে একটি পদক্ষেপ বেছে নিয়ে আল্লাহর সাহায্য চান।", "اختر خطوة تستطيعها واسأل الله العون."),
    context: c("Surah Ash-Sharh consoles the Prophet and then calls him to continued effort and turning to his Lord. It does not give a timetable for relief.", "সূরা আশ-শারহ নবীকে সান্ত্বনা দিয়ে পরে চেষ্টা চালানো ও রবের দিকে মনোনিবেশ করতে বলে। স্বস্তি আসার নির্দিষ্ট সময় বলা হয়নি।", "تواسي سورة الشرح النبي، ثم تدعوه إلى مواصلة العمل والتوجّه إلى ربه. ولا تحدّد موعدًا للفرج."),
    tone: "encouragement", themes: ["starting", "returning"]
  },
  {
    id: "ask-for-mercy", verse: "2:286", excerpt: "Pardon us, forgive us, and have mercy on us.",
    title: c("You can ask for help", "সাহায্য চাইতে পারেন", "يمكنك أن تطلب العون"),
    explanation: c("You do not have to hide your limits from Allah. The closing ayah of Al-Baqarah teaches believers to ask for pardon, forgiveness, and mercy.", "নিজের সীমাবদ্ধতা আল্লাহর কাছে লুকাতে হয় না। সূরা আল-বাকারার শেষ আয়াত মুমিনদের ক্ষমা ও রহমত চাইতে শেখায়।", "لا تحتاج إلى إخفاء ضعفك عن الله. تعلّم خاتمة سورة البقرة المؤمنين طلب العفو والمغفرة والرحمة."),
    action: c("Make a sincere dua about what you need help with.", "যে বিষয়ে সাহায্য দরকার তা নিয়ে আন্তরিকভাবে দোয়া করুন।", "ادعُ بصدق فيما تحتاج فيه إلى العون."),
    context: c("The ayah joins responsibility for deeds with a prayer for mercy and help. It does not require people to face hardship without support from others.", "এই আয়াতে কাজের দায়িত্বের সঙ্গে রহমত ও সাহায্যের দোয়া এসেছে। কষ্টের সময় অন্যের সহায়তা ছাড়া একা চলতে বলা হয়নি।", "تجمع الآية بين مسؤولية الأعمال والدعاء بالرحمة والعون. ولا تلزم الإنسان بمواجهة الشدة دون مساندة الآخرين."),
    tone: "encouragement", themes: ["starting", "returning"]
  },
  {
    id: "consult-and-trust", verse: "3:159", excerpt: "Once you make a decision, put your trust in Allah.",
    title: c("Take advice, then move forward", "পরামর্শ নিয়ে এগিয়ে যান", "استشر ثم امضِ"),
    explanation: c("A difficult decision does not have to be made alone. This ayah brings together gentleness, consultation, making a decision, and trust in Allah.", "কঠিন সিদ্ধান্ত একা নিতেই হবে এমন নয়। এই আয়াতে কোমলতা, পরামর্শ, সিদ্ধান্ত নেওয়া ও আল্লাহর ওপর ভরসা একসঙ্গে এসেছে।", "لا يلزم أن تتخذ القرار الصعب وحدك. تجمع هذه الآية بين اللين والمشاورة والعزم والتوكّل على الله."),
    action: c("Seek trustworthy advice about a decision you are facing.", "সামনের কোনো সিদ্ধান্ত নিয়ে বিশ্বস্ত কারও পরামর্শ নিন।", "اطلب مشورة موثوقة في قرار تواجهه."),
    context: c("The Prophet is instructed to pardon, seek forgiveness for others, and consult them. Trust follows responsible action rather than replacing it.", "নবীকে ক্ষমা করতে, অন্যদের জন্য ক্ষমা চাইতে ও পরামর্শ করতে বলা হয়েছে। ভরসা দায়িত্বশীল কাজের পরে আসে, কাজের বিকল্প হিসেবে নয়।", "يُؤمر النبي بالعفو والاستغفار للآخرين ومشاورتهم. يأتي التوكّل بعد الأخذ بالأسباب، لا بدلًا منها.")
  },
  {
    id: "trust-in-uncertainty", verse: "65:2-3", excerpt: "And whoever puts their trust in Allah, then He ˹alone˺ is sufficient for them.",
    title: c("Choose what is right in uncertainty", "অনিশ্চয়তায়ও সঠিক পথ বেছে নিন", "اختر الصواب وسط القلق"),
    explanation: c("Not knowing how things will work out can make a wrong shortcut tempting. These ayahs connect mindfulness of Allah with trust in His provision and care.", "কী হবে জানা না থাকলে ভুল সহজ পথ আকর্ষণীয় মনে হতে পারে। এই আয়াতগুলো আল্লাহ-সচেতনতার সঙ্গে তাঁর রিজিক ও ব্যবস্থার ওপর ভরসার সম্পর্ক বলে।", "قد يدفعك القلق من النتائج إلى اختصار خاطئ. تربط هاتان الآيتان تقوى الله بالتوكّل عليه في الرزق والتدبير."),
    action: c("Choose an honest next step, even if the outcome is uncertain.", "ফল অনিশ্চিত হলেও পরের পদক্ষেপটি সৎভাবে নিন।", "اختر خطوة أمينة ولو بقيت النتيجة غير معلومة."),
    context: c("These words occur within guidance about divorce, fair treatment, and witnesses. Trust in Allah does not cancel duties owed to other people.", "তালাক, ন্যায্য আচরণ ও সাক্ষীর নির্দেশনার মধ্যে এই কথাগুলো এসেছে। আল্লাহর ওপর ভরসা মানুষের প্রতি দায়িত্ব বাতিল করে না।", "ترد هذه الكلمات ضمن أحكام الطلاق والمعاملة بالمعروف والشهادة. ولا يلغي التوكّل حقوق الآخرين."),
    tone: "encouragement"
  },
  {
    id: "make-peace", verse: "49:10", excerpt: "The believers are but one brotherhood, so make peace between your brothers.",
    title: c("Make room for peace", "শান্তির জন্য জায়গা রাখুন", "افسح مجالًا للصلح"),
    explanation: c("An argument can grow when everyone waits for someone else to soften first. The Quran calls believers to work for reconciliation, not keep a quarrel alive.", "সবাই অন্যজন আগে নরম হবে বলে অপেক্ষা করলে ঝগড়া বাড়ে। কুরআন মুমিনদের বিরোধ জিইয়ে না রেখে মীমাংসার চেষ্টা করতে বলে।", "قد يكبر الخلاف حين ينتظر كل طرف أن يلين الآخر أولًا. يدعو القرآن المؤمنين إلى الإصلاح بدل إبقاء الخصام."),
    action: c("Where it is safe, take one respectful step towards resolving a disagreement.", "নিরাপদ হলে কোনো মতভেদ মেটাতে সম্মানজনক একটি পদক্ষেপ নিন।", "حيث يكون ذلك آمنًا، اتخذ خطوة محترمة لحل خلاف."),
    context: c("The preceding ayah addresses conflict and insists on justice in reconciliation. Peace is not a reason to ignore wrongdoing or someone’s safety.", "আগের আয়াতে বিরোধ মেটাতে ন্যায়বিচার বজায় রাখতে বলা হয়েছে। শান্তির জন্য অন্যায় বা কারও নিরাপত্তা উপেক্ষা করতে হয় না।", "تتناول الآية السابقة النزاع وتشترط العدل في الإصلاح. ولا يبرّر الصلح تجاهل الظلم أو سلامة الإنسان.")
  },
  {
    id: "respect-without-ridicule", verse: "49:11", excerpt: "Do not defame one another, nor call each other by offensive nicknames.",
    title: c("Let your humour keep its kindness", "রসিকতাতেও মমতা রাখুন", "اجعل مزاحك رحيمًا"),
    explanation: c("A joke can feel small to the person making it and painful to the person receiving it. The Quran forbids ridicule and insulting names.", "যে রসিকতা করে তার কাছে বিষয়টি ছোট মনে হলেও অন্যজন কষ্ট পেতে পারে। কুরআন বিদ্রূপ ও অপমানজনক নামে ডাকা নিষেধ করেছে।", "قد تبدو المزحة صغيرة لقائلها وتؤلم من يسمعها. ينهى القرآن عن السخرية والألقاب الجارحة."),
    action: c("Leave out a joke or nickname that could humiliate someone.", "কাউকে হেয় করতে পারে এমন রসিকতা বা ডাকনাম এড়িয়ে চলুন।", "اترك مزحة أو لقبًا قد يجرح كرامة أحد."),
    context: c("The ayah reminds people that those they mock may be better than them. It addresses both men and women and calls for repentance from wrongdoing.", "যাদের বিদ্রূপ করা হয় তারা আরও উত্তম হতে পারে বলে আয়াতটি স্মরণ করায়। নারী-পুরুষ উভয়কে সম্বোধন করে অন্যায় থেকে তওবা করতে বলে।", "تذكّر الآية بأن من يُسخر منهم قد يكونون خيرًا من الساخرين. وتخاطب الرجال والنساء وتدعو إلى التوبة.")
  },
  {
    id: "guard-absent-people", verse: "49:12", excerpt: "And do not spy, nor backbite one another.",
    title: c("Protect someone who is not in the room", "অনুপস্থিত মানুষের সম্মান রাখুন", "احفظ كرامة الغائب"),
    explanation: c("A conversation can turn into judging someone who cannot answer for themselves. The Quran warns against unfounded suspicion, spying, and backbiting.", "কথা বলতে বলতে এমন কারও বিচার শুরু হতে পারে, যে নিজের পক্ষে কথা বলতে উপস্থিত নেই। কুরআন অমূলক সন্দেহ, গুপ্তচরবৃত্তি ও গিবত থেকে সতর্ক করে।", "قد يتحوّل الحديث إلى الحكم على شخص لا يستطيع الرد. يحذّر القرآن من الظن بلا أساس والتجسّس والغيبة."),
    action: c("Change the subject when a conversation becomes gossip.", "কথা গিবতের দিকে গেলে প্রসঙ্গ বদলে দিন।", "غيّر الموضوع إذا تحوّل الحديث إلى غيبة."),
    context: c("The ayah uses a severe image to show the ugliness of backbiting, then reminds readers that Allah accepts repentance and is merciful.", "গিবতের কদর্যতা বোঝাতে আয়াতে কঠোর উপমা এসেছে। শেষে আল্লাহর তওবা গ্রহণ ও রহমতের কথা স্মরণ করানো হয়েছে।", "تستخدم الآية صورة شديدة لبيان قبح الغيبة، ثم تذكّر بأن الله توّاب رحيم.")
  },
  {
    id: "verify-before-sharing", verse: "49:6", excerpt: "so you do not harm people unknowingly",
    title: c("Pause before you forward it", "শেয়ার করার আগে একটু থামুন", "توقّف قبل إعادة الإرسال"),
    explanation: c("A message can travel faster than the truth behind it. The Quran teaches believers to verify news so that acting without knowledge does not harm others.", "সত্য যাচাই হওয়ার আগেই একটি বার্তা ছড়িয়ে পড়তে পারে। না জেনে কাজ করে অন্যের ক্ষতি এড়াতে কুরআন খবর যাচাই করতে শেখায়।", "قد تنتشر الرسالة أسرع من التحقّق من حقيقتها. يعلّم القرآن المؤمنين التثبّت من الأخبار كي لا يضرّوا غيرهم بجهالة."),
    action: c("Check a reliable source before sharing a worrying claim.", "উদ্বেগজনক কোনো দাবি শেয়ার করার আগে নির্ভরযোগ্য উৎস দেখুন।", "تحقّق من مصدر موثوق قبل نشر ادّعاء مقلق."),
    context: c("The verse concerns news brought by an unreliable wrongdoer and the harm of a hasty response. Verification is a responsibility, not an excuse for rumour.", "অবিশ্বস্ত পাপাচারীর আনা খবর ও তাড়াহুড়োর ক্ষতি নিয়ে আয়াতটি এসেছে। যাচাই করা দায়িত্ব, গুজব ছড়ানোর অজুহাত নয়।", "تتناول الآية خبر الفاسق وضرر التسرّع في التعامل معه. والتثبّت مسؤولية لا عذر لنشر الشائعات.")
  },
  {
    id: "choose-better-words", verse: "17:53", excerpt: "Tell My ˹believing˺ servants to say only what is best.",
    title: c("Choose the better words", "আরও ভালোভাবে কথাটি বলুন", "اختر أحسن الكلام"),
    explanation: c("You may need to say something difficult without making it hurtful. The Quran calls Allah’s servants to choose the best speech, mindful of how conflict grows.", "কঠিন কথা বলার দরকার হলেও আঘাত করে বলতে হয় না। বিরোধ কীভাবে বাড়ে তা স্মরণ করিয়ে কুরআন উত্তম কথা বলতে বলে।", "قد تحتاج إلى قول أمر صعب دون إيذاء. يدعو القرآن عباد الله إلى أحسن الكلام مع الانتباه إلى ما يزرع الخلاف."),
    action: c("Reread a difficult message and remove needless harshness before sending it.", "কঠিন কোনো বার্তা পাঠানোর আগে পড়ে অপ্রয়োজনীয় কঠোরতা বাদ দিন।", "راجع رسالة صعبة واحذف القسوة غير اللازمة قبل إرسالها."),
    context: c("The ayah links good speech with resisting the discord stirred by Shaytan. Speaking well still leaves room for honest disagreement.", "উত্তম কথার সঙ্গে শয়তানের তৈরি বিভেদ প্রতিরোধের সম্পর্ক বলা হয়েছে। ভালোভাবে কথা বলেও সৎ মতভেদ জানানো যায়।", "تربط الآية حسن القول بمقاومة نزغ الشيطان. ولا يمنع حسن الكلام الاختلاف الصادق.")
  },
  {
    id: "care-for-parents", verse: "17:23-24", excerpt: "And be humble with them out of mercy",
    title: c("Bring gentleness home", "ঘরে কোমল আচরণ করুন", "اجعل للرفق مكانًا في بيتك"),
    explanation: c("Patience can be hardest with the people closest to us. The Quran calls for kindness and respectful speech towards parents, especially as they grow older.", "কাছের মানুষের সঙ্গে ধৈর্য রাখা কখনও সবচেয়ে কঠিন হয়। কুরআন বাবা-মায়ের সঙ্গে দয়া ও সম্মানের কথা বলে, বিশেষত তাঁরা বৃদ্ধ হলে।", "قد يكون الصبر أصعب مع أقرب الناس إلينا. يدعو القرآن إلى الإحسان للوالدين والكلام الكريم معهما، خاصة عند الكبر."),
    action: c("Offer your parents a kind word, practical help, or a dua.", "বাবা-মাকে সুন্দর কথা বলুন, কাজে সাহায্য করুন বা তাঁদের জন্য দোয়া করুন।", "قدّم لوالديك كلمة طيبة أو عونًا عمليًا أو دعاء."),
    context: c("These ayahs join worship of Allah with care for parents and a prayer for their mercy. They do not require someone to remain in an unsafe situation.", "এই আয়াতে আল্লাহর ইবাদতের সঙ্গে বাবা-মায়ের যত্ন ও তাঁদের জন্য রহমতের দোয়া এসেছে। অনিরাপদ অবস্থায় থেকে যেতে বলা হয়নি।", "تجمع الآيتان عبادة الله مع رعاية الوالدين والدعاء لهما بالرحمة. ولا تُلزمان بالبقاء في وضع غير آمن.")
  },
  {
    id: "notice-neighbours", verse: "4:36", excerpt: "near and distant neighbours",
    title: c("Notice the people nearby", "আশপাশের মানুষের খোঁজ নিন", "انتبه لمن حولك"),
    explanation: c("Kindness belongs in ordinary encounters as well as big acts of charity. The Quran names neighbours, relatives, people in need, and travellers among those we should treat well.", "বড় দানের পাশাপাশি প্রতিদিনের আচরণেও দয়া থাকা দরকার। কুরআন প্রতিবেশী, আত্মীয়, অভাবী ও মুসাফিরের সঙ্গে ভালো আচরণ করতে বলে।", "للإحسان مكان في اللقاءات اليومية كما في الصدقات الكبيرة. يذكر القرآن الجيران والأقارب والمحتاجين والمسافرين ضمن من نحسن إليهم."),
    action: c("Offer a neighbour or someone nearby one useful kindness.", "প্রতিবেশী বা কাছের কাউকে কাজে লাগে এমন একটি সহায়তা করুন।", "قدّم لجار أو لشخص قريب إحسانًا نافعًا."),
    context: c("The ayah begins with worshipping Allah alone, then names duties towards others and warns against arrogance. Worship and everyday conduct appear together.", "আয়াতের শুরুতে এক আল্লাহর ইবাদত, পরে মানুষের প্রতি দায়িত্ব ও অহংকারের সতর্কতা এসেছে। ইবাদত ও দৈনন্দিন আচরণ একসঙ্গে আছে।", "تبدأ الآية بعبادة الله وحده، ثم تذكر حقوق الآخرين وتحذّر من الكبر. فتجمع العبادة والسلوك اليومي.")
  },
  {
    id: "hold-your-anger", verse: "3:134", excerpt: "control their anger, and pardon others.",
    title: c("Leave a pause before your response", "উত্তর দেওয়ার আগে একটু থামুন", "اترك لحظة قبل الرد"),
    explanation: c("Feeling angry and acting on anger are different things. The Quran praises those who restrain anger and pardon others, even when restraint takes effort.", "রাগ অনুভব করা আর রাগের বশে কাজ করা এক নয়। চেষ্টা লাগলেও যারা রাগ সংবরণ করে ও ক্ষমা করে, কুরআন তাদের প্রশংসা করে।", "الشعور بالغضب والتصرّف بسببه أمران مختلفان. يمدح القرآن من يكظمون الغيظ ويعفون، ولو احتاج ذلك إلى جهد."),
    action: c("Pause before replying when you feel anger rising.", "রাগ বাড়তে থাকলে উত্তর দেওয়ার আগে একটু বিরতি নিন।", "توقّف قبل الرد حين تشعر بتصاعد الغضب."),
    context: c("This quality appears alongside generosity in ease and hardship. Restraint does not mean denying harm or abandoning a rightful boundary.", "স্বচ্ছলতা ও কষ্টে দানের সঙ্গে এই গুণটির কথা এসেছে। সংযম মানে ক্ষতি অস্বীকার বা ন্যায্য সীমা ছেড়ে দেওয়া নয়।", "تأتي هذه الصفة مع الإنفاق في السرّاء والضرّاء. ولا يعني ضبط النفس إنكار الأذى أو ترك الحدود المشروعة.")
  },
  {
    id: "make-room-for-forgiveness", verse: "24:22", excerpt: "Let them pardon and forgive. Do you not love to be forgiven by Allah?",
    title: c("Consider the door to forgiveness", "ক্ষমার সুযোগটি ভাবুন", "تأمّل باب العفو"),
    explanation: c("Being hurt can make generosity feel impossible. This ayah calls people to pardon while remembering their own need for Allah’s forgiveness.", "কষ্ট পেলে উদার থাকা অসম্ভব মনে হতে পারে। নিজেরও আল্লাহর ক্ষমা দরকার, তা স্মরণ করিয়ে এই আয়াত ক্ষমা করতে বলে।", "قد يجعل الأذى الإحسان صعبًا. تدعو هذه الآية إلى العفو مع تذكّر حاجتنا نحن إلى مغفرة الله."),
    action: c("Ask Allah to help you respond without revenge or cruelty.", "প্রতিশোধ বা নিষ্ঠুরতা ছাড়া সাড়া দিতে আল্লাহর সাহায্য চান।", "اسأل الله أن يعينك على الرد دون انتقام أو قسوة."),
    context: c("The passage concerns withholding support after wrongdoing. It encourages pardon; forgiveness does not require ignoring safety or restoring trust without reason.", "অন্যায়ের পরে সহায়তা বন্ধ করা নিয়ে এই অংশ এসেছে। ক্ষমা করতে উৎসাহ দেয়; নিরাপত্তা উপেক্ষা বা কারণ ছাড়া আস্থা ফেরাতে বলে না।", "يتناول السياق قطع العون بعد إساءة. ويحثّ على العفو، دون اشتراط تجاهل السلامة أو استعادة الثقة بلا سبب."),
    tone: "encouragement"
  },
  {
    id: "truth-over-favouritism", verse: "4:135", excerpt: "Stand firm for justice as witnesses for Allah even if it is against yourselves",
    title: c("Choose fairness over taking sides", "পক্ষ নেওয়ার আগে ন্যায় বেছে নিন", "اختر العدل قبل الانحياز"),
    explanation: c("It can be uncomfortable to admit that someone close to us is wrong. The Quran asks believers to uphold justice even when the truth is against themselves or their family.", "কাছের কেউ ভুল করেছে মানতে অস্বস্তি হতে পারে। সত্য নিজের বা পরিবারের বিপক্ষে গেলেও কুরআন মুমিনদের ন্যায় বজায় রাখতে বলে।", "قد يصعب الاعتراف بخطأ شخص قريب. يطلب القرآن من المؤمنين إقامة العدل ولو كانت الحقيقة على أنفسهم أو أقاربهم."),
    action: c("Check whether loyalty is affecting a judgment you are making.", "কারও প্রতি টান আপনার বিচারকে প্রভাবিত করছে কি না ভাবুন।", "راجع إن كان الولاء يؤثّر في حكم تصدره."),
    context: c("The ayah rejects bias for relatives, the rich, or the poor, and warns against distorted testimony. Justice is owed beyond personal preference.", "আয়াতটি আত্মীয়, ধনী বা দরিদ্রের পক্ষে পক্ষপাত ও বিকৃত সাক্ষ্য থেকে সতর্ক করে। পছন্দের বাইরেও ন্যায়ের দায়িত্ব থাকে।", "ترفض الآية المحاباة للأقارب أو الغني أو الفقير وتحذّر من تحريف الشهادة. فالعدل واجب يتجاوز الميل الشخصي.")
  },
  {
    id: "fair-with-disagreement", verse: "5:8", excerpt: "Do not let the hatred of a people lead you to injustice.",
    title: c("Disagree without becoming unfair", "মতভেদেও অন্যায় করবেন না", "اختلف دون أن تظلم"),
    explanation: c("Disliking someone does not remove their rights. The Quran commands fairness even towards people we strongly disagree with.", "কাউকে অপছন্দ করলে তার অধিকার চলে যায় না। কঠোর মতভেদ থাকলেও কুরআন ন্যায্য আচরণ করতে বলে।", "لا يُسقط كره شخص حقوقه. يأمر القرآن بالعدل حتى مع من نخالفهم بشدة."),
    action: c("Describe an opposing view honestly before responding to it.", "বিরোধী মতের উত্তর দেওয়ার আগে সেটি সৎভাবে তুলে ধরুন।", "اعرض الرأي المخالف بأمانة قبل الرد عليه."),
    context: c("The verse joins truthful testimony, justice, and mindfulness of Allah. Strong feelings are not an exemption from fair conduct.", "আয়াতে সত্য সাক্ষ্য, ন্যায় ও আল্লাহ-সচেতনতা একসঙ্গে এসেছে। তীব্র অনুভূতি ন্যায্য আচরণের দায়িত্ব থেকে অব্যাহতি দেয় না।", "تجمع الآية الشهادة الصادقة والعدل والتقوى. ولا تعفي المشاعر القوية من الإنصاف.")
  },
  {
    id: "honour-trusts", verse: "4:58", excerpt: "Indeed, Allah commands you to return trusts to their rightful owners",
    title: c("Look after what was entrusted to you", "আপনার কাছে রাখা আমানতের যত্ন নিন", "احفظ ما اؤتمنت عليه"),
    explanation: c("Someone else’s property or responsibility is not ours to treat carelessly. The Quran commands returning trusts to their owners and judging fairly.", "অন্যের জিনিস বা দায়িত্ব অবহেলায় নেওয়ার বিষয় নয়। কুরআন আমানত তার হকদারের কাছে ফিরিয়ে দিতে ও ন্যায্য বিচার করতে বলে।", "ليست ممتلكات الآخرين أو المسؤوليات أشياء نتهاون بها. يأمر القرآن بردّ الأمانات إلى أهلها والحكم بالعدل."),
    action: c("Return something borrowed or fulfil a responsibility you have delayed.", "ধার নেওয়া কিছু ফিরিয়ে দিন বা পিছিয়ে রাখা দায়িত্ব পালন করুন।", "أعِد شيئًا استعرته أو أدِّ مسؤولية أخّرتها."),
    context: c("The ayah addresses both trusts and justice between people. Faithfulness includes ordinary obligations, not only visible acts of worship.", "আয়াতটি আমানত ও মানুষের মধ্যে ন্যায়বিচার নিয়ে। বিশ্বস্ততার মধ্যে দৈনন্দিন দায়িত্বও আছে, শুধু প্রকাশ্য ইবাদত নয়।", "تتناول الآية الأمانات والعدل بين الناس. وتشمل الأمانة الواجبات اليومية، لا العبادات الظاهرة وحدها.")
  },
  {
    id: "keep-promises", verse: "17:34", excerpt: "Honour ˹your˺ pledges, for you will surely be accountable for them.",
    title: c("Give your promises some care", "কথা রাখার যত্ন নিন", "اعتنِ بوعودك"),
    explanation: c("A promise can be easy to make and easy to forget. The Quran reminds us that commitments carry accountability.", "কথা দেওয়া সহজ, ভুলে যাওয়াও সহজ হতে পারে। কুরআন মনে করিয়ে দেয় যে অঙ্গীকারের জন্য জবাবদিহি আছে।", "قد يسهل الوعد ثم يسهل نسيانه. يذكّرنا القرآن بأن العهود مسؤولية سنُسأل عنها."),
    action: c("Follow up on one commitment, or honestly explain a delay.", "একটি অঙ্গীকার পূরণ করুন, অথবা দেরির কথা সৎভাবে জানান।", "تابع التزامًا قطعته أو بيّن تأخّرك بصدق."),
    context: c("The same ayah protects an orphan’s property and calls for keeping pledges. Both concern respecting obligations rather than taking advantage of others.", "একই আয়াতে এতিমের সম্পদের সুরক্ষা ও অঙ্গীকার রক্ষার কথা আছে। দুটিই অন্যের সুযোগ না নিয়ে দায়িত্ব মানার বিষয়।", "تحمي الآية نفسها مال اليتيم وتدعو إلى الوفاء بالعهد. وكلاهما احترام للحقوق بدل استغلال الآخرين.")
  },
  {
    id: "honest-dealings", verse: "17:35", excerpt: "Give in full when you measure, and weigh with an even balance.",
    title: c("Be honest in the small details", "ছোট বিষয়েও সৎ থাকুন", "كن أمينًا في التفاصيل الصغيرة"),
    explanation: c("Fairness is tested in details that another person may not notice. The Quran commands full measure and an honest balance.", "অন্যজন হয়তো খেয়াল করবে না, এমন বিষয়েও ন্যায়ের পরীক্ষা হয়। কুরআন পুরো মাপ ও সঠিক দাঁড়িপাল্লার নির্দেশ দেয়।", "يُختبر العدل في تفاصيل قد لا يلاحظها الطرف الآخر. يأمر القرآن بإيفاء الكيل والوزن بالقسطاس المستقيم."),
    action: c("Give someone the full amount, time, or work you agreed to provide.", "কথা অনুযায়ী পুরো পরিমাণ, সময় বা কাজটি দিন।", "أعطِ غيرك المقدار أو الوقت أو العمل كاملًا كما اتفقتما."),
    context: c("The direct instruction concerns measuring and weighing. Applying its lesson to everyday dealings is the app’s practical suggestion, not a new quotation.", "সরাসরি নির্দেশটি মাপ ও ওজন নিয়ে। দৈনন্দিন লেনদেনে এর শিক্ষা প্রয়োগ অ্যাপের পরামর্শ, নতুন কোনো উদ্ধৃতি নয়।", "يتعلّق الأمر المباشر بالكيل والوزن. وتطبيق درسه على المعاملات اليومية اقتراح من التطبيق وليس اقتباسًا جديدًا.")
  },
  {
    id: "admit-uncertainty", verse: "17:36", excerpt: "Do not follow what you have no ˹sure˺ knowledge of.",
    title: c("It is okay to say ‘I don’t know’", "‘আমি জানি না’ বলতে পারেন", "لا بأس أن تقول: لا أعلم"),
    explanation: c("Confidence is not a substitute for knowledge. The Quran tells us not to follow what we do not know and reminds us of responsibility for our faculties.", "আত্মবিশ্বাস জ্ঞানের বিকল্প নয়। কুরআন না জানা বিষয়ের অনুসরণ না করতে বলে এবং আমাদের ইন্দ্রিয় ও বোধের দায়িত্ব মনে করায়।", "الثقة ليست بديلًا عن العلم. ينهانا القرآن عن اتّباع ما لا نعلم ويذكّرنا بمسؤولية السمع والبصر والفؤاد."),
    action: c("Look up an answer before presenting an assumption as a fact.", "অনুমানকে সত্য হিসেবে বলার আগে উত্তরটি যাচাই করুন।", "ابحث عن الجواب قبل عرض الظن على أنه حقيقة."),
    context: c("This ayah appears among instructions about responsible conduct. Hearing, sight, and intellect are all connected to accountability.", "দায়িত্বশীল আচরণের নির্দেশনার মধ্যে এই আয়াত এসেছে। শ্রবণ, দৃষ্টি ও বোধকে জবাবদিহির সঙ্গে যুক্ত করা হয়েছে।", "ترد الآية ضمن أوامر السلوك المسؤول. وتربط السمع والبصر والفؤاد بالحساب.")
  },
  {
    id: "everyday-humility", verse: "31:18-19", excerpt: "Surely Allah does not like whoever is arrogant, boastful.",
    title: c("Let confidence stay humble", "আত্মবিশ্বাসেও বিনয় রাখুন", "لتبقَ ثقتك متواضعة"),
    explanation: c("You can value your abilities without looking down on someone else. Luqman’s advice includes humility in how we carry ourselves and speak.", "অন্যকে ছোট না করেও নিজের যোগ্যতার মূল্য দিতে পারেন। লুকমানের উপদেশে চলাফেরা ও কথায় বিনয় রাখার কথা আছে।", "يمكنك تقدير قدراتك دون احتقار غيرك. تشمل وصايا لقمان التواضع في المشي والكلام."),
    action: c("Listen fully to someone without trying to prove you know more.", "বেশি জানেন তা প্রমাণের চেষ্টা না করে কারও কথা পুরো শুনুন।", "أنصت لشخص دون محاولة إثبات أنك تعرف أكثر."),
    context: c("These ayahs form part of Luqman’s counsel to his son. They address arrogance, moderation in walking, and lowering the voice.", "লুকমানের ছেলেকে দেওয়া উপদেশের অংশ এই আয়াতগুলো। অহংকার, চলার সংযম ও কণ্ঠ নিচু রাখার কথা বলা হয়েছে।", "هاتان الآيتان من وصايا لقمان لابنه، وتتناولان الكبر والاعتدال في المشي وخفض الصوت.")
  },
  {
    id: "avoid-waste", verse: "7:31", excerpt: "Eat and drink, but do not waste.",
    title: c("Enjoy a blessing without wasting it", "অপচয় না করে নিয়ামত উপভোগ করুন", "استمتع بالنعمة دون إسراف"),
    explanation: c("Gratitude can show in what we choose not to waste. The Quran permits eating and drinking while calling us away from excess.", "কী অপচয় করছি না, তার মধ্যেও কৃতজ্ঞতা প্রকাশ পায়। কুরআন খাওয়া-দাওয়ার অনুমতির সঙ্গে বাড়াবাড়ি এড়াতে বলে।", "قد يظهر الشكر فيما نمتنع عن إهداره. يبيح القرآن الأكل والشرب ويدعو إلى ترك الإسراف."),
    action: c("Take only what you need at your next meal.", "পরের বেলায় প্রয়োজনমতো খাবার নিন।", "خذ من طعامك القادم قدر حاجتك."),
    context: c("The ayah also instructs proper dress at worship. Its message joins enjoying Allah’s provision with avoiding wastefulness.", "এই আয়াতে ইবাদতের সময় উপযুক্ত পোশাকের নির্দেশও আছে। আল্লাহর রিজিক উপভোগের সঙ্গে অপচয় বর্জনের শিক্ষা যুক্ত।", "تأمر الآية أيضًا بالزينة عند العبادة. وتجمع الانتفاع برزق الله وترك الإسراف.")
  },
  {
    id: "generosity-grows", verse: "2:261", excerpt: "And Allah multiplies ˹the reward even more˺ to whoever He wills.",
    title: c("Let a little generosity begin", "অল্প দিয়েই উদারতা শুরু করুন", "ابدأ بشيء من العطاء"),
    explanation: c("An amount that feels small can still be given sincerely. The Quran compares spending for Allah’s cause to a seed that grows many grains.", "অল্প মনে হলেও আন্তরিকভাবে দান করা যায়। আল্লাহর পথে ব্যয়কে কুরআন এমন বীজের সঙ্গে তুলনা করে, যা অনেক শস্য ফলায়।", "يمكن أن تعطي مبلغًا صغيرًا بإخلاص. يشبّه القرآن الإنفاق في سبيل الله بحبة تنبت حبوبًا كثيرة."),
    action: c("Give a manageable amount to a trustworthy cause.", "বিশ্বস্ত কোনো ভালো কাজে সাধ্যের মধ্যে দান করুন।", "قدّم مبلغًا تستطيع تحمّله لجهة موثوقة."),
    context: c("The passage concerns reward for spending in Allah’s cause. Its multiplication is not a guarantee of a particular worldly financial return.", "আল্লাহর পথে ব্যয়ের সওয়াব নিয়ে এই অংশ। বহুগুণের উদাহরণ দুনিয়ায় নির্দিষ্ট আর্থিক লাভের নিশ্চয়তা নয়।", "يتناول المقطع ثواب الإنفاق في سبيل الله. ولا يضمن هذا التضعيف عائدًا ماليًا دنيويًا محددًا."),
    tone: "encouragement"
  },
  {
    id: "quiet-generosity", verse: "2:271", excerpt: "To give charity publicly is good",
    title: c("Some good can stay between you and Allah", "কিছু ভালো কাজ নীরবেই থাকুক", "ليكن بعض الخير بينك وبين الله"),
    explanation: c("A good deed does not need an audience to matter. The Quran praises charity and gives special encouragement to giving privately to people in need.", "ভালো কাজ মূল্যবান হতে দর্শক লাগে না। কুরআন দানের প্রশংসার সঙ্গে অভাবীদের গোপনে দিতে বিশেষ উৎসাহ দেয়।", "لا يحتاج العمل الصالح إلى جمهور ليكون له قدر. يثني القرآن على الصدقة ويشجّع خصوصًا على إخفائها عند إعطائها للفقراء."),
    action: c("Help someone without announcing their need or your gift.", "কারও অভাব বা নিজের দান প্রকাশ না করে সাহায্য করুন।", "ساعد شخصًا دون إعلان حاجته أو عطيتك."),
    context: c("The verse recognises good in public charity too. It does not mean every public act of giving is insincere.", "আয়াতে প্রকাশ্য দানকেও ভালো বলা হয়েছে। সব প্রকাশ্য দান অসৎ উদ্দেশ্যে হয়, এমন অর্থ নয়।", "تقرّ الآية أيضًا بخير الصدقة المعلنة. ولا تعني أن كل عطاء علني يفتقر إلى الإخلاص."),
    tone: "encouragement"
  },
  {
    id: "dignity-in-giving", verse: "2:263", excerpt: "Kind words and forgiveness are better than charity followed by injury.",
    title: c("Protect dignity when you help", "সাহায্যের সময় মর্যাদা রাখুন", "احفظ الكرامة حين تساعد"),
    explanation: c("Helping someone should not leave them feeling small. The Quran places kind speech and forgiveness above charity that is followed by hurt.", "সাহায্যের পরে কেউ যেন নিজেকে ছোট মনে না করে। কষ্ট দেওয়া দানের চেয়ে কুরআন সুন্দর কথা ও ক্ষমাকে উত্তম বলেছে।", "لا ينبغي أن تترك المساعدة صاحبها مهانًا. يجعل القرآن القول المعروف والمغفرة خيرًا من صدقة يتبعها أذى."),
    action: c("Offer help without reminding someone what they owe you.", "আপনার কাছে কী ঋণী তা মনে না করিয়ে সাহায্য করুন।", "قدّم العون دون تذكير الآخر بفضلك عليه."),
    context: c("The surrounding verses warn against spoiling charity through reminders and harm. The way a gift is given matters alongside the gift itself.", "আশপাশের আয়াত দানের খোঁটা ও কষ্ট দিয়ে তা নষ্ট করার বিরুদ্ধে সতর্ক করে। দানের মতো দেওয়ার ধরনও গুরুত্বপূর্ণ।", "يحذّر السياق من إفساد الصدقة بالمنّ والأذى. وتهمّ طريقة العطاء كما يهمّ العطاء نفسه.")
  },
  {
    id: "give-with-care", verse: "2:267", excerpt: "Do not pick out worthless things for donation",
    title: c("Give something you would accept", "নিজে নিতে চাইবেন এমন কিছু দিন", "أعطِ مما ترضى أن تأخذه"),
    explanation: c("Giving is more thoughtful when we consider the person receiving it. The Quran tells believers not to choose poor-quality things they would dislike receiving themselves.", "গ্রহীতার কথা ভাবলে দান আরও যত্নের হয়। নিজে পেতে অপছন্দ করবেন এমন খারাপ জিনিস বেছে না দিতে কুরআন বলে।", "يكون العطاء أعمق حين نراعي من يتلقّاه. ينهى القرآن عن اختيار الرديء الذي لا نرضى بأخذه لأنفسنا."),
    action: c("Check the usefulness and condition of something before donating it.", "দান করার আগে জিনিসটি উপযোগী ও ভালো অবস্থায় আছে কি না দেখুন।", "تحقّق من نفع الشيء وحالته قبل التبرّع به."),
    context: c("This instruction concerns giving from good earnings and produce. The ayah reminds readers that Allah is free of need and worthy of praise.", "ভালো উপার্জন ও উৎপাদন থেকে দান করার নির্দেশ এটি। শেষে আল্লাহর অমুখাপেক্ষিতা ও প্রশংসার যোগ্যতার কথা আছে।", "يتعلّق الأمر بالإنفاق من طيّب الكسب والثمرات. وتذكّر الآية بأن الله غني حميد.")
  },
  {
    id: "share-what-you-value", verse: "3:92", excerpt: "You will never achieve righteousness until you donate some of what you cherish.",
    title: c("Share something you value", "প্রিয় কিছুও ভাগ করে দিন", "أنفق مما تحب"),
    explanation: c("Generosity can ask more of us than clearing out what we no longer want. The Quran invites giving from what we love, with Allah knowing whatever we spend.", "অপ্রয়োজনীয় জিনিস সরানোর বাইরেও উদারতার দাবি আছে। আল্লাহ সব ব্যয় জানেন, তা স্মরণ করিয়ে কুরআন প্রিয় জিনিস থেকে দিতে বলে।", "قد يطلب الكرم أكثر من التخلّص مما لم نعد نريده. يدعو القرآن إلى الإنفاق مما نحب، والله يعلم ما ننفق."),
    action: c("Choose something worthwhile to share within your means.", "সাধ্যের মধ্যে মূল্যবান কিছু ভাগ করে দিন।", "اختر شيئًا ذا قيمة لتشاركه في حدود استطاعتك."),
    context: c("The ayah links righteousness with giving from cherished possessions. It does not tell someone to disregard dependants or give beyond their means.", "প্রিয় সম্পদ থেকে দেওয়ার সঙ্গে নেকির সম্পর্ক বলা হয়েছে। নির্ভরশীলদের অবহেলা বা সাধ্যের বাইরে দান করতে বলা হয়নি।", "تربط الآية البرّ بالإنفاق من المحبوب. ولا تدعو إلى إهمال من نعول أو الإنفاق فوق الاستطاعة.")
  },
  {
    id: "respond-with-better", verse: "41:34", excerpt: "Respond ˹to evil˺ with what is best",
    title: c("You can choose a better response", "আরও ভালোভাবে সাড়া দিতে পারেন", "يمكنك اختيار ردّ أفضل"),
    explanation: c("Someone else’s harshness does not have to decide your behaviour. The Quran calls us to respond with what is better, rather than simply returning the same harm.", "অন্যের কঠোরতা আপনার আচরণ ঠিক করে দিতে হবে না। একই ক্ষতি ফিরিয়ে না দিয়ে আরও উত্তমভাবে সাড়া দিতে কুরআন বলে।", "لا يجب أن تحدّد قسوة غيرك سلوكك. يدعونا القرآن إلى الدفع بالتي هي أحسن بدل إعادة الأذى نفسه."),
    action: c("Choose a calm, firm reply instead of an insult.", "অপমানের বদলে শান্ত ও দৃঢ় উত্তর বেছে নিন।", "اختر ردًا هادئًا وحازمًا بدل الإهانة."),
    context: c("The next ayah speaks of the patience this requires. Responding well does not mean remaining exposed to abuse or giving up protection.", "পরের আয়াতে এর জন্য ধৈর্যের প্রয়োজনের কথা আছে। ভালো সাড়া মানে নির্যাতনের মধ্যে থাকা বা সুরক্ষা ছেড়ে দেওয়া নয়।", "تذكر الآية التالية ما يتطلّبه ذلك من صبر. ولا يعني حسن الرد البقاء عرضة للإيذاء أو ترك الحماية.")
  },
  {
    id: "small-deeds-matter", verse: "99:7-8", excerpt: "So whoever does an atom’s weight of good will see it.",
    title: c("Do not dismiss a small good deed", "ছোট ভালো কাজকে তুচ্ছ ভাববেন না", "لا تحتقر خيرًا صغيرًا"),
    explanation: c("A helpful act can seem too small to count. The Quran reminds us that even the smallest good and evil deeds will be seen.", "উপকারী একটি কাজ খুব ছোট বলে গুরুত্বহীন মনে হতে পারে। কুরআন মনে করায়, অতি ছোট ভালো-মন্দ কাজও সামনে আসবে।", "قد يبدو المعروف صغيرًا جدًا فلا نهتم به. يذكّرنا القرآن بأن أصغر أعمال الخير والشر ستُرى."),
    action: c("Do one useful kindness today, even if nobody notices.", "কেউ খেয়াল না করলেও আজ উপকারী একটি ভালো কাজ করুন।", "افعل اليوم معروفًا نافعًا ولو لم يلاحظه أحد."),
    context: c("The surah describes the earth bearing witness and people seeing their deeds. The following ayah mentions small evil deeds as well as good ones.", "সূরায় পৃথিবীর সাক্ষ্য ও মানুষের কাজ দেখার কথা আছে। পরের আয়াতে ভালো কাজের পাশাপাশি ছোট মন্দ কাজও উল্লেখ করা হয়েছে।", "تصف السورة شهادة الأرض ورؤية الناس لأعمالهم. وتذكر الآية التالية صغار السيئات كما ذُكرت الحسنات."),
    tone: "encouragement"
  },
  {
    id: "look-at-your-day", verse: "59:18", excerpt: "let every soul look to what ˹deeds˺ it has sent forth for tomorrow.",
    title: c("Look back with honesty", "সততার সঙ্গে ফিরে দেখুন", "راجع يومك بصدق"),
    explanation: c("Reflection is useful when it helps us notice a choice we can change. The Quran asks each soul to consider what it has prepared for what lies ahead.", "বদলাতে পারি এমন সিদ্ধান্ত চোখে পড়লে ফিরে দেখা কাজে লাগে। সামনে কী প্রস্তুত করেছি, প্রতিটি মানুষকে তা ভাবতে কুরআন বলে।", "تنفع المراجعة حين تساعدنا على ملاحظة اختيار يمكن تغييره. يطلب القرآن من كل نفس النظر فيما قدّمته لما هو آتٍ."),
    action: c("Notice one good choice to continue and one mistake to correct.", "চালিয়ে যাবেন এমন একটি ভালো সিদ্ধান্ত ও শুধরাবেন এমন একটি ভুল খেয়াল করুন।", "حدّد اختيارًا صالحًا تواصله وخطأً تصلحه."),
    context: c("The reference to tomorrow concerns the Hereafter, not just the next calendar day. A journal can support reflection but cannot assess someone’s final standing.", "এখানে আগামী বলতে শুধু পরের দিন নয়, আখিরাত বোঝানো হয়েছে। দিনলিপি ভাবতে সাহায্য করতে পারে, চূড়ান্ত পরিণতি বিচার করতে পারে না।", "المقصود بالغد الآخرة، لا اليوم التالي فحسب. قد يعين السجل على التأمّل لكنه لا يحكم على المصير.")
  },
  {
    id: "beyond-comparison", verse: "57:20", excerpt: "mutual boasting, and competition in wealth and children.",
    title: c("Look beyond what people display", "মানুষের প্রদর্শনের বাইরেও দেখুন", "انظر أبعد مما يعرضه الناس"),
    explanation: c("Comparing possessions and achievements can quietly take over a day. The Quran warns about worldly competition and reminds us that this life passes.", "সম্পদ ও অর্জনের তুলনায় দিনের সময় হারিয়ে যেতে পারে। কুরআন দুনিয়ার প্রতিযোগিতা নিয়ে সতর্ক করে ও এই জীবনের অস্থায়িত্ব মনে করায়।", "قد تستولي مقارنة الممتلكات والإنجازات على يومك بهدوء. يحذّر القرآن من التفاخر الدنيوي ويذكّر بأن هذه الحياة تزول."),
    action: c("Step away from one comparison and do something of lasting benefit.", "একটি তুলনা থেকে সরে এসে স্থায়ী উপকারের কাজ করুন।", "ابتعد عن مقارنة واحدة وافعل شيئًا يبقى نفعه."),
    context: c("The verse compares worldly growth to plants that later wither. It contrasts passing attractions with accountability, forgiveness, and Allah’s pleasure in the Hereafter.", "আয়াতে দুনিয়ার বৃদ্ধি পরে শুকিয়ে যাওয়া গাছের সঙ্গে তুলনা করা হয়েছে। ক্ষণস্থায়ী আকর্ষণের পাশে আখিরাতের জবাবদিহি, ক্ষমা ও আল্লাহর সন্তুষ্টির কথা আছে।", "تشبّه الآية الدنيا بنبات ينمو ثم ييبس. وتقابل زينتها الزائلة بالحساب والمغفرة ورضوان الله في الآخرة."),
    tone: "warning", themes: ["consistency", "maintaining"]
  },
  {
    id: "use-time-well", verse: "103:1-3", excerpt: "urge each other to the truth, and urge each other to perseverance.",
    title: c("Give some time to what matters", "গুরুত্বপূর্ণ কাজেও সময় দিন", "امنح المهمّ بعض وقتك"),
    explanation: c("A full schedule is not always a meaningful one. Surah Al-Asr connects escaping loss with faith, good deeds, truth, and encouraging patience together.", "ভরা সময়সূচি সব সময় অর্থপূর্ণ হয় না। সূরা আল-আসর ক্ষতি থেকে বাঁচার সঙ্গে ঈমান, সৎকাজ, সত্য ও ধৈর্যের পারস্পরিক উপদেশ যুক্ত করে।", "ليس الجدول الممتلئ دائمًا يومًا ذا معنى. تربط سورة العصر النجاة من الخسران بالإيمان والعمل الصالح والتواصي بالحق والصبر."),
    action: c("Set aside a little time for a good deed you have postponed.", "পিছিয়ে রাখা একটি ভালো কাজের জন্য কিছু সময় রাখুন।", "خصّص قليلًا من الوقت لعمل صالح أجّلته."),
    context: c("Read the whole short surah together. It describes shared responsibility for truth and patience, not productivity or personal achievement alone.", "ছোট সূরাটি সম্পূর্ণ একসঙ্গে পড়ুন। এতে সত্য ও ধৈর্যের পারস্পরিক দায়িত্ব আছে, শুধু উৎপাদনশীলতা বা ব্যক্তিগত অর্জন নয়।", "اقرأ السورة القصيرة كاملة. تصف مسؤولية مشتركة عن الحق والصبر، لا الإنتاجية والإنجاز الفردي وحدهما.")
  },
  {
    id: "renew-intention", verse: "98:5", excerpt: "to worship Allah ˹alone˺ with sincere devotion to Him",
    title: c("Remember whom this is for", "কাজটি কার জন্য, মনে করুন", "تذكّر لمن تعمل"),
    explanation: c("A familiar good deed can become something we do for approval. The Quran places sincere devotion to Allah alongside prayer and zakah.", "চেনা ভালো কাজও মানুষের প্রশংসার জন্য করা হয়ে যেতে পারে। কুরআন নামাজ ও জাকাতের সঙ্গে আল্লাহর প্রতি আন্তরিক ইবাদতের কথা বলে।", "قد يتحوّل العمل الصالح المعتاد إلى طلب رضا الناس. يقرن القرآن إخلاص العبادة لله بالصلاة والزكاة."),
    action: c("Before a good deed, quietly renew your intention for Allah.", "ভালো কাজের আগে নীরবে আল্লাহর জন্য নিয়ত নতুন করুন।", "جدّد نيتك لله بهدوء قبل عمل صالح."),
    context: c("The verse describes worship with sincere devotion as part of the upright religion. Neither checkmarks nor public praise can measure that sincerity.", "আয়াতে সরল দ্বীনের অংশ হিসেবে আন্তরিক ইবাদতের কথা আছে। চিহ্ন দেওয়া বা মানুষের প্রশংসা দিয়ে আন্তরিকতা মাপা যায় না।", "تصف الآية العبادة الخالصة ضمن الدين القيّم. ولا تقيس علامات التسجيل أو ثناء الناس هذا الإخلاص.")
  },
  {
    id: "make-dua", verse: "2:186", excerpt: "I respond to one’s prayer when they call upon Me.",
    title: c("Speak to Allah about it", "বিষয়টি নিয়ে আল্লাহর কাছে দোয়া করুন", "ادعُ الله بما في قلبك"),
    explanation: c("You can make dua about a worry without finding impressive words. Allah tells His servants that He is near and responds when they call upon Him.", "সুন্দর শব্দ খুঁজে না পেলেও দুশ্চিন্তা নিয়ে দোয়া করতে পারেন। আল্লাহ বান্দাদের বলেছেন, তিনি কাছে আছেন ও ডাকলে সাড়া দেন।", "يمكنك الدعاء بهمّك دون البحث عن كلمات بليغة. يخبر الله عباده بقربه واستجابته لدعائهم."),
    action: c("Make a sincere dua in words you understand.", "বোঝেন এমন কথায় আন্তরিকভাবে দোয়া করুন।", "ادعُ بصدق بكلمات تفهمها."),
    context: c("This ayah sits among the fasting verses and also calls people to faith and obedience. It does not promise every request in exactly the form or timing we choose.", "রোজার আয়াতগুলোর মধ্যে এই আয়াত এসেছে এবং ঈমান ও আনুগত্যের কথাও বলে। প্রতিটি চাওয়া নিজের ঠিক করা রূপ বা সময়ে পূরণের প্রতিশ্রুতি নয়।", "تأتي الآية بين آيات الصيام وتدعو أيضًا للإيمان والطاعة. ولا تَعِد بكل طلب بالشكل أو الموعد الذي نختاره."),
    tone: "encouragement"
  },
  {
    id: "hope-and-effort", verse: "12:87", excerpt: "And do not lose hope in the mercy of Allah",
    title: c("Let hope move you to act", "আশা নিয়ে কাজে এগিয়ে যান", "ليدفعك الرجاء إلى العمل"),
    explanation: c("Hope can live alongside grief and uncertainty. Yaqub urged his sons to keep searching while refusing to lose hope in Allah’s mercy.", "দুঃখ ও অনিশ্চয়তার মধ্যেও আশা থাকতে পারে। ইয়াকুব ছেলেদের খোঁজ চালাতে ও আল্লাহর রহমতে নিরাশ না হতে বলেছেন।", "يمكن أن يعيش الرجاء مع الحزن وعدم اليقين. حثّ يعقوب أبناءه على مواصلة البحث وألّا ييأسوا من رحمة الله."),
    action: c("Take one constructive step while asking Allah for relief.", "আল্লাহর কাছে স্বস্তি চেয়ে গঠনমূলক একটি পদক্ষেপ নিন।", "اتخذ خطوة نافعة وأنت تسأل الله الفرج."),
    context: c("Yaqub is speaking about searching for Yusuf and his brother. The story joins hope with effort; sadness itself is not a verdict about faith.", "ইয়াকুব ইউসুফ ও তাঁর ভাইকে খোঁজার কথা বলছেন। গল্পে আশার সঙ্গে চেষ্টা আছে; দুঃখ নিজে ঈমানের ওপর কোনো রায় নয়।", "يتحدّث يعقوب عن البحث عن يوسف وأخيه. تجمع القصة الرجاء والسعي، والحزن وحده ليس حكمًا على الإيمان."),
    tone: "encouragement", themes: ["starting", "returning"]
  },
  {
    id: "sincere-repentance", verse: "66:8", excerpt: "O believers! Turn to Allah in sincere repentance",
    title: c("Make your return sincere", "আন্তরিকভাবে ফিরে আসুন", "اجعل رجوعك صادقًا"),
    explanation: c("Wanting to change is worth taking seriously. The Quran calls believers to sincere repentance, with hope for forgiveness and Jannah.", "বদলাতে চাওয়ার ইচ্ছাকে গুরুত্ব দিন। কুরআন ক্ষমা ও জান্নাতের আশার সঙ্গে মুমিনদের আন্তরিক তওবা করতে বলে।", "رغبتك في التغيير تستحق الاهتمام. يدعو القرآن المؤمنين إلى توبة نصوح مع الرجاء في المغفرة والجنة."),
    action: c("Ask Allah for forgiveness and take a practical step away from a wrong habit.", "আল্লাহর কাছে ক্ষমা চেয়ে ভুল অভ্যাস থেকে সরতে বাস্তব পদক্ষেপ নিন।", "استغفر الله واتخذ خطوة عملية لترك عادة خاطئة."),
    context: c("The ayah addresses believers and includes a dua for forgiveness and completed light on the Last Day. It is a call to change, not a judgment on a journal.", "আয়াতটি মুমিনদের সম্বোধন করে, শেষ দিবসে ক্ষমা ও পূর্ণ আলোর দোয়াও আছে। এটি বদলানোর ডাক, দিনলিপির ওপর বিচার নয়।", "تخاطب الآية المؤمنين وتتضمّن دعاء بالمغفرة وإتمام النور يوم القيامة. إنها دعوة للتغيير وليست حكمًا على سجل."),
    tone: "encouragement", themes: ["starting", "returning"]
  },
  {
    id: "keep-striving", verse: "29:69", excerpt: "As for those who struggle in Our cause, We will surely guide them along Our Way.",
    title: c("Keep making an honest effort", "আন্তরিক চেষ্টা চালিয়ে যান", "واصل السعي الصادق"),
    explanation: c("Not having everything settled does not make effort pointless. This ayah gives encouragement to those who strive for Allah and do good.", "সব ঠিক হয়ে যায়নি বলে চেষ্টা অর্থহীন হয় না। আল্লাহর জন্য চেষ্টা ও সৎকাজ করা মানুষদের এই আয়াত উৎসাহ দেয়।", "عدم استقرار كل شيء لا يجعل السعي بلا معنى. تشجّع هذه الآية من يجاهدون في الله ويحسنون."),
    action: c("Choose one good habit to practise sincerely this week.", "এই সপ্তাহে আন্তরিকভাবে চর্চার জন্য একটি ভালো অভ্যাস বেছে নিন।", "اختر عادة صالحة تمارسها بإخلاص هذا الأسبوع."),
    context: c("The final ayah of Al-Ankabut joins striving for Allah with guidance and His support for good-doers. It is not a promise of success in every worldly ambition.", "সূরা আল-আনকাবুতের শেষ আয়াতে আল্লাহর জন্য চেষ্টা, হেদায়েত ও সৎকর্মীদের সহায়তার কথা আছে। সব দুনিয়াবি ইচ্ছায় সাফল্যের প্রতিশ্রুতি নয়।", "تجمع خاتمة العنكبوت السعي لله والهداية ومعيّته للمحسنين. ولا تضمن النجاح في كل طموح دنيوي."),
    tone: "encouragement"
  },
  {
    id: "patient-household", verse: "20:132", excerpt: "Bid your people to pray, and be diligent in ˹observing˺ it.",
    title: c("Encourage prayer with patience", "ধৈর্য নিয়ে নামাজে উৎসাহ দিন", "شجّع على الصلاة بصبر"),
    explanation: c("A shared routine grows through patient care. The Quran tells the Prophet to encourage his household in prayer and remain steadfast in it himself.", "পরিবারের অভ্যাস ধৈর্যশীল যত্নে গড়ে ওঠে। কুরআন নবীকে পরিবারকে নামাজে উৎসাহ দিতে ও নিজেও নিয়মিত থাকতে বলে।", "تنمو العادة المشتركة بالعناية والصبر. يأمر القرآن النبي بأن يأمر أهله بالصلاة ويصطبر عليها بنفسه."),
    action: c("If appropriate, offer a gentle reminder and prepare for salah yourself.", "উপযুক্ত হলে কোমলভাবে স্মরণ করিয়ে নিজেও নামাজের প্রস্তুতি নিন।", "إن ناسب الحال، ذكّر بلطف واستعدّ أنت للصلاة."),
    context: c("The ayah also speaks of Allah providing sustenance and the outcome of righteousness. Encouraging others is paired with personal steadiness, not coercion.", "আয়াতে আল্লাহর রিজিক ও তাকওয়ার পরিণামের কথাও আছে। অন্যকে উৎসাহের সঙ্গে নিজের নিয়মিত থাকা যুক্ত, জবরদস্তি নয়।", "تذكر الآية أيضًا رزق الله والعاقبة للتقوى. ويقترن تذكير الآخرين بالثبات الشخصي لا بالإكراه."),
    themes: ["consistency", "maintaining"], exemptionSafe: false
  },
  {
    id: "prepare-jumuah", verse: "62:9", excerpt: "then proceed ˹diligently˺ to the remembrance of Allah and leave off ˹your˺ business.",
    title: c("Plan ahead for Jumuah", "জুমার জন্য আগে থেকে প্রস্তুতি নিন", "خطّط للجمعة مسبقًا"),
    explanation: c("Important worship deserves room in the schedule. The Quran calls those addressed by the Friday prayer command to leave business and attend Allah’s remembrance.", "গুরুত্বপূর্ণ ইবাদতের জন্য সময়সূচিতে জায়গা দরকার। জুমার নির্দেশ যাদের জন্য প্রযোজ্য, কুরআন তাদের ব্যবসা ছেড়ে আল্লাহর স্মরণে যেতে বলে।", "تستحق العبادة المهمة مكانًا في الجدول. يدعو القرآن من يتوجّه إليهم أمر الجمعة إلى ترك البيع والسعي لذكر الله."),
    action: c("If Jumuah is obligatory for you, arrange your work and journey in advance.", "আপনার ওপর জুমা ফরজ হলে আগে থেকে কাজ ও যাতায়াতের ব্যবস্থা করুন।", "إن كانت الجمعة واجبة عليك، رتّب عملك وطريقك مسبقًا."),
    context: c("This command concerns the Friday call to prayer. The following ayah permits returning to seek Allah’s bounty afterwards; it does not reject earning a living.", "এই নির্দেশ জুমার আজান নিয়ে। পরের আয়াতে পরে আল্লাহর অনুগ্রহ খুঁজতে যাওয়ার অনুমতি আছে; জীবিকা উপার্জনকে বাতিল করা হয়নি।", "يتعلّق الأمر بنداء الجمعة. وتبيح الآية التالية طلب فضل الله بعدها، فلا ترفض كسب العيش."),
    themes: ["consistency", "maintaining"], exemptionSafe: false
  },
  {
    id: "work-and-worship", verse: "24:37", excerpt: "who are not distracted—either by buying or selling—from Allah’s remembrance",
    title: c("Let work make room for worship", "কাজের মাঝেও ইবাদতের জায়গা রাখুন", "اجعل للعمل حدودًا تحفظ العبادة"),
    explanation: c("Earning a living and remembering Allah need not be enemies. The Quran praises people whose trade does not distract them from remembrance, salah, and zakah.", "জীবিকা ও আল্লাহর স্মরণ একে অন্যের প্রতিপক্ষ হতে হয় না। কুরআন এমন মানুষের প্রশংসা করে, যাদের ব্যবসা স্মরণ, নামাজ ও জাকাত থেকে সরায় না।", "لا يلزم أن يتعارض كسب الرزق وذكر الله. يمدح القرآن من لا تلهيهم تجارتهم عن الذكر والصلاة والزكاة."),
    action: c("Put one prayer break into your workday before it fills up.", "কাজের দিন ভরে যাওয়ার আগেই নামাজের একটি বিরতি ঠিক করুন।", "ضع استراحة للصلاة في يوم عملك قبل أن يزدحم."),
    context: c("The ayah appears in a passage about Allah’s light and places of worship. It describes devotion amid trade, not a command for everyone to abandon work.", "আল্লাহর নূর ও ইবাদতের স্থানের প্রসঙ্গে আয়াতটি এসেছে। ব্যবসার মাঝেও ইবাদত বজায় রাখার বর্ণনা, সবাইকে কাজ ছাড়ার নির্দেশ নয়।", "ترد الآية في سياق نور الله وبيوت العبادة. وتصف التعبّد مع التجارة، لا أمرًا للجميع بترك العمل."),
    themes: ["consistency", "maintaining"], exemptionSafe: false
  }
];

export const ADDITIONAL_REFLECTIONS: readonly PrayerReflection[] = entries.map(entry => ({
  id: entry.id, title: entry.title.en, explanation: entry.explanation.en,
  action: entry.action.en, context: entry.context.en,
  tone: entry.tone ?? "guidance", themes: entry.themes ?? ["starting", "returning", "consistency", "maintaining"],
  exemptionSafe: entry.exemptionSafe !== false && entry.tone !== "warning",
  source: {excerpt: entry.excerpt, reference: `Quran ${entry.verse}`,
    attribution: "Dr. Mustafa Khattab, The Clear Quran · English excerpt",
    url: `https://quran.com/${entry.verse.replace(":", "/")}`,
    tafsirUrl: `https://quran.com/${entry.verse.split("-")[0]}/tafsirs/en-tafisr-ibn-kathir`}
}));
export const additionalReflectionMessages: Record<string, readonly [string, string]> = Object.fromEntries(entries.flatMap(entry =>
  (["title", "explanation", "action", "context"] as const).map(field => [entry[field].en, [entry[field].bn, entry[field].ar] as const])
));
