/**
 * Hindi translations, keyed by the English source string.
 *
 * Keyed by the English rather than by invented ids (`hero.title` and friends)
 * for two reasons: there is nothing to keep in sync, and a string that has not
 * been translated yet falls back to readable English instead of rendering a
 * broken token in front of a user.
 *
 * What is deliberately NOT translated:
 *   • "Milagro Universe" and the brand names (Jaquar, CERA, Hindware, KOHLER, GROHE) —
 *     these are trademarks and read the same in both languages.
 *   • Numerals and units in the prototype figures (10K+, 4.8/5, 8.0 ft).
 *   • Customer names in the testimonials.
 */
export const hi: Record<string, string> = {
  /* ── navigation ─────────────────────────────────────────────────────── */
  "Home": "होम",
  "How it works": "यह कैसे काम करता है",
  "Products": "उत्पाद",
  "Inspiration": "प्रेरणा",
  "Pricing": "मूल्य",
  "About": "हमारे बारे में",
  "Features": "विशेषताएँ",
  "Blog": "ब्लॉग",
  "Help": "सहायता",
  "Search": "खोजें",
  "Open menu": "मेन्यू खोलें",
  "Close menu": "मेन्यू बंद करें",
  "Sign in": "साइन इन",
  "Get Started": "शुरू करें",

  /* ── hero ───────────────────────────────────────────────────────────── */
  "Better bathrooms. Brighter spaces.": "बेहतर बाथरूम। उज्ज्वल जगहें।",
  "From ideas to": "विचारों से",
  "beautiful bathrooms": "सुंदर बाथरूम तक",
  "Plan, visualize, estimate and build — all in one place.":
    "योजना बनाएँ, देखें, अनुमान लगाएँ और बनाएँ — सब एक ही जगह।",
  "Start Planning Free": "मुफ़्त योजना शुरू करें",
  "Watch Video": "वीडियो देखें",
  "Design it.": "डिज़ाइन करें।",
  "Plan it.": "योजना बनाएँ।",
  "Build it.": "बनाएँ।",
  "Scroll": "स्क्रॉल करें",
  "Happy homeowners": "खुश गृहस्वामी",
  "Average rating": "औसत रेटिंग",
  "Trusted brands": "भरोसेमंद ब्रांड",
  "Average cost savings": "औसत लागत बचत",

  /* ── value propositions ─────────────────────────────────────────────── */
  "Visualize before you build": "बनाने से पहले देखें",
  "See your bathroom in 2D & 3D": "अपना बाथरूम 2D और 3D में देखें",
  "Get accurate estimates": "सटीक अनुमान पाएँ",
  "No surprise costs": "कोई छिपी हुई लागत नहीं",
  "Find the right products": "सही उत्पाद चुनें",
  "Trusted brands & local stores": "भरोसेमंद ब्रांड और स्थानीय दुकानें",
  "Plan with confidence": "आत्मविश्वास से योजना बनाएँ",
  "Save time, money and effort": "समय, पैसा और मेहनत बचाएँ",

  /* ── how it works ───────────────────────────────────────────────────── */
  "Add your measurements": "अपने माप दर्ज करें",
  "Enter your bathroom size and existing elements.":
    "अपने बाथरूम का आकार और मौजूदा चीज़ें दर्ज करें।",
  "Get a smart plan": "एक स्मार्ट योजना पाएँ",
  "See 2D layouts and optimized suggestions.": "2D लेआउट और बेहतर सुझाव देखें।",
  "Choose your style": "अपनी शैली चुनें",
  "Explore designs, tiles and fittings that match your taste.":
    "अपनी पसंद के डिज़ाइन, टाइलें और फ़िटिंग देखें।",
  "Get material list": "सामग्री सूची पाएँ",
  "Exact quantities, estimated cost and brand recommendations.":
    "सटीक मात्रा, अनुमानित लागत और ब्रांड सुझाव।",

  /* ── planner ────────────────────────────────────────────────────────── */
  "See it.": "देखें।",
  "Change it.": "बदलें।",
  "Perfect it.": "सँवारें।",
  "Try the Planner": "प्लानर आज़माएँ",
  "Toilet": "टॉयलेट",
  "Sink": "बेसिन",
  "Shower": "शॉवर",
  "Cabinet": "अलमारी",
  "Bathtub": "बाथटब",
  "Bathroom fixtures": "बाथरूम फ़िक्स्चर",

  /* ── measurements & materials ───────────────────────────────────────── */
  "Length": "लंबाई",
  "Width": "चौड़ाई",
  "Height": "ऊँचाई",
  "Tiles": "टाइलें",
  "PVC Pipe": "पीवीसी पाइप",
  "Angle Valve": "एंगल वाल्व",
  "Cement": "सीमेंट",

  /* ── styles & tiles ─────────────────────────────────────────────────── */
  "Modern": "आधुनिक",
  "Traditional": "पारंपरिक",
  "Minimal": "सादगीपूर्ण",
  "Luxury": "शानदार",
  "White marble": "सफ़ेद संगमरमर",
  "Cream stone": "क्रीम पत्थर",
  "Dark slate": "गहरा स्लेट",
  "Glazed blue": "चमकदार नीला",
  "Terracotta": "टेराकोटा",
  "Warm wood": "गर्म लकड़ी",
  "View all brands": "सभी ब्रांड देखें",
  "Try now": "अभी आज़माएँ",

  /* ── testimonials ───────────────────────────────────────────────────── */
  "Homeowner, Bengaluru": "गृहस्वामी, बेंगलुरु",
  "Homeowner, Mumbai": "गृहस्वामी, मुंबई",
  "Homeowner, Pune": "गृहस्वामी, पुणे",

  /* ── footer & socials ───────────────────────────────────────────────── */
  "Instagram": "इंस्टाग्राम",
  "YouTube": "यूट्यूब",
  "LinkedIn": "लिंक्डइन",

  /* ── authentication ─────────────────────────────────────────────────── */
  "Email address": "ईमेल पता",
  "Password": "पासवर्ड",
  "Enter your password": "अपना पासवर्ड डालें",
  "Remember me": "मुझे याद रखें",
  "Forgot password?": "पासवर्ड भूल गए?",
  "Sign In": "साइन इन",
  "Signing in…": "साइन इन हो रहा है…",
  "Continue with Google": "Google से जारी रखें",
  "Connecting to Google…": "Google से जुड़ रहे हैं…",
  "New to Milagro Universe?": "Milagro Universe पर नए हैं?",
  "Create an account": "खाता बनाएँ",
  "Show password": "पासवर्ड दिखाएँ",
  "Hide password": "पासवर्ड छिपाएँ",
  "We couldn't sign you in.": "हम आपको साइन इन नहीं कर सके।",
  "Please check your email and password and try again.":
    "कृपया अपना ईमेल और पासवर्ड जाँचें और फिर कोशिश करें।",
  "We couldn't reach Milagro Universe. Check your connection and try again.":
    "हम Milagro Universe तक नहीं पहुँच सके। अपना कनेक्शन जाँचें और फिर कोशिश करें।",
  "We couldn't sign you in with Google.": "हम आपको Google से साइन इन नहीं कर सके।",

  "Create your Milagro Universe account": "अपना Milagro Universe खाता बनाएँ",
  "Start planning your bathroom with clarity and confidence.":
    "स्पष्टता और आत्मविश्वास के साथ अपने बाथरूम की योजना बनाना शुरू करें।",
  "First name": "पहला नाम",
  "Last name": "अंतिम नाम",
  "Create a password": "पासवर्ड बनाएँ",
  "Confirm password": "पासवर्ड की पुष्टि करें",
  "Re-enter your password": "अपना पासवर्ड दोबारा डालें",
  "Create Account": "खाता बनाएँ",
  "Creating account…": "खाता बन रहा है…",
  "Already have an account?": "पहले से खाता है?",
  "Use at least 8 characters with a mix of letters and numbers.":
    "कम से कम 8 अक्षर इस्तेमाल करें, जिनमें अक्षर और अंक दोनों हों।",
  "8+ characters": "8+ अक्षर",
  "One uppercase letter": "एक बड़ा अक्षर",
  "One number": "एक अंक",
  "Terms of Service": "सेवा की शर्तें",
  "Privacy Policy": "गोपनीयता नीति",
  "We couldn't create your account.": "हम आपका खाता नहीं बना सके।",
  "An account with that email already exists.": "इस ईमेल से पहले से एक खाता मौजूद है।",

  "Your Milagro Universe account is ready.": "आपका Milagro Universe खाता तैयार है।",
  "Start My First Bathroom": "मेरा पहला बाथरूम शुरू करें",
  "Explore Milagro Universe": "Milagro Universe देखें",

  "Plan better.": "बेहतर योजना बनाएँ।",
  "Build with confidence.": "आत्मविश्वास से बनाएँ।",
  "Better Decisions": "बेहतर निर्णय",
  "Save Time & Money": "समय और पैसे की बचत",
  "Beautiful Results": "सुंदर परिणाम",

  /* ── onboarding ─────────────────────────────────────────────────────── */
  "What would you like to call this bathroom?": "आप इस बाथरूम को क्या नाम देना चाहेंगे?",
  "Bathroom name": "बाथरूम का नाम",
  "e.g. Master Bathroom": "जैसे मास्टर बाथरूम",
  "Give this bathroom a name so you can find it later.":
    "इस बाथरूम को एक नाम दें ताकि आप इसे बाद में ढूँढ़ सकें।",
  "What are you planning?": "आप क्या योजना बना रहे हैं?",
  "Renovating an existing bathroom": "मौजूदा बाथरूम का नवीनीकरण",
  "Building a new bathroom": "नया बाथरूम बनाना",
  "Exploring ideas for now": "अभी सिर्फ़ विचार देख रहे हैं",
  "What matters most to you?": "आपके लिए सबसे ज़रूरी क्या है?",
  "Choose as many as you like.": "जितने चाहें उतने चुनें।",
  "Stay within budget": "बजट में रहें",
  "Make better use of space": "जगह का बेहतर उपयोग करें",
  "Visualize before building": "बनाने से पहले देखें",
  "Choose the right products": "सही उत्पाद चुनें",
  "Avoid renovation mistakes": "नवीनीकरण की गलतियों से बचें",
  "Create a premium bathroom": "एक प्रीमियम बाथरूम बनाएँ",
  "Continue": "आगे बढ़ें",
  "Start planning": "योजना शुरू करें",
  "About you": "आपके बारे में",
  "Next, you’ll plan": "आगे, आप योजना बनाएँगे",
  "Saving…": "सहेजा जा रहा है…",
  "Onboarding progress": "प्रक्रिया की प्रगति",

  /* ── account & dashboard ────────────────────────────────────────────── */
  "My Bathrooms": "मेरे बाथरूम",
  "My Plans": "मेरी योजनाएँ",
  "Saved Inspiration": "सहेजी गई प्रेरणा",
  "Account Settings": "खाता सेटिंग",
  "Sign Out": "साइन आउट",
  "Account": "खाता",
  "Picking up where you left off.": "वहीं से आगे, जहाँ आपने छोड़ा था।",
  "Continue planning": "योजना जारी रखें",
  "Open the Planner": "प्लानर खोलें",
  "Open": "खोलें",
  "Delete": "हटाएं",
  "New bathroom": "नया बाथरूम",
  "Pick up any plan, or start a new one.": "कोई भी प्लान जारी रखें, या नया शुरू करें।",
  "No measurements yet": "अभी कोई माप नहीं",
  "Start with a name and a few measurements — Milagro Universe takes it from there.":
    "एक नाम और कुछ माप से शुरू करें — आगे Milagro Universe सँभाल लेगा।",
  "Create Your First Bathroom": "अपना पहला बाथरूम बनाएँ",

  /* ── errors ─────────────────────────────────────────────────────────── */
  "Try Again": "फिर कोशिश करें",
  "This email already has a Milagro Universe account.":
    "इस ईमेल से पहले से एक Milagro Universe खाता मौजूद है।",
  "Google sign-in was cancelled.": "Google साइन-इन रद्द कर दिया गया।",
  "Your session has expired.": "आपका सत्र समाप्त हो गया है।",
  "Google sign-in isn't set up yet.": "Google साइन-इन अभी सेट नहीं किया गया है।",

  /* ── theme & language controls ──────────────────────────────────────── */
  "Switch to dark theme": "डार्क थीम पर जाएँ",
  "Switch to light theme": "लाइट थीम पर जाएँ",

  /* ── studio — budget ─────────────────────────────────────────────────── */
  "Choose how you’d like to spend": "चुनें कि आप कैसे ख़र्च करना चाहते हैं",
  "How do you want to spend?": "आप कैसे ख़र्च करना चाहते हैं?",
  "This shapes which products we suggest — not how much you have to spend.":
    "इससे तय होता है कि हम कौन-से उत्पाद सुझाएँ — यह नहीं कि आपको कितना ख़र्च करना है।",
  "From": "से",
  "Do you have a target budget?": "क्या आपका कोई लक्ष्य बजट है?",
  "Optional. We’ll show how the estimate compares as you go.":
    "वैकल्पिक। आगे बढ़ते हुए हम दिखाएँगे कि अनुमान इसके मुक़ाबले कहाँ ठहरता है।",
  "Target budget in rupees": "रुपयों में लक्ष्य बजट",
  "e.g. 1,50,000": "जैसे 1,50,000",
  "Skip for now": "अभी छोड़ें",
  "This tier starts at": "यह श्रेणी शुरू होती है",
  "we’ve set your target there. Choose a lower tier to spend less.":
    "हमने आपका लक्ष्य वहीं रख दिया है। कम ख़र्च के लिए नीचे की श्रेणी चुनें।",
  "No problem — we’ll still show a full estimate.":
    "कोई बात नहीं — हम फिर भी पूरा अनुमान दिखाएँगे।",
  "Target": "लक्ष्य",
  "minimum for this tier": "इस श्रेणी के लिए न्यूनतम",

  /* ── studio — planner canvas ─────────────────────────────────────────── */
  "Resolve the highlighted conflicts to continue": "आगे बढ़ने के लिए चिह्नित टकराव ठीक करें",
  "Fixtures": "फ़िक्स्चर",
  "View": "दृश्य",
  "Undo": "पूर्ववत करें",
  "Redo": "फिर से करें",
  "Reset layout": "लेआउट रीसेट करें",
  "Details": "विवरण",
  "Select a fixture on the plan to see its size and placement.":
    "आकार और स्थान देखने के लिए प्लान पर कोई फ़िक्स्चर चुनें।",
  "Selected": "चयनित",
  "Dimensions": "माप",
  "Position": "स्थिति",
  "Rotate": "घुमाएँ",
  "Duplicate": "प्रतिलिपि बनाएँ",
  "Replace": "बदलें",
  "Choose another from the Fixtures list": "फ़िक्स्चर सूची से दूसरा चुनें",
  "Remove": "हटाएँ",
  "Tip: select a fixture and use the arrow keys to nudge it. Hold Shift for a foot.":
    "सुझाव: कोई फ़िक्स्चर चुनें और ऐरो कुंजियों से उसे थोड़ा खिसकाएँ। एक फ़ुट के लिए Shift दबाए रखें।",

  /* ── studio — estimate ───────────────────────────────────────────────── */
  "Know the numbers before you start.": "शुरू करने से पहले आँकड़े जान लें।",
  "A planning estimate built from your layout, materials and chosen products.":
    "आपके लेआउट, सामग्री और चुने गए उत्पादों से बना एक योजना अनुमान।",
  "Working out your estimate…": "आपका अनुमान तैयार किया जा रहा है…",
  "Materials breakdown": "सामग्री का ब्यौरा",
  "Estimated materials": "अनुमानित सामग्री",
  "Labour": "मज़दूरी",
  "days": "दिन",
  "Try a different level": "कोई दूसरा स्तर आज़माएँ",
  "Spending level": "ख़र्च का स्तर",
  "Changes materials and products across the whole plan.":
    "पूरी योजना में सामग्री और उत्पाद बदल देता है।",
  "Estimated project range": "अनुमानित परियोजना सीमा",
  "Planning estimate": "योजना अनुमान",
  "Your target": "आपका लक्ष्य",
  "Comfortably within your target.": "आपके लक्ष्य के भीतर, आराम से।",
  "Around your target — the upper end would go over.":
    "आपके लक्ष्य के आसपास — ऊपरी सिरा इससे आगे निकल जाएगा।",
  "Above your target. Try the Save money level, or trim the fixture list.":
    "आपके लक्ष्य से ऊपर। 'पैसे बचाएँ' स्तर आज़माएँ, या फ़िक्स्चर सूची छाँटें।",
  "Labour, local pricing and site conditions will change the final amount. Existing plumbing, wall condition and access are the usual surprises. Treat this as a starting point for quotes, not a quote.":
    "मज़दूरी, स्थानीय क़ीमतें और साइट की स्थितियाँ अंतिम राशि बदल देंगी। मौजूदा प्लंबिंग, दीवारों की हालत और पहुँच — आम तौर पर यही चौंकाते हैं। इसे कोटेशन न मानें, कोटेशन लेने की शुरुआत मानें।",

  /* ── studio — shared plan ────────────────────────────────────────────── */
  "You’ve been invited to a bathroom plan.": "आपको एक बाथरूम प्लान में आमंत्रित किया गया है।",
  "Sign in to open it. You’ll be able to view and edit the plan together.":
    "इसे खोलने के लिए साइन इन करें। आप मिलकर प्लान देख और बदल सकेंगे।",
  "Sign in to open the plan": "प्लान खोलने के लिए साइन इन करें",
  "Or plan your own bathroom": "या अपना बाथरूम प्लान करें",
  "This link isn’t valid any more.": "यह लिंक अब मान्य नहीं है।",
  "Share links expire after 30 days. Ask for a fresh one, or start your own plan.":
    "साझा लिंक 30 दिनों में समाप्त हो जाते हैं। नया लिंक माँगें, या अपना प्लान शुरू करें।",
  "Plan a bathroom": "बाथरूम प्लान करें",
  "Opening the shared plan…": "साझा किया गया प्लान खोला जा रहा है…",

  /* ── studio — layout suggestions ─────────────────────────────────────── */
  "Open the planner": "प्लानर खोलें",
  "Choose a layout to continue": "आगे बढ़ने के लिए कोई लेआउट चुनें",
  "Here are 3 layouts that work for your space.": "आपकी जगह के लिए ये 3 लेआउट उपयुक्त हैं।",
  "Suggested based on the information you provided.": "आपके दिए गए विवरण के आधार पर सुझाए गए।",
  "Compare layouts": "लेआउट की तुलना करें",
  "These are planning suggestions based on your measurements — not architectural drawings. A contractor should confirm anything structural before work starts.":
    "ये आपके मापों पर आधारित योजना सुझाव हैं — वास्तुशिल्प नक़्शे नहीं। काम शुरू करने से पहले संरचना से जुड़ी हर बात किसी ठेकेदार से पक्की करा लें।",
  "Layout": "लेआउट",
  "Milagro recommends": "Milagro की सिफ़ारिश",
  "miniature floor plan": "छोटा फ़्लोर प्लान",
  "sq ft clear floor": "वर्ग फ़ुट खुली जगह",
  "Tight for this room — some fixtures may not fit comfortably.":
    "इस कमरे के लिए तंग — कुछ फ़िक्स्चर आराम से नहीं समा पाएँगे।",
  "Preview": "पूर्वावलोकन",
  "Chosen": "चुना गया",
  "Choose this layout": "यह लेआउट चुनें",
  "Comparison of the three suggested layouts": "तीनों सुझाए गए लेआउट की तुलना",
  "Prioritises": "प्राथमिकता",
  "Clear floor": "खुली जगह",
  "Notes": "टिप्पणियाँ",
  "Recommended": "अनुशंसित",
  "sq ft": "वर्ग फ़ुट",
  "to check": "जाँचने योग्य",
  "No clearance issues": "जगह से जुड़ी कोई दिक़्क़त नहीं",
  "preview": "पूर्वावलोकन",
  "Close": "बंद करें",
  "Needs attention": "ध्यान देने की ज़रूरत",
  "Worth checking": "जाँच लेना बेहतर",
  "Back to options": "विकल्पों पर वापस",

  /* ── studio — materials ──────────────────────────────────────────────── */
  "Here’s what your design may need.": "आपके डिज़ाइन के लिए यह सब लग सकता है।",
  "Worked out from your room size, layout and the fixtures you chose.":
    "आपके कमरे के आकार, लेआउट और चुने गए फ़िक्स्चर से निकाला गया।",
  "Working out your materials…": "आपकी सामग्री की सूची बनाई जा रही है…",
  "Recommended buffer": "अनुशंसित अतिरिक्त",
  "for cuts and breakage": "कटाई और टूट-फूट के लिए",
  "Quantities are planning estimates and should be verified on site before purchase. Wall heights, existing surfaces and wastage all change what you actually need.":
    "मात्राएँ योजना अनुमान हैं और ख़रीदने से पहले साइट पर जाँच लेनी चाहिए। दीवारों की ऊँचाई, मौजूदा सतहें और बर्बादी — ये सब असल ज़रूरत बदल देते हैं।",

  /* ── studio — measurements ───────────────────────────────────────────── */
  "Let’s get the dimensions right.": "आइए माप सही कर लें।",
  "A few measurements are enough to start building your bathroom plan.":
    "आपका बाथरूम प्लान शुरू करने के लिए कुछ माप ही काफ़ी हैं।",
  "Bathroom dimensions": "बाथरूम के माप",
  "Floor area": "फ़र्श का क्षेत्रफल",
  "Room shape": "कमरे का आकार",
  "Simple room": "साधारण कमरा",
  "Four straight walls": "चार सीधी दीवारें",
  "Custom shape": "अपना आकार",
  "Alcoves, angles": "आले, कोने",
  "Custom shapes are coming. For now we’ll plan the rectangle that fits your space — you can adjust walls later.":
    "अपने आकार जल्द आ रहे हैं। फ़िलहाल हम वह आयत बनाएँगे जो आपकी जगह में बैठती है — दीवारें बाद में बदली जा सकती हैं।",
  "Live plan of your bathroom, updating as you type":
    "आपके बाथरूम का लाइव प्लान, टाइप करते ही बदलता हुआ",
  "Measured wall to wall, inside the finished surfaces.":
    "दीवार से दीवार तक, तैयार सतहों के भीतर मापा गया।",
  "Measurement unit": "माप की इकाई",

  /* ── studio — doors, windows, plumbing ───────────────────────────────── */
  "Now tell us what can’t move.": "अब बताइए क्या नहीं हट सकता।",
  "Add doors, windows and existing plumbing so we can suggest layouts that actually work.":
    "दरवाज़े, खिड़कियाँ और मौजूदा प्लंबिंग जोड़ें ताकि हम वही लेआउट सुझाएँ जो सचमुच काम करें।",
  "Structure": "संरचना",
  "Move door": "दरवाज़ा खिसकाएँ",
  "Add": "जोड़ें",
  "This bathroom has no window": "इस बाथरूम में कोई खिड़की नहीं है",
  "We’ll plan for ventilation instead.": "हम इसके बदले हवादारी की व्यवस्था रखेंगे।",
  "Plumbing": "प्लंबिंग",
  "Placed": "रखे गए",
  "Click anywhere on the plan — we’ll snap it to the nearest wall.":
    "प्लान पर कहीं भी क्लिक करें — हम इसे पास की दीवार से जोड़ देंगे।",
  "Re-add it on another wall to move it.": "इसे खिसकाने के लिए दूसरी दीवार पर दोबारा जोड़ें।",
  "Door": "दरवाज़ा",
  "Hinge": "क़ब्ज़ा",
  "Left": "बाएँ",
  "Right": "दाएँ",
  "Opens": "खुलता है",
  "Inward": "अंदर की ओर",
  "Outward": "बाहर की ओर",
  "An outward-opening door frees up floor space in a small bathroom.":
    "बाहर की ओर खुलने वाला दरवाज़ा छोटे बाथरूम में फ़र्श की जगह बचाता है।",
  "From floor": "फ़र्श से",
  "Position along wall": "दीवार पर स्थिति",

  /* ── studio — project type ───────────────────────────────────────────── */
  "Choose one to continue": "आगे बढ़ने के लिए एक चुनें",
  "Let’s create your bathroom.": "आइए आपका बाथरूम बनाएँ।",
  "Tell us what you’re working with. We’ll guide you from there.":
    "बताइए आपके पास क्या है। आगे का रास्ता हम दिखाएँगे।",
  "You can change this later — nothing here is locked in.":
    "इसे बाद में बदला जा सकता है — यहाँ कुछ भी तय नहीं है।",
  "Best for": "किसके लिए सही",

  /* ── studio — final plan ─────────────────────────────────────────────── */
  "Saved to your account.": "आपके खाते में सहेजा गया।",
  "Save the plan first, then you can share it.": "पहले प्लान सहेजें, फिर आप इसे साझा कर सकते हैं।",
  "Save my bathroom": "मेरा बाथरूम सहेजें",
  "Your bathroom is ready to take shape.": "आपका बाथरूम आकार लेने को तैयार है।",
  "Everything you’ve planned, in one place.": "आपकी पूरी योजना, एक ही जगह।",
  "Final 2D plan": "अंतिम 2D प्लान",
  "Your Milagro plan": "आपका Milagro प्लान",
  "not set": "तय नहीं",
  "Working it out…": "हिसाब लगाया जा रहा है…",
  "Download": "डाउनलोड",
  "Share": "साझा करें",
  "Edit design": "डिज़ाइन बदलें",
  "This plan is a starting point for conversations with contractors and suppliers — not a construction drawing or a quote. Measurements, quantities and prices should all be confirmed on site.":
    "यह प्लान ठेकेदारों और आपूर्तिकर्ताओं से बातचीत की शुरुआत है — निर्माण नक़्शा या कोटेशन नहीं। माप, मात्राएँ और क़ीमतें साइट पर जाँच लेनी चाहिए।",

  /* ── studio — products ───────────────────────────────────────────────── */
  "Products selected for your bathroom.": "आपके बाथरूम के लिए चुने गए उत्पाद।",
  "Chosen for your room size, layout, style and spending tier. Swap anything you like.":
    "आपके कमरे के आकार, लेआउट, शैली और ख़र्च श्रेणी के अनुसार चुने गए। जो चाहें बदल लें।",
  "Indicative price": "अनुमानित क़ीमत",
  "Kept": "रखा गया",
  "Keep this": "इसे रखें",
  "Hide alternatives": "विकल्प छिपाएँ",
  "See alternatives": "विकल्प देखें",
  "Prices are indicative planning figures for this prototype — not quotes, and not live. Confirm current pricing and availability with the retailer before ordering.":
    "क़ीमतें इस प्रोटोटाइप के लिए अनुमानित योजना आँकड़े हैं — न कोटेशन, न मौजूदा दरें। ऑर्डर करने से पहले विक्रेता से क़ीमत और उपलब्धता की पुष्टि करें।",

  /* ── studio — style ──────────────────────────────────────────────────── */
  "Choose a direction to continue": "आगे बढ़ने के लिए कोई दिशा चुनें",
  "What should your bathroom feel like?": "आपका बाथरूम कैसा महसूस होना चाहिए?",
  "Choose a direction. You can change everything later.":
    "एक दिशा चुनें। सब कुछ बाद में बदला जा सकता है।",
  "Your room, in this direction. Fine-tune every surface on Visualize.":
    "आपका कमरा, इसी दिशा में। हर सतह को 'देखें' पर बारीकी से सँवारें।",
  "Choose a direction to see it applied to your room.":
    "अपने कमरे पर लागू देखने के लिए कोई दिशा चुनें।",

  /* ── studio — visualize ──────────────────────────────────────────────── */
  "See it before you build it.": "बनाने से पहले देख लें।",
  "Try finishes on your own layout. Nothing here changes the plan you made.":
    "अपने ही लेआउट पर फ़िनिश आज़माएँ। यहाँ कुछ भी आपके बनाए प्लान को नहीं बदलता।",
  "2D Plan": "2D प्लान",
  "3D View": "3D दृश्य",
  "Showing: Before": "दिखाया जा रहा है: पहले",
  "Show before": "पहले वाला दिखाएँ",
  "finishes chosen": "फ़िनिश चुनी गईं",
  "No finishes chosen yet": "अभी कोई फ़िनिश नहीं चुनी",
  "2D plan of your bathroom": "आपके बाथरूम का 2D प्लान",
  "Before — your existing bathroom, without the new finishes.":
    "पहले — आपका मौजूदा बाथरूम, नई फ़िनिश के बिना।",
  "Not chosen": "नहीं चुनी",
  "Colours are representative for planning. Tile and paint vary between batches and screens — check a physical sample before ordering.":
    "रंग योजना के लिए प्रतीकात्मक हैं। टाइल और पेंट हर बैच और स्क्रीन पर अलग दिखते हैं — ऑर्डर से पहले असली नमूना देख लें।",

  /* ── studio — shell, sharing & save ──────────────────────────────────── */
  "Planner progress": "प्लानर की प्रगति",
  "Which plumbing points do you want to keep?": "आप कौन-से प्लंबिंग पॉइंट रखना चाहते हैं?",
  "Keeping existing plumbing can significantly reduce renovation work.":
    "मौजूदा प्लंबिंग रखने से नवीनीकरण का काम काफ़ी घट सकता है।",
  "A general guide, not professional advice — your plumber or contractor should confirm what’s possible on site.":
    "यह सामान्य जानकारी है, पेशेवर सलाह नहीं — साइट पर क्या संभव है, यह आपके प्लंबर या ठेकेदार से पक्का कराएँ।",
  "Continue with Email": "ईमेल से जारी रखें",
  "Your plan stays in this browser until you do.": "तब तक आपका प्लान इसी ब्राउज़र में रहेगा।",
  "Share this plan": "यह प्लान साझा करें",
  "Send a link to your contractor, designer or partner so they can work on it with you.":
    "अपने ठेकेदार, डिज़ाइनर या साथी को लिंक भेजें ताकि वे आपके साथ इस पर काम कर सकें।",
  "Creating link…": "लिंक बनाया जा रहा है…",
  "Create a share link": "साझा लिंक बनाएँ",
  "Could not create the link. Only the plan’s owner can share it.":
    "लिंक नहीं बन सका। इसे केवल प्लान का मालिक साझा कर सकता है।",
  "Anyone with this link can edit the plan": "यह लिंक जिसके पास होगा, वह प्लान बदल सकता है",
  "Share link": "साझा लिंक",
  "Copied": "कॉपी हो गया",
  "Copy": "कॉपी करें",
  "Expires": "समाप्ति",
  "Who has access": "किसके पास पहुँच है",
  "Back": "वापस",
  "Back to home": "होम पर वापस",
  "Milagro Universe — planner": "Milagro Universe — प्लानर",
  "Project name": "परियोजना का नाम",
  "Save": "सहेजें",
  "Saved": "सहेजा गया",
  "My Bathroom": "मेरा बाथरूम",
  "Opening your plan…": "आपका प्लान खोला जा रहा है…",

  /* ── my bathrooms ────────────────────────────────────────────────────── */
  "Budget friendly": "किफ़ायती",
  "Cost effective": "लागत-प्रभावी",
  "Good quality": "अच्छी गुणवत्ता",
  "Top of the line": "सर्वोत्तम",
  "Shared with contractor": "ठेकेदार के साथ साझा",
  "Brief saved": "ब्रीफ़ सहेजा गया",
  "Estimate ready": "अनुमान तैयार",
  "4D plan ready": "4D प्लान तैयार",
  "Measurements added": "माप जोड़े गए",
  "Start a new bathroom": "नया बाथरूम शुरू करें",
  "Plan a guest bath, a kids' bath or a powder room alongside this one.":
    "इसके साथ-साथ गेस्ट बाथ, बच्चों का बाथ या पाउडर रूम भी प्लान करें।",
  "Finish level": "फ़िनिश स्तर",
  "Estimate": "अनुमान",
  "Not yet": "अभी नहीं",
  "Measure & choose a style": "माप लें और शैली चुनें",
  "Enter the room size, place the door and window, and pick the look you want.":
    "कमरे का आकार दर्ज करें, दरवाज़ा और खिड़की लगाएँ, और मनचाहा रूप चुनें।",
  "Open measurements": "माप खोलें",
  "See it in 4D": "इसे 4D में देखें",
  "Walk around your bathroom in 3D and play the build, day by day.":
    "अपने बाथरूम में 3D में घूमें और निर्माण को दिन-ब-दिन चलता देखें।",
  "Open the 4D plan": "4D प्लान खोलें",
  "Get the estimate & share": "अनुमान लें और साझा करें",
  "Check materials and cost, then send the brief to your contractor.":
    "सामग्री और लागत देखें, फिर ब्रीफ़ अपने ठेकेदार को भेजें।",
  "Open the brief": "ब्रीफ़ खोलें",
  "Make the most of your plan": "अपनी योजना का पूरा फ़ायदा उठाएँ",
  "You haven't created a bathroom yet.": "आपने अभी तक कोई बाथरूम नहीं बनाया है।",

  /* ── misc ────────────────────────────────────────────────────────────── */
  "Milagro Universe — home": "Milagro Universe — होम",
  "See it. Plan it. Build it.": "देखें। प्लान करें। बनवाएँ।",
  "Without renovation regrets.": "बिना किसी नवीनीकरण पछतावे के।",

  /* ── account & sign-in ───────────────────────────────────────────────── */
  "Loading your account…": "आपका खाता लोड हो रहा है…",
  "Milagro Universe — back to home": "Milagro Universe — होम पर वापस",
  "Plan · Visualize · Build": "प्लान · कल्पना · निर्माण",
  "Save your bathroom plans, compare ideas, track materials and continue your renovation journey from anywhere.":
    "अपने बाथरूम प्लान सहेजें, विचारों की तुलना करें, सामग्री पर नज़र रखें और अपनी नवीनीकरण यात्रा कहीं से भी जारी रखें।",
  "Your dream bathroom starts with a plan.": "आपका सपनों का बाथरूम एक योजना से शुरू होता है।",
  "Better": "बेहतर",
  "Decisions": "फ़ैसले",
  "Save Time": "समय बचाएँ",
  "& Money": "और पैसा",
  "Beautiful": "सुंदर",
  "Results": "नतीजे",
  "Let’s start planning your bathroom.": "आइए आपके बाथरूम की योजना शुरू करें।",
  "Check your inbox": "अपना इनबॉक्स देखें",
  "We’ve sent a password reset link to:": "हमने पासवर्ड रीसेट लिंक यहाँ भेजा है:",
  "Back to Sign In": "साइन इन पर वापस",
  "Forgot your password?": "पासवर्ड भूल गए?",
  "Enter your email and we’ll send you a reset link.":
    "अपना ईमेल दर्ज करें, हम आपको रीसेट लिंक भेज देंगे।",
  "Sending…": "भेजा जा रहा है…",
  "Send Reset Link": "रीसेट लिंक भेजें",
  "of": "में से",
  "Let’s create your first bathroom.": "आइए आपका पहला बाथरूम बनाएँ।",
  "← Back": "← वापस",
  "Let’s bring your bathroom to life.": "आइए आपके बाथरूम को साकार करें।",
  "Sign in to continue planning, comparing and designing.":
    "योजना बनाना, तुलना करना और डिज़ाइन करना जारी रखने के लिए साइन इन करें।",
  "Please accept the Terms of Service to continue.":
    "आगे बढ़ने के लिए कृपया सेवा की शर्तें स्वीकार करें।",
  "Your account was created, but we couldn't sign you in. Please sign in.":
    "आपका खाता बन गया, लेकिन हम आपको साइन इन नहीं कर सके। कृपया साइन इन करें।",
  "I agree to the": "मैं सहमत हूँ",
  "and": "और",

  /* ── landing page ────────────────────────────────────────────────────── */
  "A simpler way": "एक आसान तरीक़ा",
  "to plan your bathroom": "अपना बाथरूम प्लान करने का",
  "Whether you're renovating or building new, Milagro Universe helps you make better decisions with clear plans, real products and accurate estimates.":
    "चाहे आप नवीनीकरण कर रहे हों या नया बना रहे हों, Milagro Universe स्पष्ट योजनाओं, असली उत्पादों और सटीक अनुमानों के साथ बेहतर फ़ैसले लेने में मदद करता है।",
  "Start Your Plan": "अपनी योजना शुरू करें",
  "Your measurements": "आपके माप",
  "Your dream": "आपका सपनों का",
  "bathroom": "बाथरूम",
  "Top brands. Real comparisons.": "बेहतरीन ब्रांड। सच्ची तुलना।",
  "Compare prices, warranty and service for trusted brands.":
    "भरोसेमंद ब्रांडों की क़ीमत, वारंटी और सेवा की तुलना करें।",
  "Ready to plan your bathroom?": "अपना बाथरूम प्लान करने के लिए तैयार हैं?",
  "Let's build a better bathroom, together.": "आइए मिलकर एक बेहतर बाथरूम बनाएँ।",
  "Less confusion. Better choices. A smoother renovation journey.":
    "कम उलझन। बेहतर विकल्प। आसान नवीनीकरण यात्रा।",
  "Your perfect bathroom is just a few clicks away.": "आपका बेहतरीन बाथरूम बस कुछ क्लिक दूर है।",
  "Plan Better. Build Smarter.": "बेहतर योजना। समझदार निर्माण।",
  "All rights reserved.": "सर्वाधिकार सुरक्षित।",
  "A warm, softly lit bathroom with a freestanding stone bath, a glass shower and a timber vanity":
    "एक गर्म, हल्की रोशनी वाला बाथरूम जिसमें पत्थर का फ़्रीस्टैंडिंग बाथटब, काँच का शॉवर और लकड़ी की वैनिटी है",
  "Watch Milagro Universe renovation video": "Milagro Universe नवीनीकरण वीडियो देखें",
  "Take Control of Your Bathroom Renovation": "अपने बाथरूम के नवीनीकरण की कमान सँभालें",
  "Plan. Visualize. Build. In 4 simple steps.": "योजना। कल्पना। निर्माण। 4 आसान चरणों में।",
  "Bathroom": "बाथरूम",
  "Next": "अगला",
  "Drag, drop and explore different layouts, fittings, tiles and colours before you start building.":
    "बनाना शुरू करने से पहले अलग-अलग लेआउट, फ़िटिंग, टाइलें और रंग खींचकर आज़माएँ।",
  "drag, or move with the arrow keys": "खींचें, या ऐरो कुंजियों से खिसकाएँ",
  "Move & explore": "खिसकाएँ और आज़माएँ",
  "Explore styles for every home": "हर घर के लिए शैलियाँ देखें",
  "From modern to traditional, we have ideas for every taste and budget.":
    "आधुनिक से पारंपरिक तक, हर पसंद और बजट के लिए विचार मौजूद हैं।",
  "Explore": "देखें",
  "bathrooms": "बाथरूम",
  "Trusted by homeowners like you": "आप जैसे गृहस्वामियों का भरोसा",
  "Real stories. Real bathrooms. Real confidence.": "सच्ची कहानियाँ। असली बाथरूम। पक्का भरोसा।",
  "Try tiles and wallpapers instantly": "टाइलें और वॉलपेपर तुरंत आज़माएँ",
  "Upload a brochure or pick from our library.": "ब्रोशर अपलोड करें या हमारी लाइब्रेरी से चुनें।",
  "Close video": "वीडियो बंद करें",
  "Your browser cannot play this video.": "आपका ब्राउज़र यह वीडियो नहीं चला सकता।",
  "Watch Again": "फिर से देखें",

  /* ── shared ui ───────────────────────────────────────────────────────── */
  "Switch to Hindi": "हिंदी में देखें",

  /* ── studio — journey labels ─────────────────────────────────────────── */
  "Project": "परियोजना",
  "Space": "जगह",
  "Visualize": "कल्पना",
  "Style": "शैली",
  "Project type": "परियोजना का प्रकार",
  "Measurements": "माप",
  "Doors & windows": "दरवाज़े और खिड़कियाँ",
  "Layout suggestions": "लेआउट सुझाव",
  "Planner": "प्लानर",
  "Budget": "बजट",
  "Materials": "सामग्री",
  "Your plan": "आपकी योजना",

  /* ── studio — fixture palette ────────────────────────────────────────── */
  "Floor-mounted WC": "फ़र्श पर लगा डब्ल्यूसी",
  "Wall-hung WC": "दीवार पर लटका डब्ल्यूसी",
  "Compact, wall-mounted": "छोटा, दीवार पर लगा",
  "Sink / Basin": "सिंक / बेसिन",
  "Basin without a cabinet": "बिना अलमारी वाला बेसिन",
  "Vanity": "वैनिटी",
  "Basin with storage under": "नीचे भंडारण वाला बेसिन",
  "Walk-in enclosure": "वॉक-इन एनक्लोज़र",
  "Tub with shower over": "ऊपर शॉवर वाला बाथटब",
  "Cabinet / Mirror": "अलमारी / शीशा",
  "Mirrored wall cabinet": "शीशे वाली दीवार अलमारी",
  "Storage": "भंडारण",
  "Tall storage unit": "ऊँची भंडारण यूनिट",
  "Basin": "बेसिन",

  /* ── studio — finishes & style directions ────────────────────────────── */
  "Warm Travertine": "गर्म ट्रैवर्टीन",
  "Soft warm stone; hides water marks well.":
    "मुलायम गर्म पत्थर; पानी के निशान अच्छे से छिपाता है।",
  "White Marble": "सफ़ेद संगमरमर",
  "Bright and classic; shows more dust.": "चमकदार और क्लासिक; धूल ज़्यादा दिखती है।",
  "Terrazzo": "टेराज़ो",
  "Speckled; very forgiving day to day.": "चितकबरा; रोज़मर्रा में बहुत सहनशील।",
  "Concrete": "कंक्रीट",
  "Quiet, modern, pairs with most fittings.": "शांत, आधुनिक, ज़्यादातर फ़िटिंग के साथ जँचता है।",
  "Subway": "सबवे",
  "Small format; more grout lines to clean.": "छोटा आकार; साफ़ करने को ज़्यादा जोड़।",
  "Patterned": "नक़्शीदार",
  "A feature in its own right; keep the rest plain.": "अपने आप में एक ख़ासियत; बाक़ी सादा रखें।",
  "Chalk White": "चाक सफ़ेद",
  "Maximum light; the safe default.": "सबसे ज़्यादा रोशनी; सुरक्षित विकल्प।",
  "Warm Sand": "गर्म रेत",
  "Warms a room with little natural light.": "कम प्राकृतिक रोशनी वाले कमरे को गर्माहट देता है।",
  "Soft Clay": "मुलायम मिट्टी",
  "Earthy; flatters warm wood and brass.": "मिट्टी जैसा; गर्म लकड़ी और पीतल पर फबता है।",
  "Deep Slate": "गहरा स्लेट",
  "Dramatic; best with strong lighting.": "नाटकीय; तेज़ रोशनी के साथ सबसे अच्छा।",
  "Sage": "सेज हरा",
  "Calm and natural; easy with stone.": "शांत और प्राकृतिक; पत्थर के साथ सहज।",
  "Natural Oak": "प्राकृतिक ओक",
  "Warm grain; hides splashes.": "गर्म रेशा; छींटे छिपाता है।",
  "Walnut": "अख़रोट",
  "Rich and dark; a strong anchor.": "गहरा और समृद्ध; मज़बूत आधार।",
  "Matte White": "मैट सफ़ेद",
  "Disappears into the wall; feels larger.": "दीवार में घुल जाता है; जगह बड़ी लगती है।",
  "Ink Green": "स्याही हरा",
  "A quiet feature colour.": "एक शांत ख़ास रंग।",
  "Chrome": "क्रोम",
  "Hard-wearing and easy to find.": "टिकाऊ और आसानी से मिलने वाला।",
  "Brushed Nickel": "ब्रश्ड निकल",
  "Softer sheen; fingerprints show less.": "हल्की चमक; उँगलियों के निशान कम दिखते हैं।",
  "Matte Black": "मैट काला",
  "Bold; water spots are more visible.": "दमदार; पानी के धब्बे ज़्यादा दिखते हैं।",
  "Brushed Brass": "ब्रश्ड पीतल",
  "Warm; pairs with wood and stone.": "गर्म; लकड़ी और पत्थर के साथ जँचता है।",
  "Gloss White": "चमकदार सफ़ेद",
  "Standard sanitaryware; easiest to clean.": "सामान्य सैनिटरीवेयर; साफ़ करना सबसे आसान।",
  "Softer look; needs a gentler cleaner.": "नरम रूप; हल्के क्लीनर की ज़रूरत।",
  "Stone Grey": "पत्थर स्लेटी",
  "Understated; less obvious limescale.": "सादा; पानी के जमाव कम दिखते हैं।",
  "Warm (2700K)": "गर्म (2700K)",
  "Relaxing; flatters warm finishes.": "सुकून देने वाला; गर्म फ़िनिश पर फबता है।",
  "Neutral (3500K)": "तटस्थ (3500K)",
  "Good all-rounder for grooming.": "तैयार होने के लिए हर तरह से अच्छा।",
  "Daylight (5000K)": "दिन का उजाला (5000K)",
  "Truest colour; can feel clinical.": "सबसे सच्चा रंग; थोड़ा ठंडा लग सकता है।",
  "Try a tile": "कोई टाइल आज़माएँ",
  "Floor": "फ़र्श",
  "Choose a floor": "फ़र्श चुनें",
  "Walls": "दीवारें",
  "Choose a wall finish": "दीवार की फ़िनिश चुनें",
  "Choose a vanity finish": "वैनिटी की फ़िनिश चुनें",
  "Choose a shower finish": "शॉवर की फ़िनिश चुनें",
  "WC": "डब्ल्यूसी",
  "Choose a WC finish": "डब्ल्यूसी की फ़िनिश चुनें",
  "Fittings": "फ़िटिंग",
  "Choose your fittings": "अपनी फ़िटिंग चुनें",
  "Lighting": "रोशनी",
  "Choose your lighting": "अपनी रोशनी चुनें",
  "Warm Minimal": "गर्म सादगी",
  "Soft stone": "मुलायम पत्थर",
  "Muted fittings": "हल्की फ़िटिंग",
  "Modern Luxe": "आधुनिक शान",
  "Marble": "संगमरमर",
  "Statement lighting": "दमदार रोशनी",
  "Premium fittings": "प्रीमियम फ़िटिंग",
  "Natural & Earthy": "प्राकृतिक और मिट्टी जैसा",
  "Natural textures": "प्राकृतिक बनावट",
  "Warm neutrals": "गर्म तटस्थ रंग",
  "Organic finishes": "सहज फ़िनिश",
  "Clean & Contemporary": "साफ़ और समकालीन",
  "Light surfaces": "हल्की सतहें",
  "Simple geometry": "सरल ज्यामिति",
  "Minimal fixtures": "कम फ़िक्स्चर",
  "Classic": "क्लासिक",
  "Timeless finishes": "सदाबहार फ़िनिश",
  "Traditional detailing": "पारंपरिक बारीकियाँ",

  /* ── studio — layout options ─────────────────────────────────────────── */
  "Balanced": "संतुलित",
  "Best balance of movement, access and fixture placement.":
    "चलने-फिरने, पहुँच और फ़िक्स्चर की जगह का सबसे अच्छा संतुलन।",
  "Movement": "आवाजाही",
  "Access": "पहुँच",
  "Fixture placement": "फ़िक्स्चर की जगह",
  "More Open": "ज़्यादा खुला",
  "Prioritises open floor space and easy movement.":
    "खुली फ़र्श जगह और आसान आवाजाही को प्राथमिकता।",
  "Open floor space": "खुली फ़र्श जगह",
  "Easy movement": "आसान आवाजाही",
  "More Storage": "ज़्यादा भंडारण",
  "Prioritises a larger vanity and additional storage.":
    "बड़ी वैनिटी और अतिरिक्त भंडारण को प्राथमिकता।",
  "Larger vanity": "बड़ी वैनिटी",
  "Additional storage": "अतिरिक्त भंडारण",
  "Finding the best use of your space…": "आपकी जगह का सबसे अच्छा उपयोग खोजा जा रहा है…",
  "Checking fixture placement…": "फ़िक्स्चर की जगह जाँची जा रही है…",
  "Looking at movement space…": "आवाजाही की जगह देखी जा रही है…",
  "Preparing layout options…": "लेआउट विकल्प तैयार किए जा रहे हैं…",

  /* ── studio — product catalogue ──────────────────────────────────────── */
  "Basin / Vanity": "बेसिन / वैनिटी",
  "Faucets": "नल",
  "Accessories": "सहायक सामान",
  "Floor-Mounted WC": "फ़र्श पर लगा डब्ल्यूसी",
  "Wall-Hung WC": "दीवार पर लटका डब्ल्यूसी",
  "Rimless Wall-Hung WC": "रिमलेस दीवार डब्ल्यूसी",
  "Pedestal Basin": "पेडेस्टल बेसिन",
  "Countertop Basin + Vanity": "काउंटरटॉप बेसिन + वैनिटी",
  "Stone-Top Vanity Unit": "पत्थर के टॉप वाली वैनिटी",
  "Overhead Shower Set": "ओवरहेड शॉवर सेट",
  "Rain Shower + Handheld": "रेन शॉवर + हैंडहेल्ड",
  "Thermostatic Shower System": "थर्मोस्टैटिक शॉवर सिस्टम",
  "Single-Lever Mixer": "सिंगल-लीवर मिक्सर",
  "Basin Mixer Set": "बेसिन मिक्सर सेट",
  "Concealed Mixer Set": "कंसील्ड मिक्सर सेट",
  "Open Shelf Unit": "खुली शेल्फ़ यूनिट",
  "Mirror Cabinet": "शीशे वाली अलमारी",
  "Tall Storage Unit": "ऊँची भंडारण यूनिट",
  "Ceramic Tile": "सेरामिक टाइल",
  "Vitrified Tile": "विट्रिफ़ाइड टाइल",
  "Large-Format Vitrified Tile": "बड़े आकार की विट्रिफ़ाइड टाइल",
  "Essentials Set": "ज़रूरी सामान सेट",
  "Coordinated Accessory Set": "मेल खाता सहायक सेट",
  "Designer Accessory Set": "डिज़ाइनर सहायक सेट",
  "Matches your warm minimal direction": "आपकी गर्म सादगी दिशा से मेल खाता है",
  "Matches your modern luxe direction": "आपकी आधुनिक शान दिशा से मेल खाता है",
  "Matches your natural & earthy direction": "आपकी प्राकृतिक और मिट्टी जैसी दिशा से मेल खाता है",
  "Matches your clean & contemporary direction": "आपकी साफ़ और समकालीन दिशा से मेल खाता है",
  "Matches your classic direction": "आपकी क्लासिक दिशा से मेल खाता है",
  "Within the budget-friendly tier": "किफ़ायती श्रेणी के भीतर",
  "Within the Smart Value tier": "स्मार्ट वैल्यू श्रेणी के भीतर",
  "Within the premium tier": "प्रीमियम श्रेणी के भीतर",
  "Within the top-of-the-line tier": "सर्वोत्तम श्रेणी के भीतर",
  "Compact footprint for a smaller room": "छोटे कमरे के लिए कम जगह घेरता है",
  "Adds storage without taking more floor": "फ़र्श घेरे बिना भंडारण बढ़ाता है",
  "Keeps the total down": "कुल ख़र्च कम रखता है",
  "Sized for your layout": "आपके लेआउट के नाप का",
  "per sq ft": "प्रति वर्ग फ़ुट",
  "Upgrade": "बेहतर विकल्प",

  /* ── studio — material groups ────────────────────────────────────────── */
  "Construction": "निर्माण",

  /* ── studio — placement feedback ─────────────────────────────────────── */
  "the WC": "डब्ल्यूसी",
  "the basin": "बेसिन",
  "the shower": "शॉवर",
  "the storage unit": "भंडारण यूनिट",
  "Outside the room": "कमरे के बाहर",
  "Placement conflict": "जगह का टकराव",
  "In the door’s path": "दरवाज़े के रास्ते में",
  "A little tight": "थोड़ा तंग",
  "Comfortable placement": "आरामदायक जगह",
  "Good clearance around the fixture.": "फ़िक्स्चर के चारों ओर अच्छी जगह।",

  /* ── studio — project type cards ─────────────────────────────────────── */
  "Build a new bathroom": "नया बाथरूम बनाएँ",
  "Starting with an empty space.": "ख़ाली जगह से शुरुआत।",
  "New homes": "नए घर",
  "New floors": "नई मंज़िलें",
  "New bathroom construction": "नए बाथरूम का निर्माण",
  "Start from scratch": "शुरू से शुरू करें",
  "Renovate my bathroom": "मेरे बाथरूम का नवीनीकरण",
  "Improve an existing bathroom.": "मौजूदा बाथरूम को बेहतर बनाएँ।",
  "Changing fixtures": "फ़िक्स्चर बदलना",
  "Moving plumbing": "प्लंबिंग खिसकाना",
  "Replacing tiles": "टाइलें बदलना",
  "Changing the layout": "लेआउट बदलना",
  "Plan my renovation": "मेरा नवीनीकरण प्लान करें",
  "Redesign my bathroom": "मेरे बाथरूम का नया डिज़ाइन",
  "Refresh the space without major construction.": "बड़े निर्माण के बिना जगह को नया रूप दें।",
  "New colours": "नए रंग",
  "Styling": "सजावट",
  "Redesign my space": "मेरी जगह का नया डिज़ाइन",

  /* ── studio — spending tiers ─────────────────────────────────────────── */
  "Reliable essentials. Prioritize value.": "भरोसेमंद ज़रूरी चीज़ें। क़ीमत को प्राथमिकता।",
  "Trusted entry-level brands": "भरोसेमंद शुरुआती ब्रांड",
  "Standard ceramic and fittings": "सामान्य सेरामिक और फ़िटिंग",
  "Fewer optional extras": "कम अतिरिक्त विकल्प",
  "Smart value": "स्मार्ट वैल्यू",
  "Good quality without unnecessary upgrades.": "बिना ग़ैरज़रूरी अपग्रेड के अच्छी गुणवत्ता।",
  "Mid-range brands with good service": "अच्छी सेवा वाले मध्यम ब्रांड",
  "Better taps and mixers": "बेहतर नल और मिक्सर",
  "Where most homeowners land": "ज़्यादातर गृहस्वामी यहीं पहुँचते हैं",
  "Most Popular": "सबसे लोकप्रिय",
  "Premium": "प्रीमियम",
  "Better finishes, brands and warranties.": "बेहतर फ़िनिश, ब्रांड और वारंटी।",
  "Longer warranties": "लंबी वारंटी",
  "Premium surface finishes": "प्रीमियम सतह फ़िनिश",
  "Wider design choice": "ज़्यादा डिज़ाइन विकल्प",
  "Premium fixtures and finishes throughout.": "हर जगह प्रीमियम फ़िक्स्चर और फ़िनिश।",
  "Flagship ranges": "शीर्ष श्रेणियाँ",
  "Designer fittings": "डिज़ाइनर फ़िटिंग",
  "Specified down to the detail": "बारीकी तक तय",

  /* ── studio — openings & walls ───────────────────────────────────────── */
  "Window": "खिड़की",
  "Ventilation": "हवादारी",
  "WC outlet": "डब्ल्यूसी आउटलेट",
  "Basin point": "बेसिन पॉइंट",
  "Shower point": "शॉवर पॉइंट",
  "Water inlet": "पानी का इनलेट",
  "Back wall": "पिछली दीवार",
  "Front wall": "सामने की दीवार",
  "Left wall": "बाईं दीवार",
  "Right wall": "दाईं दीवार",
  "Close properties": "गुण बंद करें",

  /* ── studio — canvas ─────────────────────────────────────────────────── */
  "Everything has comfortable clearance.": "हर चीज़ के आसपास आरामदायक जगह है।",
  "One or more fixtures are a little tight — marked △ on the plan.":
    "एक या अधिक फ़िक्स्चर थोड़े तंग हैं — प्लान पर △ से चिह्नित।",
  "Something overlaps — marked ! on the plan.": "कुछ आपस में टकरा रहा है — प्लान पर ! से चिह्नित।",

  /* ── studio — plumbing intent ────────────────────────────────────────── */
  "Keep existing plumbing": "मौजूदा प्लंबिंग रखें",
  "Work around the outlets that are already there.":
    "जो आउटलेट पहले से हैं, उन्हीं के हिसाब से काम करें।",
  "Open to moving plumbing": "प्लंबिंग खिसकाने को तैयार",
  "Best layout first; we’ll show what it involves.":
    "पहले सबसे अच्छा लेआउट; उसमें क्या लगेगा, हम बताएँगे।",
  "Not sure yet": "अभी तय नहीं",
  "Decide once you’ve seen the options.": "विकल्प देखकर तय करें।",

  /* ── studio — save gate ──────────────────────────────────────────────── */
  "Keep your bathroom plan.": "अपना बाथरूम प्लान सहेजें।",
  "Create a free account to save your design and come back anytime.":
    "मुफ़्त खाता बनाएँ, अपना डिज़ाइन सहेजें और कभी भी लौटें।",
  "Create a free account to download your plan and come back to it anytime.":
    "मुफ़्त खाता बनाएँ, अपना प्लान डाउनलोड करें और कभी भी लौटें।",
  "Share your bathroom plan.": "अपना बाथरूम प्लान साझा करें।",
  "Create a free account to share this design and keep everyone on the same page.":
    "मुफ़्त खाता बनाएँ, यह डिज़ाइन साझा करें और सबको एक ही पन्ने पर रखें।",

  /* ── found by the content scan (see scripts/check-i18n.mjs) ─────────── */
  "New Bathroom": "नया बाथरूम",
  "More of the planner is on the way.": "प्लानर का और हिस्सा जल्द आ रहा है।",
  "W.C. / Commode": "डब्ल्यूसी / कमोड",
  "Wash basin & counter": "वॉश बेसिन और काउंटर",
  "Shower fittings": "शॉवर फ़िटिंग",
  "Almirah / storage": "अलमारी / भंडारण",
  "Geyser (water heater)": "गीज़र (वॉटर हीटर)",
  "Exhaust fan": "एग्ज़ॉस्ट फ़ैन",
  "Towel rail": "तौलिया रैक",
  "Health faucet": "हेल्थ फ़ॉसेट",
  "Floor drain": "फ़र्श की नाली",
  "Wall niche": "दीवार का आला",
  "no.": "नग",
  "Tiles (floor + walls)": "टाइलें (फ़र्श + दीवारें)",
  "Badarpur (sand)": "बदरपुर (रेत)",
  "Water supply pipe": "पानी सप्लाई पाइप",
  "Drain pipe": "निकासी पाइप",
  "Angle valves": "एंगल वाल्व",
  "Diverter": "डायवर्टर",
  "P-traps / wastes": "पी-ट्रैप / वेस्ट",
  "Bathroom planner canvas": "बाथरूम प्लानर कैनवास",
  "Save money": "पैसे बचाएँ",
  "Master Ensuite": "मास्टर बाथरूम",
  "Bathroom measurements": "बाथरूम के माप",
  "Final layout": "अंतिम लेआउट",
  "2D plan": "2D प्लान",
  "3D visualization": "3D कल्पना",
  "Selected fixtures": "चुने गए फ़िक्स्चर",
  "Tiles & finishes": "टाइलें और फ़िनिश",
  "Material quantities": "सामग्री की मात्रा",
  "Indicative budget": "अनुमानित बजट",
  "Renovation": "नवीनीकरण",
  "Redesign": "नया डिज़ाइन",
  "Bathroom plan": "बाथरूम प्लान",
  "Existing plumbing": "मौजूदा प्लंबिंग",
  "Keep where possible": "जहाँ संभव हो, वहीं रखें",
  "Open to moving": "खिसकाने को तैयार",
  "Undecided": "तय नहीं",
  "None placed": "कुछ नहीं रखा गया",
  "Direction": "दिशा",
  "Not yet calculated": "अभी हिसाब नहीं लगा",
  "Owner": "मालिक",
  "Can edit": "बदल सकते हैं",
  "It was created with a password. Sign in with your password below, then use Continue with Google — we'll link the two.":
    "यह पासवर्ड से बनाया गया था। नीचे अपने पासवर्ड से साइन इन करें, फिर Google से जारी रखें — हम दोनों को जोड़ देंगे।",
  "Sign in the way you did originally, then use Continue with Google to link it.":
    "जैसे आपने पहले साइन इन किया था वैसे करें, फिर Google से जारी रखें और दोनों को जोड़ें।",
  "Google hasn't verified that email address.": "Google ने उस ईमेल पते की पुष्टि नहीं की है।",
  "Verify your address with Google, then try again — or sign in with a password.":
    "Google से अपना पता सत्यापित करें, फिर दोबारा कोशिश करें — या पासवर्ड से साइन इन करें।",
  "No changes were made. You can try again whenever you're ready.":
    "कोई बदलाव नहीं हुआ। आप जब चाहें दोबारा कोशिश कर सकते हैं।",
  "The server is missing its Google credentials. This one is on us, not on you.":
    "सर्वर पर Google क्रेडेंशियल मौजूद नहीं हैं। यह गड़बड़ी हमारी है, आपकी नहीं।",
  "Something went wrong on the way back from Google. Please try again.":
    "Google से लौटते समय कुछ गड़बड़ हो गई। कृपया दोबारा कोशिश करें।",
  "48 pcs": "48 नग",
  "3 pcs": "3 नग",
  "2 bags": "2 बोरी",
  "Modern bathroom with a walk-in shower, warm stone walls and a timber vanity":
    "वॉक-इन शॉवर, गर्म पत्थर की दीवारों और लकड़ी की वैनिटी वाला आधुनिक बाथरूम",
  "Traditional bathroom with a roll-top bath and panelled cabinetry":
    "रोल-टॉप बाथटब और पैनल वाली अलमारियों वाला पारंपरिक बाथरूम",
  "Minimal bathroom in white with a freestanding tub and pale timber":
    "सफ़ेद रंग, फ़्रीस्टैंडिंग बाथटब और हल्की लकड़ी वाला सादा बाथरूम",
  "Luxury bathroom with a sculptural stone bath and full-height stone walls":
    "तराशे पत्थर के बाथटब और पूरी ऊँचाई की पत्थर की दीवारों वाला शानदार बाथरूम",
  "Bathroom with a walnut vanity, round backlit mirror and brass tapware":
    "अख़रोट की वैनिटी, गोल बैकलिट शीशे और पीतल के नलों वाला बाथरूम",
  "Bright bathroom with a glass shower screen and a white freestanding bath":
    "काँच के शॉवर स्क्रीन और सफ़ेद फ़्रीस्टैंडिंग बाथटब वाला चमकदार बाथरूम",
  "Beautiful designs, easy to use and super helpful for someone like me with no technical background.":
    "सुंदर डिज़ाइन, इस्तेमाल में आसान और मुझ जैसे बिना तकनीकी जानकारी वाले व्यक्ति के लिए बहुत मददगार।",
  "Bathroom with a dark marble wall, timber vanity and a round mirror":
    "गहरे संगमरमर की दीवार, लकड़ी की वैनिटी और गोल शीशे वाला बाथरूम",
  "The finished bathroom: timber vanity, backlit mirror, walk-in shower and warm stone tiling":
    "तैयार बाथरूम: लकड़ी की वैनिटी, बैकलिट शीशा, वॉक-इन शॉवर और गर्म पत्थर की टाइलें",
  "Reveal the plan or the finished bathroom": "प्लान या तैयार बाथरूम दिखाएँ",
  "Architectural line drawing of the same bathroom, with dimensions":
    "उसी बाथरूम का मापों सहित वास्तुशिल्प रेखाचित्र",
  "Footer": "फ़ुटर",
  "Main": "मुख्य",
  "Replay animation": "एनिमेशन दोबारा चलाएँ",
  "Watch it in motion": "इसे चलते हुए देखें",
  "View in English": "अंग्रेज़ी में देखें",
  "Fixture": "फ़िक्स्चर",
  "A dark, modern bathroom with a glass shower, stone walls and a timber vanity":
    "काँच के शॉवर, पत्थर की दीवारों और लकड़ी की वैनिटी वाला गहरे रंग का आधुनिक बाथरूम",

  /* ── studio — canvas header ─────────────────────────────────────────── */
  "Make it yours.": "इसे अपना बनाएँ।",
  "Move anything. We’ll tell you when something needs more room.":
    "कुछ भी खिसकाएँ। जहाँ ज़्यादा जगह चाहिए, हम बता देंगे।",

  /* ── studio — 3D view ───────────────────────────────────────────────── */
  "no fixtures": "कोई फ़िक्स्चर नहीं",
  "and the door on the": "और दरवाज़ा",
  "wall": "दीवार पर",

  /* ── studio — shops near you (Section D) ────────────────────────────── */
  "Shops near you": "आपके पास की दुकानें",
  "Real, listed dealers for your bathroom, grouped by trade. Call ahead before visiting.":
    "आपके बाथरूम के लिए असली, सूचीबद्ध डीलर, काम के अनुसार समूहित। जाने से पहले कॉल करें।",
  "Near": "पास",
  "approximate": "अनुमानित",
  "Change location": "स्थान बदलें",
  "Finding your city…": "आपका शहर ढूँढ रहे हैं…",
  "Use my location": "मेरा स्थान उपयोग करें",
  "Location unavailable — pick your city": "स्थान उपलब्ध नहीं — अपना शहर चुनें",
  "No listed dealer in your city yet.": "आपके शहर में अभी कोई सूचीबद्ध डीलर नहीं।",
  "Call": "कॉल करें",
  "No phone listed": "कोई फ़ोन सूचीबद्ध नहीं",
  "Map": "मैप",
  "opens in a new tab": "नए टैब में खुलता है",
  "Done": "हो गया",
  "Listings from public sources, collected Sept 2026. Call before visiting.":
    "सार्वजनिक स्रोतों से सूचियाँ, सितंबर 2026 में एकत्रित। जाने से पहले कॉल करें।",
  "Sanitaryware & fittings": "सैनिटरीवेयर और फिटिंग",
  "Tiles & masonry": "टाइलें और चिनाई",
  "Electrical appliances": "बिजली के उपकरण",
  "Switches & wires": "स्विच और तार",
  "Brand store": "ब्रांड स्टोर",
  "Authorised": "अधिकृत",
  "Multi-brand": "मल्टी-ब्रांड",
  "Within 5 km": "5 किमी के भीतर",
  "Nearest within 15 km": "15 किमी के भीतर निकटतम",
  "Across the city": "पूरे शहर में",

  /* ── studio — 3D (WebGL) view ───────────────────────────────────────── */
  "Loading 3D…": "3D लोड हो रहा है…",
  "3D view of your bathroom — drag to rotate, scroll to zoom":
    "आपके बाथरूम का 3D दृश्य — घुमाने के लिए खींचें, ज़ूम के लिए स्क्रॉल करें",
  "3D view unavailable — showing the 2D plan": "3D दृश्य उपलब्ध नहीं — 2D प्लान दिखा रहे हैं",

  /* ── studio — comments (M7 collaboration) ───────────────────────────── */
  "Comments": "टिप्पणियाँ",
  "Member": "सदस्य",
  "No comments yet. Start the conversation.": "अभी कोई टिप्पणी नहीं। बातचीत शुरू करें।",
  "Add a comment for your expert or homeowner…": "अपने विशेषज्ञ या गृहस्वामी के लिए टिप्पणी जोड़ें…",
  "Posting…": "पोस्ट हो रहा है…",
  "Post comment": "टिप्पणी पोस्ट करें",

  /* ── studio — market pricing (Section B, on the estimate screen) ─────── */
  "Market pricing & brands": "बाज़ार मूल्य और ब्रांड",
  "Real 2026 prices, a brand per trade, and labour by city.":
    "असली 2026 कीमतें, हर काम के लिए एक ब्रांड, और शहर अनुसार मज़दूरी।",
  "all-in": "सब मिलाकर",
  "Your brands": "आपके ब्रांड",
  "Mid": "मिड",
  "Value": "वैल्यू",
  "Electrical": "बिजली",
  "Tile look": "टाइल लुक",
  "White": "सफ़ेद",
  "Beige": "बेज",
  "Grey": "ग्रे",
  "Wood": "लकड़ी",
  "Dark": "गहरा",
  "Glossy": "चमकदार",
  "Matt": "मैट",
  "City & labour": "शहर और मज़दूरी",
  "Change": "बदलें",
  "Labour subtotal": "मज़दूरी उप-योग",
  "Plumber": "प्लंबर",
  "Electrician": "इलेक्ट्रीशियन",
  "Floor tiling": "फ़र्श टाइलिंग",
  "Wall tiling": "दीवार टाइलिंग",
  "Mason": "राजमिस्त्री",
  "Market estimate": "बाज़ार अनुमान",
  "researched 2026 prices": "शोधित 2026 कीमतें",
  "set city": "शहर चुनें",
  "Estimated total": "अनुमानित कुल",
  "per sq.ft": "प्रति वर्ग फुट",
  "Indicative 2026 retail estimates. Confirm with your contractor and dealer before purchase.":
    "सांकेतिक 2026 खुदरा अनुमान। खरीद से पहले अपने ठेकेदार और डीलर से पुष्टि करें।",
};
