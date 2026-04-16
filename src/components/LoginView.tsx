import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { User, GraduationCap, ChevronRight, AlertCircle, Moon, Sun, LogIn, Languages } from "lucide-react";
import GlassCard from "./GlassCard";
import { auth, googleProvider } from "../firebase";
import { signInWithPopup, User as FirebaseUser } from "firebase/auth";
import { Language, translations } from "../lib/translations";

export type UserRole = "Student" | "Teacher";

interface LoginViewProps {
  onLogin: (userData: { 
    uid: string;
    name: string; 
    role: UserRole; 
    className?: string; 
    section?: string;
    email: string;
    photoURL: string;
    rollId?: string;
    designation?: string;
    phone?: string;
  }) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  language: Language;
}

export default function LoginView({ onLogin, isDarkMode, toggleDarkMode, language }: LoginViewProps) {
  const [step, setStep] = useState<"portal" | "details" | "loading">("portal");
  const [tempUid, setTempUid] = useState(() => "user_" + Math.random().toString(36).substring(2, 11));
  const [role, setRole] = useState<UserRole | null>(null);
  const [name, setName] = useState("");
  
  const [className, setClassName] = useState("6");
  const [section, setSection] = useState("");
  const [rollId, setRollId] = useState("");
  const [designation, setDesignation] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [error, setError] = useState("");

  const t = translations[language];

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add("dark-mode");
      document.body.classList.remove("light-mode");
    } else {
      document.body.classList.add("light-mode");
      document.body.classList.remove("dark-mode");
    }
  }, [isDarkMode]);

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setStep("details");
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (role === "Student") {
      if (!name.trim()) {
        setError(t.pleaseEnterName);
        return;
      }
      if (!rollId.trim()) {
        setError(t.pleaseEnterRoll);
        return;
      }
      if (!section.trim()) {
        setError(t.pleaseEnterSection);
        return;
      }

      // Check for custom password
      const savedUsers = JSON.parse(localStorage.getItem("app_users") || "[]");
      const existingUser = savedUsers.find((u: any) => u.name === name && u.rollId === rollId);
      if (existingUser?.password && loginPassword !== existingUser.password) {
        setError("Invalid Password");
        return;
      }

      onLogin({ 
        uid: existingUser?.uid || tempUid,
        name: name, 
        role, 
        className, 
        section,
        email: existingUser?.email || `${name.toLowerCase().replace(/\s+/g, '.')}@tnhs.elite`, 
        photoURL: existingUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
        rollId 
      });
    } else if (role === "Teacher") {
      if (!name.trim() || !designation.trim() || !phone.trim() || !pin.trim()) {
        setError(t.pleaseFillAllFields);
        return;
      }

      // Check for custom password
      const savedUsers = JSON.parse(localStorage.getItem("app_users") || "[]");
      const existingUser = savedUsers.find((u: any) => u.name === name && u.phone === phone);
      if (existingUser?.password && loginPassword !== existingUser.password) {
        setError("Invalid Password");
        return;
      }

      if (pin === "1234") {
        onLogin({ 
          uid: existingUser?.uid || tempUid,
          name: name, 
          role, 
          className: "Admin", 
          email: existingUser?.email || `${name.toLowerCase().replace(/\s+/g, '.')}@tnhs.elite`, 
          photoURL: existingUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
          designation, 
          phone 
        });
      } else {
        setError(t.invalidPin);
      }
    }
  };

  const LoadingScreen = () => (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="relative w-24 h-24">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-4 border-emerald-500/20 border-t-emerald-500"
        />
        <div className="absolute inset-2 glass rounded-full flex items-center justify-center">
          <div className="w-4 h-4 bg-emerald-500 rounded-full animate-pulse" />
        </div>
      </div>
      <p className="mt-6 text-emerald-900 font-bold animate-pulse">{t.syncing}</p>
    </div>
  );

  if (step === "loading") return <LoadingScreen />;

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-400/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[120px]" />

      <button 
        onClick={toggleDarkMode}
        className="absolute top-8 right-8 w-12 h-12 rounded-full glass flex items-center justify-center text-emerald-700 hover:scale-110 transition-transform z-50"
      >
        {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
      </button>

      <AnimatePresence mode="wait">
        {step === "portal" && (
          <motion.div
            key="portal"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-md space-y-8"
          >
            <div className="text-center space-y-4">
              <h1 className="text-5xl font-black text-emerald-900 tracking-tighter">TNHS ELITE ASK</h1>
              <p className="text-emerald-800/60 font-medium text-lg">{t.academicExperience}</p>
              <div className="pt-4">
                <h2 className="text-2xl font-bold text-emerald-900">{t.welcome}</h2>
                <p className="text-emerald-800/60">{t.selectPortal}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <GlassCard 
                onClick={() => {
                  signInWithPopup(auth, googleProvider).then((result) => {
                    const user = result.user;
                    onLogin({
                      uid: user.uid,
                      name: user.displayName || "Google User",
                      role: "Student", // Default to student, can be changed
                      email: user.email || "",
                      photoURL: user.photoURL || ""
                    });
                  }).catch(err => {
                    console.error("Google Sign-in failed:", err);
                    setError("Google Sign-in failed. Please try again.");
                  });
                }}
                className="flex items-center gap-4 p-6 group haptic-glow cursor-pointer border-emerald-500/10 bg-white/40"
              >
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
                  <svg viewBox="0 0 24 24" className="w-6 h-6">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-emerald-900">Continue with Google</h3>
                  <p className="text-xs text-emerald-700/60">Fast & Secure Authentication</p>
                </div>
              </GlassCard>

              <div className="flex items-center gap-4">
                <div className="h-[1px] flex-1 bg-emerald-900/10" />
                <span className="text-[10px] font-bold text-emerald-700/40 uppercase">Or use Portal ID</span>
                <div className="h-[1px] flex-1 bg-emerald-900/10" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <GlassCard 
                  onClick={() => handleRoleSelect("Student")}
                  className="flex flex-col items-center gap-3 py-6 group haptic-glow cursor-pointer border-emerald-500/10"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <GraduationCap className="w-6 h-6 text-emerald-700" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-sm font-bold text-emerald-900">{t.studentPortal}</h3>
                  </div>
                </GlassCard>

                <GlassCard 
                  onClick={() => handleRoleSelect("Teacher")}
                  className="flex flex-col items-center gap-3 py-6 group haptic-glow cursor-pointer border-emerald-500/10"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <User className="w-6 h-6 text-emerald-700" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-sm font-bold text-emerald-900">{t.teacherPortal}</h3>
                  </div>
                </GlassCard>
              </div>
            </div>
            
            <p className="text-center text-[10px] text-emerald-700/40 uppercase font-black tracking-[0.2em]">Powered by TNHS ELITE TEAM</p>
          </motion.div>
        )}

        {step === "details" && (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-md"
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-emerald-900 mb-2">{role === "Student" ? t.studentPortal : t.teacherPortal}</h1>
              <p className="text-emerald-800/60">{t.finalizeProfile}</p>
            </div>

            <GlassCard className="p-8 space-y-6 border-emerald-500/20">
              <form onSubmit={handleFinalSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-emerald-800 uppercase ml-1 tracking-wider">{t.name}</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.enterName}
                    className="w-full px-4 py-4 rounded-2xl bg-white/30 border border-emerald-500/30 focus:bg-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-emerald-900 placeholder:text-emerald-900/30"
                  />
                </div>
                {role === "Student" ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-emerald-800 uppercase ml-1 tracking-wider">{t.roll}</label>
                      <input
                        type="text"
                        value={rollId}
                        onChange={(e) => setRollId(e.target.value)}
                        placeholder={t.enterRoll}
                        className="w-full px-4 py-4 rounded-2xl bg-white/30 border border-emerald-500/30 focus:bg-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-emerald-900 placeholder:text-emerald-900/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-emerald-800 uppercase ml-1 tracking-wider">{t.classes}</label>
                      <select
                        value={className}
                        onChange={(e) => setClassName(e.target.value)}
                        className="w-full px-4 py-4 rounded-2xl bg-white/30 border border-emerald-500/30 focus:bg-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-emerald-900 appearance-none"
                      >
                        {Array.from({ length: 5 }, (_, i) => i + 6).map((num) => (
                          <option key={num} value={num}>{t.classLabel}{num}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-emerald-800 uppercase ml-1 tracking-wider">{t.section}</label>
                      <input
                        type="text"
                        value={section}
                        onChange={(e) => setSection(e.target.value)}
                        placeholder={t.enterSection}
                        className="w-full px-4 py-4 rounded-2xl bg-white/30 border border-emerald-500/30 focus:bg-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-emerald-900 placeholder:text-emerald-900/30"
                      />
                    </div>
                    {/* Custom Password Field if exists */}
                    {(() => {
                      const savedUsers = JSON.parse(localStorage.getItem("app_users") || "[]");
                      const existingUser = savedUsers.find((u: any) => u.name === name && u.rollId === rollId);
                      if (existingUser?.password) {
                        return (
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-emerald-800 uppercase ml-1 tracking-wider">Login Password</label>
                            <input
                              type="password"
                              value={loginPassword}
                              onChange={(e) => setLoginPassword(e.target.value)}
                              placeholder="Enter your custom password"
                              className="w-full px-4 py-4 rounded-2xl bg-white/30 border border-emerald-500/30 focus:bg-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-emerald-900 placeholder:text-emerald-900/30"
                            />
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-emerald-800 uppercase ml-1 tracking-wider">{t.designation}</label>
                      <input
                        type="text"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        placeholder={t.enterDesignation}
                        className="w-full px-4 py-4 rounded-2xl bg-white/30 border border-emerald-500/30 focus:bg-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-emerald-900 placeholder:text-emerald-900/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-emerald-800 uppercase ml-1 tracking-wider">{t.phoneNumber}</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder={t.enterPhone}
                        className="w-full px-4 py-4 rounded-2xl bg-white/30 border border-emerald-500/30 focus:bg-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-emerald-900 placeholder:text-emerald-900/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-emerald-800 uppercase ml-1 tracking-wider">{t.secretPin}</label>
                      <input
                        type="password"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        placeholder={t.enterPin}
                        className="w-full px-4 py-4 rounded-2xl bg-white/30 border border-emerald-500/30 focus:bg-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-emerald-900 placeholder:text-emerald-900/30"
                      />
                    </div>
                    {/* Custom Password Field if exists */}
                    {(() => {
                      const savedUsers = JSON.parse(localStorage.getItem("app_users") || "[]");
                      const existingUser = savedUsers.find((u: any) => u.name === name && u.phone === phone);
                      if (existingUser?.password) {
                        return (
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-emerald-800 uppercase ml-1 tracking-wider">Login Password</label>
                            <input
                              type="password"
                              value={loginPassword}
                              onChange={(e) => setLoginPassword(e.target.value)}
                              placeholder="Enter your custom password"
                              className="w-full px-4 py-4 rounded-2xl bg-white/30 border border-emerald-500/30 focus:bg-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-emerald-900 placeholder:text-emerald-900/30"
                            />
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-red-600 text-sm font-medium bg-red-50/50 p-3 rounded-xl border border-red-100"
                  >
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </motion.div>
                )}

                <button
                  type="submit"
                  className="w-full py-4 rounded-2xl bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2 group haptic-glow"
                >
                  {t.completeEntry}
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                
                <button 
                  type="button"
                  onClick={() => setStep("portal")}
                  className="w-full py-2 text-emerald-700/60 text-xs font-bold uppercase tracking-widest hover:text-emerald-700 transition-colors"
                >
                  {t.changePortal}
                </button>
              </form>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
