import React, { useState, memo, useMemo } from "react";
import { Book, Plus, ChevronLeft, Lightbulb, Send, Edit2, X, Check, Trash2, Upload, Settings } from "lucide-react";
import GlassCard from "./GlassCard";
import { motion, AnimatePresence } from "motion/react";
import { UserRole } from "./LoginView";
import { BookSuggestionData } from "../App";

interface BookLibraryProps {
  classId: string;
  userRole: UserRole;
  suggestions: BookSuggestionData;
  onAddSuggestion: (bookKey: string, suggestion: string) => void;
  onUpdateSuggestion: (bookKey: string, id: string, newText: string) => void;
  onDeleteSuggestion?: (bookKey: string, id: string) => void;
  onBack: () => void;
}

const NCTB_BOOKS = [
  { id: "Bangla", name: "Bangla (বাংলা)", color: "bg-red-500/20", iconColor: "text-red-600" },
  { id: "English", name: "English", color: "bg-blue-500/20", iconColor: "text-blue-600" },
  { id: "Math", name: "Mathematics (গণিত)", color: "bg-amber-500/20", iconColor: "text-amber-600" },
  { id: "Science", name: "Science (বিজ্ঞান)", color: "bg-emerald-500/20", iconColor: "text-emerald-600" },
  { id: "BGS", name: "BGS (বাংলাদেশ ও বিশ্বপরিচয়)", color: "bg-purple-500/20", iconColor: "text-purple-600" },
  { id: "Religion", name: "Religion (ধর্ম)", color: "bg-teal-500/20", iconColor: "text-teal-600" },
  { id: "ICT", name: "ICT (তথ্য ও যোগাযোগ প্রযুক্তি)", color: "bg-indigo-500/20", iconColor: "text-indigo-600" },
  { id: "Physics", name: "Physics (পদার্থবিজ্ঞান)", color: "bg-cyan-500/20", iconColor: "text-cyan-600" },
  { id: "Chemistry", name: "Chemistry (রসায়ন)", color: "bg-orange-500/20", iconColor: "text-orange-600" },
  { id: "Biology", name: "Biology (জীববিজ্ঞান)", color: "bg-green-500/20", iconColor: "text-green-600" },
];

