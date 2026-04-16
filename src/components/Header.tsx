import { useState, useRef, useEffect } from "react";
import { School, Bell, X, Shield, User as UserIcon, Check, Moon, Sun, Languages, LogOut, ChevronDown, Mail, Globe, Lock as LockIcon } from "lucide-react";
import { UserData } from "../App";
import { TabType } from "./Navigation";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import { Language, translations } from "../lib/translations";

interface HeaderProps {
  user: UserData;
  onNoticeClick: () => void;
  hasNewNotices: boolean;
  language: Language;
  setLanguage: (lang: Language) => void;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  onLogout: () => void;
  setActiveTab: (tab: TabType) => void;
  activeTab: TabType;
  onOpenAdminPortal: () => void;
  onDirectRoleSwitch: () => void;
  onChangePassword: () => void;
  isSuperAdmin?: boolean;
}

export default function Header({ 
  user, 
  onNoticeClick, 
  hasNewNotices, 
  language,
  setLanguage,
  isDarkMode,
  setIsDarkMode,
  onLogout,
  setActiveTab,
  activeTab,
  onOpenAdminPortal,
  onDirectRoleSwitch,
  onChangePassword,
  isSuperAdmin = false
}: HeaderProps) {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const t = translations[language];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] px-6 py-4">
      <div className="max-w-4xl mx-auto glass rounded-[24px] px-4 py-3 flex items-center justify-between border-white/40 shadow-2xl backdrop-blur-xl relative">
        {/* Top Left: Profile Pic & Info */}
        <div className="relative" ref={dropdownRef}>
          <div className="flex items-center gap-1">
            <Link 
              to="/profile"
              onClick={() => setActiveTab("Profile")}
              className="flex items-center gap-3 group pointer-events-auto"
            >
              <div className="w-10 h-10 rounded-full border-2 border-emerald-500/30 overflow-hidden shadow-lg group-hover:scale-110 transition-transform">
                <img 
                  src={user.photoURL} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-emerald-900 leading-tight whitespace-nowrap">{user.name}</p>
                <p className="text-[10px] text-emerald-700/60 font-black flex items-center gap-1">
                  {user.role === "Student" ? `${t.rollLabel}${user.rollId}` : user.designation}
                </p>
              </div>
            </Link>
            <button 
              onClick={(e) => {
                e.preventDefault();
                setShowProfileDropdown(!showProfileDropdown);
              }}
              className="p-1 hover:bg-white/20 rounded-lg text-emerald-700/60"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${showProfileDropdown ? "rotate-180" : ""}`} />
            </button>
          </div>

          {/* Profile Dropdown */}
          <AnimatePresence>
            {showProfileDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                className="absolute top-full left-0 mt-4 w-56 p-3 rounded-3xl border border-white/40 shadow-2xl z-[120] backdrop-blur-[25px] bg-white/70 will-change-transform"
              >
                <div className="space-y-1">
                  {/* Theme Toggle */}
                  <button 
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-white/20 text-emerald-900 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                      <span className="text-xs font-bold">{t.darkTheme}</span>
                    </div>
                    <div className={`w-8 h-4 rounded-full relative transition-colors ${isDarkMode ? "bg-emerald-600" : "bg-gray-300"}`}>
                      <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${isDarkMode ? "right-0.5" : "left-0.5"}`} />
                    </div>
                  </button>

                  {/* Language Switch */}
                  <button 
                    onClick={() => setLanguage(language === "EN" ? "BN" : "EN")}
                    className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-white/20 text-emerald-900 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <Languages className="w-4 h-4" />
                      <span className="text-xs font-bold">{t.language}</span>
                    </div>
                    <span className="text-[10px] font-black bg-emerald-500/20 px-2 py-0.5 rounded-lg text-emerald-700">
                      {language}
                    </span>
                  </button>

                  <div className="h-px bg-white/20 my-2 mx-2" />

                  {/* Change Password - Hidden for Students */}
                  {user.role !== "Student" && (
                    <button 
                      onClick={() => {
                        setShowProfileDropdown(false);
                        onChangePassword();
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/20 text-emerald-900 transition-all"
                    >
                      <LockIcon className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold">Change Password</span>
                    </button>
                  )}

                  {/* Switch Role */}
                  <button 
                    onClick={() => {
                      setShowProfileDropdown(false);
                      onDirectRoleSwitch();
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/20 text-emerald-900 transition-all"
                  >
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold">Switch Role</span>
                  </button>

                  <div className="h-px bg-white/20 my-2 mx-2" />

                  {/* Log Out */}
                  <button 
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-red-500/10 text-red-600 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-xs font-bold">{t.logout}</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Top Right: Icons */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Link 
              to="/notice"
              onClick={() => onNoticeClick()}
              className={`p-2 rounded-xl transition-all relative ${activeTab === "Notice" ? "bg-emerald-600 text-white shadow-lg" : "hover:bg-white/20 text-emerald-900"}`}
            >
              <Bell className="w-5 h-5" />
              {hasNewNotices && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse" />
              )}
            </Link>
            <Link 
              to="/inbox"
              onClick={() => setActiveTab("Inbox")}
              className={`p-2 rounded-xl transition-all ${activeTab === "Inbox" ? "bg-emerald-600 text-white shadow-lg" : "hover:bg-white/20 text-emerald-900"}`}
            >
              <Mail className="w-5 h-5" />
            </Link>
            <Link 
              to="/globe"
              onClick={() => setActiveTab("Globe")}
              className={`p-2 rounded-xl transition-all ${activeTab === "Globe" ? "bg-emerald-600 text-white shadow-lg" : "hover:bg-white/20 text-emerald-900"}`}
            >
              <Globe className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
