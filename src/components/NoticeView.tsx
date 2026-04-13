import { Bell, Plus, Edit2, X, Check, Trash2 } from "lucide-react";
import GlassCard from "./GlassCard";
import { motion, AnimatePresence } from "motion/react";
import React, { useState } from "react";
import { UserData, NoticeItem } from "../App";
import { Language, translations } from "../lib/translations";

interface NoticeViewProps {
  user: UserData;
  notices: NoticeItem[];
  onAddNotice: (title: string, content: string, type: "Important" | "General") => void;
  onUpdateNotice: (id: string, title: string, content: string) => void;
  onDeleteNotice?: (id: string) => void;
  language: Language;
}

export default React.memo(function NoticeView({ user, notices, onAddNotice, onUpdateNotice, onDeleteNotice, language }: NoticeViewProps) {
  const t = translations[language];
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newType, setNewType] = useState<"Important" | "General">("General");

  const handleAdd = () => {
    if (newTitle.trim() && newContent.trim()) {
      onAddNotice(newTitle, newContent, newType);
      setNewTitle("");
      setNewContent("");
      setIsAdding(false);
    }
  };

  const handleUpdate = (id: string) => {
    if (newTitle.trim() && newContent.trim()) {
      onUpdateNotice(id, newTitle, newContent);
      setEditingId(null);
      setNewTitle("");
      setNewContent("");
    }
  };

  const startEditing = (notice: NoticeItem) => {
    setEditingId(notice.id);
    setNewTitle(notice.title);
    setNewContent(notice.content);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="px-6 space-y-4 pb-32"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-emerald-900">{t.noticeBoard}</h2>
        <AnimatePresence>
          {user.role === "Teacher" && (
            <motion.button 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => setIsAdding(!isAdding)}
              className="p-3 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all"
            >
              {isAdding ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, scaleY: 0, originY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden will-change-transform"
          >
            <GlassCard className="border-2 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)] mb-6 space-y-4">
              <div className="space-y-2">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={t.noticeTitle}
                  className="w-full bg-white/30 border border-white/20 rounded-xl px-4 py-2 text-emerald-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder={t.noticeContent}
                  className="w-full bg-white/30 border border-white/20 rounded-xl px-4 py-2 text-emerald-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 min-h-[80px]"
                />
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                    <input 
                      type="radio" 
                      checked={newType === "General"} 
                      onChange={() => setNewType("General")}
                      className="accent-emerald-600"
                    />
                    {t.general}
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-amber-700">
                    <input 
                      type="radio" 
                      checked={newType === "Important"} 
                      onChange={() => setNewType("Important")}
                      className="accent-amber-600"
                    />
                    {t.important}
                  </label>
                </div>
              </div>
              <button 
                onClick={handleAdd}
                className="w-full py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-bold"
              >
                {t.postNotice}
              </button>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {notices.map((notice) => (
          <GlassCard 
            key={notice.id} 
            className={`flex gap-4 items-start relative transition-all duration-500 ${
              editingId === notice.id ? "border-2 border-emerald-500 animate-pulse-glow" : ""
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              notice.type === "Important" ? "bg-amber-500/20" : "bg-emerald-500/20"
            }`}>
              <Bell className={`w-5 h-5 ${notice.type === "Important" ? "text-amber-600" : "text-emerald-600"}`} />
            </div>
            
            <div className="space-y-1 flex-1">
              {editingId === notice.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-white/50 border border-emerald-500/30 rounded-lg px-3 py-1 text-emerald-900 font-bold focus:outline-none"
                  />
                  <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full bg-white/50 border border-emerald-500/30 rounded-lg px-3 py-1 text-emerald-900 text-sm focus:outline-none min-h-[60px]"
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleUpdate(notice.id)}
                      className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Update
                    </button>
                    <button 
                      onClick={() => setEditingId(null)}
                      className="flex-1 py-2 bg-white/40 text-emerald-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                    >
                      <X className="w-3 h-3" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <span className={`text-[10px] font-bold uppercase ${
                    notice.type === "Important" ? "text-amber-700" : "text-emerald-700"
                  }`}>
                    {notice.type}
                  </span>
                  <h4 className="font-bold text-emerald-900">{notice.title}</h4>
                  <p className="text-sm text-emerald-800/60">{notice.content}</p>
                  <p className="text-[10px] text-emerald-700/40 mt-2">Posted {notice.date}</p>
                </>
              )}
            </div>

            <AnimatePresence>
              {user.role === "Teacher" && editingId !== notice.id && (
                <motion.div 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex gap-1"
                >
                  <button 
                    onClick={() => startEditing(notice)}
                    className="p-2 rounded-lg hover:bg-white/40 transition-colors text-emerald-700"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => onDeleteNotice?.(notice.id)}
                    className="p-2 rounded-lg hover:bg-red-500/10 transition-colors text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        ))}
      </div>
    </motion.div>
  );
});
