import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "report_issue": "Report a Road Issue",
      "help_text": "Help us identify and fix infrastructure problems",
      "full_name": "Full Name",
      "email_address": "Email Address",
      "issue_type": "Issue Type",
      "pothole": "Pothole",
      "crack": "Crack / Surface Damage",
      "drainage": "Drainage Problem",
      "signage": "Damaged Signage",
      "other": "Other",
      "description": "Description",
      "upload_image": "Upload Image",
      "click_upload": "Click to upload",
      "location": "Location (GPS or Manual Address)",
      "get_gps": "Get GPS Coordinates",
      "submit": "Submit Issue Report",
      "submitting": "Submitting...",
      "emergency": "🚨 EMERGENCY REPORT (High Priority)",
      "emergency_desc": "Only use for severe safety hazards",
      "admin_dashboard": "Admin Dashboard",
      "home": "Home",
      "map": "Public Map",
      "worker": "Worker Dashboard",
      "language": "Language"
    }
  },
  ta: {
    translation: {
      "report_issue": "சாலை சிக்கலைப் புகாரளிக்கவும்",
      "help_text": "உள்கட்டமைப்பு சிக்கல்களை அடையாளம் காணவும் சரிசெய்யவும் எங்களுக்கு உதவுங்கள்",
      "full_name": "முழு பெயர்",
      "email_address": "மின்னஞ்சல் முகவரி",
      "issue_type": "சிக்கல் வகை",
      "pothole": "பள்ளம்",
      "crack": "விரிசல் / சேதம்",
      "drainage": "வடிகால் பிரச்சனை",
      "signage": "சேதமடைந்த அறிவிப்பு பலகை",
      "other": "மற்றவை",
      "description": "விளக்கம்",
      "upload_image": "படத்தைப் பதிவேற்றவும்",
      "click_upload": "பதிவேற்ற கிளிக் செய்யவும்",
      "location": "இடம் (ஜிபிஎஸ் அல்லது முகவரி)",
      "get_gps": "ஜிபிஎஸ் பெறுங்கள்",
      "submit": "புகாரை சமர்ப்பிக்கவும்",
      "submitting": "சமர்ப்பிக்கிறது...",
      "emergency": "🚨 அவசர அறிக்கை (அதிக முன்னுரிமை)",
      "emergency_desc": "கடுமையான பாதுகாப்பு அபாயங்களுக்கு மட்டுமே பயன்படுத்தவும்",
      "admin_dashboard": "நிர்வாகி டாஷ்போர்டு",
      "home": "முகப்பு",
      "map": "பொது வரைபடம்",
      "worker": "பணியாளர் டாஷ்போர்டு",
      "language": "மொழி"
    }
  },
  hi: {
    translation: {
      "report_issue": "सड़क समस्या की रिपोर्ट करें",
      "help_text": "बुनियादी ढांचे की समस्याओं को पहचानने और ठीक करने में हमारी सहायता करें",
      "full_name": "पूरा नाम",
      "email_address": "ईमेल पता",
      "issue_type": "समस्या का प्रकार",
      "pothole": "गड्ढा",
      "crack": "दरार / सतह की क्षति",
      "drainage": "जल निकासी की समस्या",
      "signage": "क्षतिग्रस्त साइनबोर्ड",
      "other": "अन्य",
      "description": "विवरण",
      "upload_image": "छवि अपलोड करें",
      "click_upload": "अपलोड करने के लिए क्लिक करें",
      "location": "स्थान (जीपीएस या पता)",
      "get_gps": "जीपीएस निर्देशांक प्राप्त करें",
      "submit": "रिपोर्ट जमा करें",
      "submitting": "जमा हो रहा है...",
      "emergency": "🚨 आपात स्थिति (उच्च प्राथमिकता)",
      "emergency_desc": "केवल गंभीर सुरक्षा खतरों के लिए उपयोग करें",
      "admin_dashboard": "एडमिन डैशबोर्ड",
      "home": "होम",
      "map": "सार्वजनिक नक्शा",
      "worker": "कार्यकर्ता डैशबोर्ड",
      "language": "भाषा"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en", // default language
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
