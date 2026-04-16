import { Book, ClipboardList, Lightbulb, Plus, Edit2, BarChart3, Clock, CheckCircle2, ChevronLeft, Send, X, Check, Trash2, ChevronDown, LayoutGrid, Banknote, Bell } from "lucide-react";
import GlassCard from "./GlassCard";
import { motion, AnimatePresence } from "motion/react";
import { UserRole } from "./LoginView";
import React, { useState } from "react";
import BookLibrary from "./BookLibrary";
import ExamChargeTable from "./ExamChargeTable";
import Spreadsheet from "./Spreadsheet";
import Routine from "./Routine";
import ClassNotice from "./ClassNotice";
import { BookSuggestionData, HomeworkData } from "../App";
import { Language, translations } from "../lib/translations";

interface ClassPortalProps {
  userRole: UserRole;
  userClass?: string;
  homework: HomeworkData;
  onAddHomework: (classId: string, task: string) => void;
  onUpdateHomework: (classId: string, id: string, newTask: string) => void;
  onDeleteHomework?: (classId: string, id: string) => void;
  bookSuggestions: BookSuggestionData;
  onAddSuggestion: (bookKey: string, suggestion: string) => void;
  onUpdateSuggestion: (bookKey: string, id: string, newText: string) => void;
  onDeleteSuggestion?: (bookKey: string, id: string) => void;
  attendance: any;
  onUpdateAttendance?: (classId: string, percentage: number) => void;
  routines?: any;
  onUpdateRoutine?: (classId: string, headers: string[], rows: string[][]) => void;
  language: Language;
  bookPdfs?: Record<string, string>;
  onUpdateBookPdf?: (bookKey: string, url: string) => void;
}

