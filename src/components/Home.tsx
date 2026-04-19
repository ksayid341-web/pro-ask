import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { UserData, NoticeItem } from "../App";
import { Language, TranslationType, translations } from "../lib/translations";
import GlassCard from "./GlassCard";
import { School, Users, Star, Calendar, Edit2, LayoutGrid, ChevronDown, Trash2, Clock, BarChart3, Bell, Camera, Heart } from "lucide-react";
import { db } from "../firebase";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";

interface Post {
  id: string;
  imageUrl: string;
  userName: string;
  caption: string;
  timestamp: any;
}

interface HomeProps {
  user: UserData;
  language: Language;
  heroBannerUrl: string | null;
  schoolStatus: string;
  statusColors: Record<string, string>;
  statusGlows: Record<string, string>;
  statusLabels: Record<string, string>;
  notices: NoticeItem[];
  showQuickActions: boolean;
  setShowQuickActions: (show: boolean) => void;
  isEditingExam: boolean;
  setIsEditingExam: (edit: boolean) => void;
  examTargetDate: string;
  setExamTargetDate: (date: string) => void;
  handleUpdateExamDate: (date: string) => void;
  timeLeft: { days: number; hours: number; minutes: number; seconds: number };
  upcomingEvent: { title: string; description: string };
  setUpcomingEvent: (event: { title: string; description: string }) => void;
  isEditingEvent: boolean;
  setIsEditingEvent: (edit: boolean) => void;
  handleUpdateEvent: (title: string, description: string) => void;
  setActiveTab: (tab: string) => void;
  handleUpdateBanner: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleUpdateSchoolStatus: (status: string) => void;
  handleDeleteBanner: () => void;
}

