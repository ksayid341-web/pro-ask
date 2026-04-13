import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Shield, User, Search, Check, Lock as LockIcon, Key, Save } from "lucide-react";
import GlassCard from "./GlassCard";
import { UserData } from "../App";

interface AdminPortalProps {
  onClose: () => void;
  onUpdateUserRole: (uid: string, newRole: "Teacher" | "Student") => void;
  superPassword: string;
  onUpdateSuperPassword: (newPass: string) => void;
}

export default function AdminPortal({ onClose, onUpdateUserRole, superPassword, onUpdateSuperPassword }: AdminPortalProps) {
  const [users, setUsers] = useState<UserData[]>([]);
  const [search, setSearch] = useState("");
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [newPass, setNewPass] = useState("");

  useEffect(() => {
    const savedUsers = JSON.parse(localStorage.getItem("app_users") || "[]");
    setUsers(savedUsers);
  }, []);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleRoleChange = (uid: string, currentRole: "Teacher" | "Student") => {
    const newRole = currentRole === "Teacher" ? "Student" : "Teacher";
    onUpdateUserRole(uid, newRole);
    
    // Update local state for immediate feedback
    setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: newRole } : u));
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-2xl max-h-[80vh] flex flex-col"
      >
        <GlassCard className="p-8 space-y-6 border-emerald-500/30 shadow-2xl overflow-hidden flex flex-col h-full">
          <div className="flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-600 text-white">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-emerald-900 tracking-tight">Super Admin Portal</h2>
                <p className="text-xs font-bold text-emerald-700/60 uppercase tracking-widest">Manage Roles & Security</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5">
              <X className="w-6 h-6 text-emerald-900" />
            </button>
          </div>

          <div className="flex gap-4 shrink-0">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-700/40" />
              <input 
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users by name or email..."
                className="w-full bg-white/50 border border-emerald-500/20 rounded-2xl pl-12 pr-4 py-3 text-emerald-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <button 
              onClick={() => setIsChangingPass(!isChangingPass)}
              className="px-6 py-3 rounded-2xl bg-emerald-100 text-emerald-700 font-bold text-sm flex items-center gap-2 hover:bg-emerald-200 transition-all"
            >
              <Key className="w-4 h-4" />
              Password
            </button>
          </div>

          <AnimatePresence>
            {isChangingPass && (
              <motion.div
                initial={{ opacity: 0, scaleY: 0, originY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                exit={{ opacity: 0, scaleY: 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden shrink-0 will-change-transform"
              >
                <div className="p-4 rounded-2xl bg-emerald-600 text-white space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black uppercase tracking-widest">Change Super Password</h4>
                    <LockIcon className="w-4 h-4" />
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="password"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      placeholder="Enter new super password..."
                      className="flex-1 bg-white/20 border border-white/20 rounded-xl px-4 py-2 text-white placeholder:text-white/40 focus:outline-none"
                    />
                    <button 
                      onClick={() => {
                        if (newPass.trim()) {
                          onUpdateSuperPassword(newPass);
                          setNewPass("");
                          setIsChangingPass(false);
                        }
                      }}
                      className="px-4 py-2 bg-white text-emerald-600 rounded-xl font-bold text-sm flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {filteredUsers.map((u) => (
              <div key={u.uid} className="p-4 rounded-2xl bg-white/30 border border-white/20 flex items-center justify-between group hover:bg-white/50 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full border-2 border-emerald-500/20 overflow-hidden">
                    <img src={u.photoURL} alt={u.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-900">{u.name}</h4>
                    <p className="text-[10px] text-emerald-700/60 font-bold uppercase">{u.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${u.role === "Teacher" ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-700"}`}>
                    {u.role}
                  </div>
                  <button 
                    onClick={() => handleRoleChange(u.uid, u.role)}
                    className="p-3 rounded-xl bg-white/40 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                    title="Switch Role"
                  >
                    {u.role === "Teacher" ? <User className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
