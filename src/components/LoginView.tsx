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
  const [step, setStep] = useState<"google" | "portal" | "details" | "loading">("google");
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(null);
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
    if (googleUser) {
      setName(googleUser.displayName || "");
    }
  }, [googleUser]);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add("dark-mode");
      document.body.classList.remove("light-mode");
    } else {
      document.body.classList.add("light-mode");
      document.body.classList.remove("dark-mode");
    }
  }, [isDarkMode]);

  const handleGoogleSignIn = async () => {
    setError("");
    setStep("loading");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setGoogleUser(result.user);
      setTimeout(() => setStep("portal"), 1500); // Smooth transition
    } catch (err: any) {
      setError(err.message);
      setStep("google");
    }
  };

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setStep("details");
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!googleUser) return;

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
      const existingUser = savedUsers.find((u: any) => u.uid === googleUser.uid);
      if (existingUser?.password && loginPassword !== existingUser.password) {
        setError("Invalid Password");
        return;
      }

      onLogin({ 
        uid: googleUser.uid,
        name: name, 
        role, 
        className, 
        section,
        email: googleUser.email || "", 
        photoURL: googleUser.photoURL || "",
        rollId 
      });
    } else if (role === "Teacher") {
      if (!name.trim() || !designation.trim() || !phone.trim() || !pin.trim()) {
        setError(t.pleaseFillAllFields);
        return;
      }

      // Check for custom password
      const savedUsers = JSON.parse(localStorage.getItem("app_users") || "[]");
      const existingUser = savedUsers.find((u: any) => u.uid === googleUser.uid);
      if (existingUser?.password && loginPassword !== existingUser.password) {
        setError("Invalid Password");
        return;
      }

      if (pin === "1234") {
        onLogin({ 
          uid: googleUser.uid,
          name: name, 
          role, 
          className: "Admin", 
          email: googleUser.email || "", 
          photoURL: googleUser.photoURL || "",
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
        {step === "google" && (
          <motion.div
            key="google"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md space-y-8 text-center"
          >
            <div className="space-y-4">
              <h1 className="text-5xl font-black text-emerald-900 tracking-tighter">TNHS ELITE ASK</h1>
              <p className="text-emerald-800/60 font-medium text-lg">{t.academicExperience}</p>
            </div>

            <GlassCard className="p-10 space-y-8 border-emerald-500/20 shadow-2xl">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-emerald-900">{t.welcome}</h2>
                <p className="text-sm text-emerald-700/60">{t.pleaseSignIn}</p>
              </div>

              <button 
                onClick={handleGoogleSignIn}
                className="w-full py-4 rounded-2xl bg-white border border-emerald-500/30 flex items-center justify-center gap-4 text-emerald-900 font-bold hover:bg-emerald-50 transition-all shadow-lg shadow-emerald-100 group"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
                {t.signInWithGoogle}
              </button>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm font-medium bg-red-50 p-3 rounded-xl border border-red-100">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </GlassCard>
            
            <p className="text-[10px] text-emerald-700/40 uppercase font-black tracking-[0.2em]">Powered by TNHS ELITE TEAM</p>
          </motion.div>
        )}

        {step === "portal" && (
          <motion.div
            key="portal"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-md space-y-8"
          >
            <div className="text-center">
              <div className="w-16 h-16 rounded-full glass mx-auto mb-4 p-1">
                <img src={googleUser?.photoURL || ""} alt="Profile" className="w-full h-full rounded-full object-cover" />
              </div>
              <h2 className="text-3xl font-bold text-emerald-900">{t.hi}, {googleUser?.displayName?.split(" ")[0]}</h2>
              <p className="text-emerald-800/60">{t.selectPortal}</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <GlassCard 
                onClick={() => handleRoleSelect("Student")}
                className="flex flex-col items-center gap-4 py-10 group haptic-glow cursor-pointer border-emerald-500/10"
              >
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-8 h-8 text-emerald-700" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-emerald-900">{t.studentPortal}</h3>
                  <p className="text-sm text-emerald-700/60">{t.accessResources}</p>
                </div>
              </GlassCard>

              <GlassCard 
                onClick={() => handleRoleSelect("Teacher")}
                className="flex flex-col items-center gap-4 py-10 group haptic-glow cursor-pointer border-emerald-500/10"
              >
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <User className="w-8 h-8 text-emerald-700" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-emerald-900">{t.teacherPortal}</h3>
                  <p className="text-sm text-emerald-700/60">{t.adminPortal}</p>
                </div>
              </GlassCard>
            </div>
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
                      const existingUser = savedUsers.find((u: any) => u.uid === googleUser?.uid);
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
                      const existingUser = savedUsers.find((u: any) => u.uid === googleUser?.uid);
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