export default React.memo(function Home({ 
  user, 
  language, 
  heroBannerUrl, 
  schoolStatus,
  statusColors,
  statusGlows,
  statusLabels,
  notices,
  showQuickActions,
  setShowQuickActions,
  isEditingExam,
  setIsEditingExam,
  examTargetDate,
  setExamTargetDate,
  handleUpdateExamDate,
  timeLeft,
  upcomingEvent,
  setUpcomingEvent,
  isEditingEvent,
  setIsEditingEvent,
  handleUpdateEvent,
  setActiveTab,
  handleUpdateBanner,
  handleUpdateSchoolStatus,
  handleDeleteBanner
}: HomeProps) {
  const t: TranslationType = translations[language];
  const [counts, setCounts] = useState({ students: 0, teachers: 0 });
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);

  useEffect(() => {
    // Real-time listener for the community feed on Home
    const q = query(
      collection(db, "posts"),
      orderBy("timestamp", "desc"),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      
      // Sort handling for local vs server timestamps
      const sortedPosts = posts.sort((a, b) => {
        const timeA = a.timestamp?.toMillis?.() || Date.now();
        const timeB = b.timestamp?.toMillis?.() || Date.now();
        return timeB - timeA;
      });

      setRecentPosts(sortedPosts);
    }, (error) => {
      console.error("Error fetching home posts:", error);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const savedUsers = JSON.parse(localStorage.getItem("app_users") || "[]");
    const students = savedUsers.filter((u: any) => u.role === "Student").length;
    const teachers = savedUsers.filter((u: any) => u.role === "Teacher").length;
    setCounts({ students, teachers });
  }, []);

  return (
    <div className="space-y-8 pb-32">
      {/* News Ticker */}
      <div className="glass rounded-2xl overflow-hidden py-3 px-4 flex items-center gap-4">
        <div className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg uppercase shrink-0">News</div>
        <div className="relative flex-1 overflow-hidden h-5">
          <motion.div 
            animate={{ x: ["100%", "-100%"] }}
            transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
            className="whitespace-nowrap text-sm font-medium text-emerald-900 absolute"
          >
            {notices?.length > 0 ? notices.map(n => n.title).join(" • ") : "Welcome to TNHS ELITE ASK"}
          </motion.div>
        </div>
      </div>

      {/* Hero Banner / Welcome Section */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative rounded-[32px] overflow-hidden shadow-2xl border border-white/40 group"
        style={{ height: "240px" }}
      >
        {heroBannerUrl ? (
          <img 
            src={heroBannerUrl} 
            alt="School Banner" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-emerald-600" />
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        {/* Welcome Text */}
        <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-lg">
              Welcome back, {user.name}
            </h2>
            <p className="text-white/80 text-sm font-bold uppercase tracking-widest drop-shadow-md">
              {user.role === "Teacher" ? "Administrator Access" : `Class ${user.className} Student`}
            </p>
          </div>
        </div>
      </motion.div>

      {/* School Status Banner */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-6 rounded-[32px] glass border-white/40 flex flex-col gap-6 relative shadow-2xl backdrop-blur-2xl z-20"
      >
        <div className="flex items-center gap-6">
          <div className="relative shrink-0">
            <motion.div 
              animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.1, 0.3] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className={`absolute inset-[-12px] rounded-full ${statusColors[schoolStatus]} blur-xl`}
            />
            <motion.div 
              animate={{ scale: [1, 1.8, 1], opacity: [0.2, 0, 0.2] }}
              transition={{ repeat: Infinity, duration: 3, delay: 0.5, ease: "easeInOut" }}
              className={`absolute inset-[-20px] rounded-full ${statusColors[schoolStatus]} blur-2xl`}
            />
            <div className={`w-16 h-16 rounded-full ${statusColors[schoolStatus]} ${statusGlows[schoolStatus]} relative z-10 flex items-center justify-center border-4 border-white/20`}>
              <div className="w-4 h-4 rounded-full bg-white/40 animate-pulse" />
            </div>
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-3">
              <h4 className="text-xl font-black text-emerald-900 tracking-tight">
                {schoolStatus}
              </h4>
              {schoolStatus === "Class Ongoing" && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 text-[10px] font-black uppercase tracking-widest animate-pulse border border-red-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                  Live
                </span>
              )}
            </div>
            <p className="text-sm text-emerald-800/70 font-bold leading-tight">
              {schoolStatus === "Tiffin Time" ? "Break is active. Students are in the playground." : 
               schoolStatus === "School Closed" ? "The campus is currently closed for the day." :
               schoolStatus === "Occasion Running" ? "A special event is currently being celebrated." :
               "Academic sessions are proceeding as scheduled."}
            </p>
          </div>
        </div>

        {user.role === "Teacher" && (
          <div className="relative pt-4 border-t border-emerald-500/10">
            <button 
              onClick={() => setShowQuickActions(!showQuickActions)}
              className="w-full py-4 px-6 rounded-2xl bg-emerald-600 text-white font-black uppercase tracking-widest flex items-center justify-between shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all haptic-glow"
            >
              <div className="flex items-center gap-3">
                <LayoutGrid className="w-5 h-5" />
                <span>Quick Actions</span>
              </div>
              <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${showQuickActions ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {showQuickActions && (
                <motion.div
                  initial={{ opacity: 0, scaleY: 0, originY: 0 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  exit={{ opacity: 0, scaleY: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden will-change-transform"
                >
                  <div className="grid grid-cols-2 gap-3 pt-4">
                    <button 
                      onClick={() => handleUpdateSchoolStatus("Class Ongoing")}
                      className="p-4 rounded-2xl glass border-emerald-500/20 text-emerald-900 font-bold text-xs flex flex-col items-center gap-2 hover:bg-emerald-500/10 transition-all"
                    >
                      <Clock className="w-5 h-5 text-emerald-600" />
                      Class Ongoing
                    </button>
                    <button 
                      onClick={() => handleUpdateSchoolStatus("Tiffin Time")}
                      className="p-4 rounded-2xl glass border-emerald-500/20 text-emerald-900 font-bold text-xs flex flex-col items-center gap-2 hover:bg-emerald-500/10 transition-all"
                    >
                      <Clock className="w-5 h-5 text-amber-600" />
                      Tiffin
                    </button>
                    <button 
                      onClick={() => handleUpdateSchoolStatus("School Closed")}
                      className="p-4 rounded-2xl glass border-emerald-500/20 text-emerald-900 font-bold text-xs flex flex-col items-center gap-2 hover:bg-emerald-500/10 transition-all"
                    >
                      <Clock className="w-5 h-5 text-red-600" />
                      Closed
                    </button>
                    <button 
                      onClick={() => handleUpdateSchoolStatus("Occasion Running")}
                      className="p-4 rounded-2xl glass border-emerald-500/20 text-emerald-900 font-bold text-xs flex flex-col items-center gap-2 hover:bg-emerald-500/10 transition-all"
                    >
                      <Clock className="w-5 h-5 text-purple-600" />
                      Occasion
                    </button>
                    <label className="p-4 rounded-2xl glass border-emerald-500/20 text-emerald-900 font-bold text-xs flex flex-col items-center gap-2 hover:bg-emerald-500/10 transition-all cursor-pointer">
                      <input type="file" className="hidden" onChange={handleUpdateBanner} />
                      <Camera className="w-5 h-5 text-emerald-600" />
                      Upload Banner
                    </label>
                    <button 
                      onClick={handleDeleteBanner}
                      className="p-4 rounded-2xl glass border-emerald-500/20 text-red-600 font-bold text-xs flex flex-col items-center gap-2 hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                      Delete Banner
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        
        <div className={`absolute right-0 top-0 bottom-0 w-2 ${statusColors[schoolStatus]}`} />
      </motion.div>

      {/* Upcoming Event Card */}
      <GlassCard className="relative overflow-hidden border-emerald-500/30">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-700">
              <Calendar className="w-5 h-5" />
              <span className="font-bold uppercase tracking-wider text-xs">{t.upcomingEvent}</span>
            </div>
            <AnimatePresence>
              {user.role === "Teacher" && (
                <motion.button 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setIsEditingEvent(!isEditingEvent)}
                  className="p-2 rounded-lg hover:bg-white/40 transition-colors"
                >
                  <Edit2 className="w-4 h-4 text-emerald-700" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
          
          {isEditingEvent ? (
            <div className="space-y-3">
              <input 
                type="text"
                value={upcomingEvent.title}
                onChange={(e) => setUpcomingEvent({ ...upcomingEvent, title: e.target.value })}
                placeholder="Event Title"
                className="w-full bg-white/30 border border-emerald-500/30 rounded-xl px-4 py-2 text-emerald-900 focus:outline-none font-bold"
              />
              <textarea 
                value={upcomingEvent.description}
                onChange={(e) => setUpcomingEvent({ ...upcomingEvent, description: e.target.value })}
                placeholder="Event Description"
                className="w-full bg-white/30 border border-emerald-500/30 rounded-xl px-4 py-2 text-emerald-900 focus:outline-none text-sm h-24"
              />
              <button 
                onClick={() => handleUpdateEvent(upcomingEvent.title, upcomingEvent.description)}
                className="w-full py-2 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
              >
                Save Event
              </button>
            </div>
          ) : (
            <>
              <h3 className="text-2xl font-bold text-emerald-900">{upcomingEvent.title}</h3>
              <p className="text-emerald-800/70">{upcomingEvent.description}</p>
              <button className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-colors">
                {t.viewSchedule}
              </button>
            </>
          )}
        </div>
        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-emerald-400/20 rounded-full blur-3xl" />
      </GlassCard>

      {/* Exam Countdown */}
      <GlassCard className="relative overflow-hidden border-emerald-500/30">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-700">
              <span className="font-bold uppercase tracking-wider text-xs">{t.sscCountdown}</span>
            </div>
            {user.role === "Teacher" && (
              <button 
                onClick={() => setIsEditingExam(!isEditingExam)}
                className="p-2 rounded-lg hover:bg-white/40 transition-colors"
              >
                <Edit2 className="w-4 h-4 text-emerald-700" />
              </button>
            )}
          </div>

          {isEditingExam ? (
            <div className="flex gap-2">
              <input 
                type="datetime-local"
                defaultValue={examTargetDate.slice(0, 16)}
                onChange={(e) => setExamTargetDate(e.target.value)}
                className="flex-1 bg-white/30 border border-emerald-500/30 rounded-xl px-4 py-2 text-emerald-900 focus:outline-none"
              />
              <button 
                onClick={() => handleUpdateExamDate(examTargetDate)}
                className="p-2 bg-emerald-600 text-white rounded-xl"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: t.days, value: timeLeft.days },
                { label: t.hours, value: timeLeft.hours },
                { label: t.minutes, value: timeLeft.minutes },
                { label: t.seconds, value: timeLeft.seconds }
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl font-black text-emerald-900">{item.value}</div>
                  <div className="text-[10px] font-bold text-emerald-700/40 uppercase tracking-widest">{item.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </GlassCard>

      {/* School Feed Title */}
      <div className="flex items-center justify-between px-2 pt-4">
        <h3 className="text-xl font-black text-emerald-900 uppercase tracking-tight flex items-center gap-2">
          <Camera className="w-5 h-5 text-emerald-600" />
          Community Feed
        </h3>
        <button 
          onClick={() => setActiveTab("Globe")}
          className="text-xs font-bold text-emerald-600 uppercase tracking-wider hover:underline"
        >
          View All
        </button>
      </div>

      {/* Community Feed Horizontal Scroll or Grid */}
      <div className="grid grid-cols-2 gap-4">
        {recentPosts.length > 0 ? (
          recentPosts.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group relative aspect-square rounded-[32px] overflow-hidden glass border-white/40 shadow-xl"
            >
              <img 
                src={post.imageUrl} 
                alt="Feed" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <div className="space-y-0.5">
                  <p className="text-white text-[10px] font-black uppercase tracking-widest">{post.userName}</p>
                  <p className="text-white/80 text-[8px] line-clamp-1">{post.caption}</p>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          [1, 2, 3, 4].map(i => (
            <div key={i} className="aspect-square rounded-[32px] glass animate-pulse" />
          ))
        )}
      </div>

      {/* Quick Stats / Info */}
      <div className="grid grid-cols-2 gap-4">
        <GlassCard className="p-6 flex flex-col items-center justify-center text-center gap-2 bg-red-500/10 border-red-500/20">
          <div className="text-5xl font-black text-red-600 drop-shadow-sm">
            {counts.students}
          </div>
          <div className="text-xl font-black text-red-700 uppercase tracking-tighter">
            Students
          </div>
        </GlassCard>
        <GlassCard className="p-6 flex flex-col items-center justify-center text-center gap-2 bg-emerald-500/10 border-emerald-500/20">
          <div className="text-5xl font-black text-emerald-600 drop-shadow-sm">
            {counts.teachers}
          </div>
          <div className="text-xl font-black text-emerald-700 uppercase tracking-tighter">
            Teachers
          </div>
        </GlassCard>
      </div>
    </div>
  );
});
