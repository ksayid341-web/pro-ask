import React, { useState, useEffect, useRef } from "react";
import { Send, User, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import GlassCard from "./GlassCard";
import { UserData } from "../App";
import { Language, translations } from "../lib/translations";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderPhoto: string;
  text: string;
  timestamp: number;
}

interface GlobalInboxProps {
  user: UserData;
  language: Language;
  onClose: () => void;
}

export default function GlobalInbox({ user, language, onClose }: GlobalInboxProps) {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem("global_messages");
    return saved ? JSON.parse(saved) : [];
  });
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const t = translations[language];

  useEffect(() => {
    localStorage.setItem("global_messages", JSON.stringify(messages));
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: user.uid,
      senderName: user.name,
      senderPhoto: user.photoURL,
      text: inputText.trim(),
      timestamp: Date.now(),
    };

    setMessages([...messages, newMessage]);
    setInputText("");
  };

  const handleClearChat = () => {
    if (user.role !== "Teacher") return;
    setMessages([]);
    localStorage.removeItem("global_messages");
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-[150] glass-dark flex flex-col p-4 md:p-8"
    >
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col gap-4 relative">
        {/* Header */}
        <div className="flex items-center justify-between px-2 mb-2">
          <div className="flex items-center gap-3">
            {user.role === "Teacher" && (
              <button 
                onClick={handleClearChat}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all font-bold text-xs border border-red-500/20"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            )}
            <div className="text-[10px] font-bold text-white/60 bg-white/10 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
              {messages.length} Messages
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-all border border-white/10 shadow-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <GlassCard className="flex-1 flex flex-col overflow-hidden p-0 border-white/10 bg-white/5 shadow-2xl rounded-[32px]">
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide"
          >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                  <User className="w-10 h-10 text-white" />
                </div>
                <p className="text-white text-xl font-bold">No messages yet.</p>
                <p className="text-sm text-white/60">Be the first to start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === user.uid;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    {/* User Info Above Bubble */}
                    <div className={`flex items-center gap-2 mb-1 px-1 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                      <div className="w-6 h-6 rounded-full border border-white/20 overflow-hidden shadow-sm">
                        <img 
                          src={msg.senderPhoto} 
                          alt={msg.senderName} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <span className="text-[10px] font-black text-white/60 uppercase tracking-wider">
                        {isMe ? "You" : msg.senderName}
                      </span>
                    </div>

                    {/* Message Bubble */}
                    <div className={`max-w-[80%] px-5 py-3 rounded-2xl text-sm font-medium shadow-xl relative ${
                      isMe 
                        ? "bg-emerald-600 text-white rounded-tr-none" 
                        : "bg-white/10 text-white rounded-tl-none border border-white/10 backdrop-blur-md"
                    }`}>
                      {msg.text}
                      <span className={`text-[8px] mt-1 block opacity-50 ${isMe ? "text-right" : "text-left"}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Redesigned Input Box */}
          <div className="p-6 bg-white/5 border-t border-white/10">
            <form 
              onSubmit={handleSendMessage}
              className="relative flex items-center"
            >
              <input 
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your message..."
                className="w-full bg-white/10 border border-white/10 rounded-[24px] pl-6 pr-16 py-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all backdrop-blur-xl"
              />
              <button 
                type="submit"
                disabled={!inputText.trim()}
                className="absolute right-2 p-3 rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-500/40 hover:bg-emerald-500 active:scale-95 transition-all disabled:opacity-50 disabled:bg-white/10 disabled:shadow-none"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </GlassCard>
      </div>
    </motion.div>
  );
}