export default React.memo(function ClassPortal({ 
  userRole, 
  userClass, 
  homework, 
  onAddHomework, 
  onUpdateHomework, 
  onDeleteHomework,
  bookSuggestions, 
  onAddSuggestion, 
  onUpdateSuggestion,
  onDeleteSuggestion,
  attendance,
  onUpdateAttendance,
  routines,
  onUpdateRoutine,
  language,
  bookPdfs,
  onUpdateBookPdf
}: ClassPortalProps) {
  const t = translations[language];
  const [view, setView] = useState<"list" | "library" | "result" | "attendance" | "routine" | "homework" | "suggestions" | "half_yearly_charge" | "annual_charge" | "class_notice">("list");
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [showInputBar, setShowInputBar] = useState(false);
  const [inputText, setInputText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editingCell, setEditingCell] = useState<{ day: string; period: string } | null>(null);
  const [isEditingAttendance, setIsEditingAttendance] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isChargeMenuOpen, setIsChargeMenuOpen] = useState<string | null>(null);

  const classes = Array.from({ length: 5 }, (_, i) => i + 6);
  
  const visibleClasses = userRole === "Teacher" 
    ? classes 
    : classes.filter(c => c.toString() === userClass);

  const handleOpenView = (classId: string, targetView: typeof view) => {
    setSelectedClass(classId);
    setView(targetView);
    setShowInputBar(false);
    setEditingId(null);
  };

  const handlePost = () => {
    if (!inputText.trim()) return;
    
    if (view === "homework") {
      onAddHomework(selectedClass!, inputText.trim());
    } else if (view === "suggestions") {
      onAddSuggestion(`${selectedClass!}-Global`, inputText.trim());
    }
    
    setInputText("");
    setShowInputBar(false);
  };

  const handleUpdate = (id: string) => {
    if (!editText.trim()) return;
    
    if (view === "homework") {
      onUpdateHomework(selectedClass!, id, editText.trim());
    } else if (view === "suggestions") {
      onUpdateSuggestion(`${selectedClass!}-Global`, id, editText.trim());
    }
    
    setEditingId(null);
    setEditText("");
  };

  const startEditing = (id: string, currentText: string) => {
    setEditingId(id);
    setEditText(currentText);
  };

  const renderSubView = () => {
    switch (view) {
      case "library":
        return (
          <BookLibrary 
            classId={selectedClass!} 
            userRole={userRole} 
            suggestions={bookSuggestions}
            onAddSuggestion={onAddSuggestion}
            onUpdateSuggestion={onUpdateSuggestion}
            onDeleteSuggestion={onDeleteSuggestion}
            onBack={() => setView("list")}
            language={language}
            bookPdfs={bookPdfs}
            onUpdateBookPdf={onUpdateBookPdf}
          />
        );
      case "homework":
        const classHomework = homework?.[selectedClass!] || [];
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => setView("list")} className="p-2 rounded-xl glass text-emerald-700">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold text-emerald-900">{t.classLabel} {selectedClass} {t.homework}</h2>
              </div>
              <AnimatePresence>
                {userRole === "Teacher" && (
                  <motion.button 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => setShowInputBar(!showInputBar)}
                    className="p-3 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all"
                  >
                    <Plus className={`w-6 h-6 transition-transform ${showInputBar ? "rotate-45" : ""}`} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {showInputBar && (
                <motion.div
                  initial={{ opacity: 0, scaleY: 0, originY: 0 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  exit={{ opacity: 0, scaleY: 0 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  className="overflow-hidden will-change-transform"
                >
                  <GlassCard className="border-2 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)] mb-6">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Type homework task..."
                        className="flex-1 bg-white/30 border border-white/20 rounded-xl px-4 py-3 text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <button 
                        onClick={handlePost}
                        className="p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all flex items-center gap-2 font-bold"
                      >
                        <Send className="w-5 h-5" />
                        Post
                      </button>
                    </div>
                  </GlassCard>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              {classHomework.length > 0 ? (
                classHomework.map((hw, i) => (
                  <GlassCard 
                    key={hw.id} 
                    className={`flex flex-col gap-2 transition-all duration-500 ${
                      editingId === hw.id ? "border-2 border-emerald-500 animate-pulse-glow" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        {editingId === hw.id ? (
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="w-full bg-white/50 border border-emerald-500/30 rounded-lg px-3 py-2 text-emerald-900 focus:outline-none"
                            />
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleUpdate(hw.id)}
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
                          <p className="text-emerald-900 font-medium">{hw.task}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-[10px] font-bold text-emerald-700/40 uppercase">{hw.date}</span>
                        <AnimatePresence>
                          {userRole === "Teacher" && editingId !== hw.id && (
                            <motion.div 
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 10 }}
                              className="flex gap-1"
                            >
                              <button 
                                onClick={() => startEditing(hw.id, hw.task)}
                                className="p-1.5 rounded-lg hover:bg-white/40 transition-colors text-emerald-700"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => onDeleteHomework?.(selectedClass!, hw.id)}
                                className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-red-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </GlassCard>
                )).reverse()
              ) : (
                <p className="text-emerald-700/50 text-center py-12 italic">No homework assigned yet.</p>
              )}
            </div>
          </div>
        );
      case "suggestions":
        const classSuggestions = bookSuggestions?.[`${selectedClass!}-Global`] || [];
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => setView("list")} className="p-2 rounded-xl glass text-emerald-700">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold text-emerald-900">{t.classLabel} {selectedClass} {t.suggestion}</h2>
              </div>
              <AnimatePresence>
                {userRole === "Teacher" && (
                  <motion.button 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => setShowInputBar(!showInputBar)}
                    className="p-3 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all"
                  >
                    <Plus className={`w-6 h-6 transition-transform ${showInputBar ? "rotate-45" : ""}`} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {showInputBar && (
                <motion.div
                  initial={{ opacity: 0, scaleY: 0, originY: 0 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  exit={{ opacity: 0, scaleY: 0 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  className="overflow-hidden will-change-transform"
                >
                  <GlassCard className="border-2 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)] mb-6">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Type suggestion or exam tip..."
                        className="flex-1 bg-white/30 border border-white/20 rounded-xl px-4 py-3 text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <button 
                        onClick={handlePost}
                        className="p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all flex items-center gap-2 font-bold"
                      >
                        <Send className="w-5 h-5" />
                        Post
                      </button>
                    </div>
                  </GlassCard>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              {classSuggestions.length > 0 ? (
                classSuggestions.map((s, i) => (
                  <GlassCard 
                    key={s.id} 
                    className={`flex flex-col gap-2 transition-all duration-500 ${
                      editingId === s.id ? "border-2 border-emerald-500 animate-pulse-glow" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        {editingId === s.id ? (
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="w-full bg-white/50 border border-emerald-500/30 rounded-lg px-3 py-2 text-emerald-900 focus:outline-none"
                            />
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleUpdate(s.id)}
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
                          <div className="flex gap-3 items-start">
                            <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-emerald-900 font-medium">{s.text}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-[10px] font-bold text-emerald-700/40 uppercase">{s.date}</span>
                        <AnimatePresence>
                          {userRole === "Teacher" && editingId !== s.id && (
                            <motion.div 
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 10 }}
                              className="flex gap-1"
                            >
                              <button 
                                onClick={() => startEditing(s.id, s.text)}
                                className="p-1.5 rounded-lg hover:bg-white/40 transition-colors text-emerald-700"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => onDeleteSuggestion?.(`${selectedClass!}-Global`, s.id)}
                                className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-red-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </GlassCard>
                )).reverse()
              ) : (
                <p className="text-emerald-700/50 text-center py-12 italic">No suggestions added yet.</p>
              )}
            </div>
          </div>
        );
      case "result":
        return (
          <Spreadsheet 
            classId={selectedClass!} 
            userRole={userRole} 
            onBack={() => setView("list")} 
            language={language}
          />
        );
      case "class_notice":
        return (
          <ClassNotice 
            classId={selectedClass!} 
            userRole={userRole} 
            onBack={() => setView("list")} 
          />
        );
      case "half_yearly_charge":
        return (
          <ExamChargeTable 
            examType="Half Yearly" 
            classId={selectedClass!} 
            userRole={userRole} 
            onBack={() => setView("list")} 
            language={language}
          />
        );
      case "annual_charge":
        return (
          <ExamChargeTable 
            examType="Annual" 
            classId={selectedClass!} 
            userRole={userRole} 
            onBack={() => setView("list")} 
            language={language}
          />
        );
      case "attendance":
        return null; // Removed
      case "routine":
        return (
          <Routine 
            classId={selectedClass!} 
            userRole={userRole} 
            onBack={() => setView("list")} 
            language={language}
            routineData={routines?.[selectedClass!]}
            onUpdateRoutine={onUpdateRoutine}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="px-6 pb-32">
      <AnimatePresence mode="wait">
        {view === "list" ? (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-emerald-900">Classes</h2>
                <p className="text-emerald-700/70">
                  {userRole === "Teacher" ? "Manage all academic resources" : `Resources for Class ${userClass}`}
                </p>
              </div>
              <AnimatePresence>
                {userRole === "Teacher" && (
                  <motion.button 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="p-3 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all"
                  >
                    <Plus className="w-6 h-6" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {visibleClasses.map((num) => (
                <GlassCard key={num} className="relative group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-700 font-bold text-xl">
                        {num}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-emerald-900">Class {num}</h3>
                        <p className="text-sm text-emerald-700/60">Academic Session 2026</p>
                      </div>
                    </div>
                    <AnimatePresence>
                      {userRole === "Teacher" && (
                        <motion.button 
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="p-2 rounded-xl hover:bg-white/40 transition-colors text-emerald-700"
                        >
                          <Edit2 className="w-5 h-5" />
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="mt-4 space-y-2">
                    <button 
                      onClick={() => setOpenDropdown(openDropdown === num.toString() ? null : num.toString())}
                      className="w-full py-4 px-6 rounded-2xl bg-emerald-600 text-white font-bold flex items-center justify-between shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all haptic-glow"
                    >
                      <div className="flex items-center gap-3">
                        <LayoutGrid className="w-5 h-5" />
                        <span>Class Portal</span>
                      </div>
                      <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${openDropdown === num.toString() ? "rotate-180" : ""}`} />
                    </button>

                    <AnimatePresence>
                      {openDropdown === num.toString() && (
                        <motion.div
                          initial={{ opacity: 0, scaleY: 0, originY: 0 }}
                          animate={{ opacity: 1, scaleY: 1 }}
                          exit={{ opacity: 0, scaleY: 0 }}
                          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                          className="overflow-hidden will-change-transform"
                        >
                          <div className="pt-2 grid grid-cols-2 gap-2">
                            <button 
                              onClick={() => handleOpenView(num.toString(), "library")}
                              className="flex items-center gap-3 p-4 rounded-2xl bg-white/30 hover:bg-emerald-500/10 transition-all text-emerald-900 text-xs font-bold border border-white/20 haptic-glow"
                            >
                              <Book className="w-4 h-4 text-emerald-600" />
                              <span>{t.academicBooks}</span>
                            </button>
                            <button 
                              onClick={() => handleOpenView(num.toString(), "result")}
                              className="flex items-center gap-3 p-4 rounded-2xl bg-white/30 hover:bg-emerald-500/10 transition-all text-emerald-900 text-xs font-bold border border-white/20 haptic-glow"
                            >
                              <BarChart3 className="w-4 h-4 text-emerald-600" />
                              <span>{t.result}</span>
                            </button>
                            <button 
                              onClick={() => handleOpenView(num.toString(), "class_notice")}
                              className="flex items-center gap-3 p-4 rounded-2xl bg-white/30 hover:bg-emerald-500/10 transition-all text-emerald-900 text-xs font-bold border border-white/20 haptic-glow"
                            >
                              <Bell className="w-4 h-4 text-emerald-600" />
                              <span>{t.notice}</span>
                            </button>
                            <button 
                              onClick={() => handleOpenView(num.toString(), "routine")}
                              className="flex items-center gap-3 p-4 rounded-2xl bg-white/30 hover:bg-emerald-500/10 transition-all text-emerald-900 text-xs font-bold border border-white/20 haptic-glow"
                            >
                              <Clock className="w-4 h-4 text-emerald-600" />
                              <span>{t.routine}</span>
                            </button>
                            <button 
                              onClick={() => handleOpenView(num.toString(), "homework")}
                              className="flex items-center gap-3 p-4 rounded-2xl bg-white/30 hover:bg-emerald-500/10 transition-all text-emerald-900 text-xs font-bold border border-white/20 haptic-glow"
                            >
                              <ClipboardList className="w-4 h-4 text-emerald-600" />
                              <span>{t.homework}</span>
                            </button>
                            <button 
                              onClick={() => handleOpenView(num.toString(), "suggestions")}
                              className="flex items-center gap-3 p-4 rounded-2xl bg-white/30 hover:bg-emerald-500/10 transition-all text-emerald-900 text-xs font-bold border border-white/20 haptic-glow"
                            >
                              <Lightbulb className="w-4 h-4 text-emerald-600" />
                              <span>{t.suggestion}</span>
                            </button>
                            
                            <div className="col-span-2 space-y-2">
                              <button 
                                onClick={() => setIsChargeMenuOpen(isChargeMenuOpen === num.toString() ? null : num.toString())}
                                className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/30 hover:bg-emerald-500/10 transition-all text-emerald-900 text-xs font-bold border border-white/20 haptic-glow"
                              >
                                <div className="flex items-center gap-3">
                                  <Banknote className="w-4 h-4 text-emerald-600" />
                                  <span>{t.charge}</span>
                                </div>
                                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isChargeMenuOpen === num.toString() ? "rotate-180" : ""}`} />
                              </button>
                              
                              <AnimatePresence>
                                {isChargeMenuOpen === num.toString() && (
                                  <motion.div
                                    initial={{ opacity: 0, scaleY: 0, originY: 0 }}
                                    animate={{ opacity: 1, scaleY: 1 }}
                                    exit={{ opacity: 0, scaleY: 0 }}
                                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                                    className="grid grid-cols-2 gap-2 pl-4 overflow-hidden will-change-transform"
                                  >
                                    <button 
                                      onClick={() => handleOpenView(num.toString(), "half_yearly_charge")}
                                      className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 transition-all text-emerald-800 text-[10px] font-bold border border-emerald-500/10"
                                    >
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>{t.halfYearly || "Half Yearly"}</span>
                                    </button>
                                    <button 
                                      onClick={() => handleOpenView(num.toString(), "annual_charge")}
                                      className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 transition-all text-emerald-800 text-[10px] font-bold border border-emerald-500/10"
                                    >
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>{t.annual || "Annual"}</span>
                                    </button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </GlassCard>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="subview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {renderSubView()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
