import { Home, BookOpen, Bell, Image, Info } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Language, translations } from "../lib/translations";

export type TabType = "Home" | "Classes" | "Notice" | "Gallery" | "About" | "Inbox" | "Globe" | "Profile" | "AI";

interface NavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  hasNewNotices?: boolean;
  language: Language;
}

export default function Navigation({ activeTab, setActiveTab, hasNewNotices, language }: NavigationProps) {
  const t = translations[language];
  
  const tabs = [
    { id: "Home" as TabType, icon: Home, label: t.home, path: "/" },
    { id: "Classes" as TabType, icon: BookOpen, label: t.classes, path: "/classes" },
    { id: "Notice" as TabType, icon: Bell, label: t.notice, path: "/notice" },
    { id: "Gallery" as TabType, icon: Image, label: t.gallery, path: "/gallery" },
    { id: "About" as TabType, icon: Info, label: t.about, path: "/about" },
  ];

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md glass rounded-full px-2 py-2 flex items-center justify-between z-50">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <Link
            key={tab.id}
            to={tab.path}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex flex-col items-center justify-center py-2 px-4 rounded-full transition-all duration-300 haptic-glow ${
              isActive ? "text-emerald-700" : "text-slate-500 hover:text-emerald-600"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-white/40 rounded-full -z-10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <Icon className={`w-5 h-5 ${isActive ? "scale-110" : ""}`} />
            {tab.id === "Notice" && hasNewNotices && (
              <span className="absolute top-2 right-4 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse" />
            )}
            <span className="text-[10px] font-medium mt-1">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
