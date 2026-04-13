import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, Plus, Trash2, Clock, Send, Bell } from "lucide-react";
import GlassCard from "./GlassCard";
import { UserRole } from "./LoginView";
import { db } from "../firebase";
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, Timestamp, where } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../lib/firestoreUtils";

interface ClassNoticeItem {
  id: string;
  text: string;
  timestamp: any;
}

interface ClassNoticeProps {
  classId: string;
  userRole: UserRole;
  onBack: () => void;
}

export default function ClassNotice({ classId, userRole, onBack }: ClassNoticeProps) {
  const [notices, setNotices] = useState<ClassNoticeItem[]>([]);
  const [inputText, setInputText] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const collectionPath = `class_notices_${classId}`;
  const storageKey = `local_notices_class_${classId}`;

  useEffect(() => {
    // Load from localStorage for instant feel
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      setNotices(JSON.parse(cached));
      setIsLoading(false);
    }

    const q = query(
      collection(db, "class_notices"), 
      where("classId", "==", classId),
      orderBy("timestamp", "desc")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const remoteNotices = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ClassNoticeItem[];
      
      setNotices(remoteNotices);
      localStorage.setItem(storageKey, JSON.stringify(remoteNotices));
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "class_notices");
      setIsLoading(false);
    });

    return () => unsub();
  }, [classId, storageKey]);

  const handleAddNotice = async () => {
    if (!inputText.trim()) return;

    try {
      await addDoc(collection(db, "class_notices"), {
        classId,
        text: inputText.trim(),
        timestamp: Timestamp.now()
      });
      setInputText("");
      setShowInput(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "class_notices");
    }
  };

  const handleDeleteNotice = async (id: string) => {
    try {
      await deleteDoc(doc(db, "class_notices", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, "class_notices");
    }
  };

  const formatTimestamp = (ts: any) => {
    if (!ts) return "";
    const date = ts?.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-xl glass text-emerald-700">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-emerald-900">Class {classId} Notices</h2>
            <p className="text-sm text-emerald-700/60">Internal Announcements</p>
          </div>
        </div>
        
        {userRole === "Teacher" && (
          <button 
            onClick={() => setShowInput(!showInput)}
            className="p-3 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all"
          >
            <Plus className={`w-6 h-6 transition-transform ${showInput ? "rotate-45" : ""}`} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showInput && (
          <motion.div
            initial={{ opacity: 0, scaleY: 0, originY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden will-change-transform"
          >
            <GlassCard className="border-2 border-emerald-500/50 shadow-xl mb-6">
              <div className="space-y-4">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type class announcement..."
                  className="w-full bg-white/30 border border-white/20 rounded-xl px-4 py-3 text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 min-h-[100px] resize-none"
                />
                <div className="flex justify-end">
                  <button 
                    onClick={handleAddNotice}
                    className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all flex items-center gap-2 font-bold"
                  >
                    <Send className="w-5 h-5" />
                    Post Notice
                  </button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {isLoading ? (
          <div className="py-12 text-center">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : notices.length > 0 ? (
          notices.map((notice) => (
            <motion.div
              key={notice.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <GlassCard className="border-emerald-500/20 hover:border-emerald-500/40 transition-all">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Bell className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-emerald-900 font-medium leading-relaxed">
                        {notice.text}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-700/40 uppercase">
                        <Clock className="w-3 h-3" />
                        {formatTimestamp(notice.timestamp)}
                      </div>
                    </div>
                  </div>
                  
                  {userRole === "Teacher" && (
                    <button 
                      onClick={() => handleDeleteNotice(notice.id)}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-emerald-500/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-emerald-700/20" />
            </div>
            <p className="text-emerald-700/40 italic">No notices for this class yet.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