const BookLibrary = memo(({ classId, userRole, suggestions, onAddSuggestion, onUpdateSuggestion, onDeleteSuggestion, onBack }: BookLibraryProps) => {
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [showInputBar, setShowInputBar] = useState(false);
  const [newSuggestion, setNewSuggestion] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [manageBook, setManageBook] = useState<any | null>(null);
  const [editBookName, setEditBookName] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [books, setBooks] = useState(() => {
    const cached = localStorage.getItem(`class_${classId}_books`);
    return cached ? JSON.parse(cached) : NCTB_BOOKS;
  });

  const [bookPdfs, setBookPdfs] = useState<Record<string, string>>(() => {
    const cached = localStorage.getItem(`class_${classId}_pdfs`);
    return cached ? JSON.parse(cached) : {};
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddBook = () => {
    const newBook = {
      id: `custom_${Date.now()}`,
      name: "New Subject",
      color: "bg-emerald-500/20",
      iconColor: "text-emerald-600"
    };
    const updatedBooks = [...books, newBook];
    setBooks(updatedBooks);
    localStorage.setItem(`class_${classId}_books`, JSON.stringify(updatedBooks));
  };

  const handleRenameBook = (id: string, newName: string) => {
    const updatedBooks = books.map((b: any) => b.id === id ? { ...b, name: newName } : b);
    setBooks(updatedBooks);
    localStorage.setItem(`class_${classId}_books`, JSON.stringify(updatedBooks));
    setManageBook(null);
  };

  const handleBookClick = (book: any) => {
    if (bookPdfs[book.id]) {
      window.open(bookPdfs[book.id], "_blank");
    } else {
      showToast("Book coming soon!");
    }
  };

  const handleDeleteBook = (id: string) => {
    const updatedBooks = books.filter((b: any) => b.id !== id);
    setBooks(updatedBooks);
    localStorage.setItem(`class_${classId}_books`, JSON.stringify(updatedBooks));
    
    const newPdfs = { ...bookPdfs };
    delete newPdfs[id];
    setBookPdfs(newPdfs);
    localStorage.setItem(`class_${classId}_pdfs`, JSON.stringify(newPdfs));
    
    setDeleteConfirmId(null);
    setManageBook(null);
    showToast("Book deleted successfully");
  };

  const bookKey = selectedBook ? `${classId}-${selectedBook}` : "";
  const bookSuggestions = suggestions?.[bookKey] || [];

  const handlePdfUpload = (bookId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const newPdfs = { ...bookPdfs, [bookId]: base64 };
        setBookPdfs(newPdfs);
        localStorage.setItem(`class_${classId}_pdfs`, JSON.stringify(newPdfs));
        showToast("PDF uploaded successfully");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSuggestion = () => {
    if (newSuggestion.trim() && selectedBook) {
      onAddSuggestion(bookKey, newSuggestion.trim());
      setNewSuggestion("");
      setShowInputBar(false);
    }
  };

  const handleUpdate = (id: string) => {
    if (editText.trim() && selectedBook) {
      onUpdateSuggestion(bookKey, id, editText.trim());
      setEditingId(null);
      setEditText("");
    }
  };

  const startEditing = (id: string, currentText: string) => {
    setEditingId(id);
    setEditText(currentText);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-xl glass text-emerald-700">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold text-emerald-900">Class {classId} Library</h2>
        </div>
        {userRole === "Teacher" && !selectedBook && (
          <button 
            onClick={handleAddBook}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-200"
          >
            <Plus className="w-4 h-4" />
            Add New Book
          </button>
        )}
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl bg-emerald-900 text-white font-bold shadow-2xl border border-white/20"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manage Book Modal */}
      <AnimatePresence>
        {manageBook && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setManageBook(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm glass rounded-[32px] p-8 space-y-6 border border-white/40 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-emerald-900 tracking-tight">Manage Book</h3>
                <button onClick={() => setManageBook(null)} className="p-2 rounded-full hover:bg-black/5">
                  <X className="w-5 h-5 text-emerald-900" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-emerald-700/40 uppercase tracking-widest ml-1">Subject Name</label>
                  <input 
                    value={editBookName}
                    onChange={(e) => setEditBookName(e.target.value)}
                    className="w-full bg-white/50 border border-emerald-500/20 rounded-2xl px-4 py-3 text-emerald-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-emerald-700/40 uppercase tracking-widest ml-1">PDF Document</label>
                  <label className="w-full py-4 rounded-2xl bg-emerald-50 border-2 border-dashed border-emerald-500/20 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-emerald-100/50 transition-all">
                    <Upload className="w-6 h-6 text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-900">
                      {bookPdfs[manageBook.id] ? "Change PDF File" : "Upload PDF File"}
                    </span>
                    <input 
                      type="file" 
                      accept="application/pdf" 
                      className="hidden" 
                      onChange={(e) => handlePdfUpload(manageBook.id, e)}
                    />
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => handleRenameBook(manageBook.id, editBookName)}
                  className="flex-1 py-4 rounded-2xl bg-emerald-600 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-200"
                >
                  Save Changes
                </button>
                <button 
                  onClick={() => setDeleteConfirmId(manageBook.id)}
                  className="p-4 rounded-2xl bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {deleteConfirmId === manageBook.id && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-2xl bg-red-600 text-white space-y-3"
                >
                  <p className="text-xs font-bold text-center">Are you sure you want to delete this book?</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleDeleteBook(manageBook.id)}
                      className="flex-1 py-2 bg-white text-red-600 rounded-xl font-bold text-xs"
                    >
                      Yes, Delete
                    </button>
                    <button 
                      onClick={() => setDeleteConfirmId(null)}
                      className="flex-1 py-2 bg-red-700 text-white rounded-xl font-bold text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!selectedBook ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-2 sm:grid-cols-3 gap-4"
          >
            {books.map((book: any) => (
              <GlassCard
                key={book.id}
                className="flex flex-col items-center justify-center text-center p-4 gap-3 aspect-square relative group"
              >
                <div 
                  onClick={() => handleBookClick(book)}
                  className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
                >
                  <div className={`w-12 h-12 rounded-2xl ${book.color} flex items-center justify-center`}>
                    <Book className={`w-6 h-6 ${book.iconColor}`} />
                  </div>
                  <span className="text-sm font-bold text-emerald-900 leading-tight mt-2">
                    {book.name}
                  </span>
                </div>

                {/* Teacher Actions */}
                <div className="absolute top-2 right-2 flex flex-col gap-2">
                  {userRole === "Teacher" && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setManageBook(book);
                        setEditBookName(book.name);
                      }}
                      className="p-2 rounded-lg bg-white/40 text-emerald-700 hover:bg-white/60 transition-all"
                      title="Manage Book"
                    >
                      <Settings className="w-3 h-3" />
                    </button>
                  )}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBook(book.id);
                    }}
                    className="p-2 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-all"
                    title="Suggestions"
                  >
                    <Lightbulb className="w-3 h-3" />
                  </button>
                </div>
              </GlassCard>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => { setSelectedBook(null); setEditingId(null); }} className="text-emerald-700 font-bold text-sm">
                  Books
                </button>
                <span className="text-emerald-300">/</span>
                <span className="text-emerald-900 font-bold">{selectedBook}</span>
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
                        value={newSuggestion}
                        onChange={(e) => setNewSuggestion(e.target.value)}
                        placeholder="Add important topic or suggestion..."
                        className="flex-1 bg-white/30 border border-white/20 rounded-xl px-4 py-3 text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <button 
                        onClick={handleAddSuggestion}
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

            <GlassCard className="space-y-6">
              <div className="flex items-center gap-3 text-emerald-800">
                <Lightbulb className="w-6 h-6 text-amber-500" />
                <h3 className="text-xl font-bold">Important Topics & Suggestions</h3>
              </div>

              <div className="space-y-3">
                {bookSuggestions.length > 0 ? (
                  bookSuggestions.map((s, i) => (
                    <div 
                      key={s.id} 
                      className={`p-4 rounded-2xl bg-white/30 border border-white/20 text-emerald-900 flex flex-col gap-1 transition-all duration-500 ${
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
                            <div className="flex items-start gap-3">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                              <span>{s.text}</span>
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
                                  onClick={() => onDeleteSuggestion?.(bookKey, s.id)}
                                  className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-red-600"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  )).reverse()
                ) : (
                  <p className="text-emerald-700/50 text-center py-8 italic">No suggestions added yet.</p>
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default BookLibrary;
