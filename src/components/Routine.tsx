import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Plus, Trash2, Edit2, Save, ChevronLeft, LayoutGrid, Clock, Calendar } from "lucide-react";
import GlassCard from "./GlassCard";
import { UserRole } from "./LoginView";
import { Language, TranslationType, translations } from "../lib/translations";

interface RoutineProps {
  classId: string;
  userRole: UserRole;
  onBack: () => void;
  language: Language;
}

export default function Routine({ classId, userRole, onBack, language }: RoutineProps) {
  const t: TranslationType = translations[language];
  const storageKey = `local_routine_${classId}`;
  
  const [headers, setHeaders] = useState<string[]>(() => {
    const cached = localStorage.getItem(`${storageKey}_headers`);
    return cached ? JSON.parse(cached) : ["Day", "09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00"];
  });

  const [rows, setRows] = useState<string[][]>(() => {
    const cached = localStorage.getItem(`${storageKey}_rows`);
    return cached ? JSON.parse(cached) : [
      ["Sat", "", "", ""],
      ["Sun", "", "", ""],
      ["Mon", "", "", ""],
      ["Tue", "", "", ""],
      ["Wed", "", "", ""],
      ["Thu", "", "", ""]
    ];
  });

  const [editingHeader, setEditingHeader] = useState<number | null>(null);
  const [editingCell, setEditingCell] = useState<{ r: number; c: number } | null>(null);

  useEffect(() => {
    localStorage.setItem(`${storageKey}_headers`, JSON.stringify(headers));
    localStorage.setItem(`${storageKey}_rows`, JSON.stringify(rows));
  }, [headers, rows, storageKey]);

  const addColumn = () => {
    if (userRole !== "Teacher") return;
    setHeaders([...headers, "New Period"]);
    setRows(rows.map(row => [...row, ""]));
  };

  const addRow = () => {
    if (userRole !== "Teacher") return;
    setRows([...rows, new Array(headers.length).fill("")]);
  };

  const deleteColumn = (index: number) => {
    if (userRole !== "Teacher" || index === 0) return;
    setHeaders(headers.filter((_, i) => i !== index));
    setRows(rows.map(row => row.filter((_, i) => i !== index)));
  };

  const deleteRow = (index: number) => {
    if (userRole !== "Teacher") return;
    setRows(rows.filter((_, i) => i !== index));
  };

  const updateHeader = (index: number, value: string) => {
    if (userRole !== "Teacher") return;
    const newHeaders = [...headers];
    newHeaders[index] = value;
    setHeaders(newHeaders);
  };

  const updateCell = (r: number, c: number, value: string) => {
    if (userRole !== "Teacher") return;
    const newRows = [...rows];
    newRows[r][c] = value;
    setRows(newRows);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-xl glass text-emerald-700">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-emerald-900">{t.classLabel} {classId} {t.routine}</h2>
            <p className="text-sm text-emerald-700/60">{t.academicSchedule}</p>
          </div>
        </div>
        
        {userRole === "Teacher" && (
          <div className="flex gap-2">
            <button 
              onClick={addColumn}
              className="p-3 rounded-2xl bg-emerald-600 text-white font-bold flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg"
            >
              <Plus className="w-4 h-4" /> Column
            </button>
            <button 
              onClick={addRow}
              className="p-3 rounded-2xl bg-emerald-600 text-white font-bold flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg"
            >
              <Plus className="w-4 h-4" /> Row
            </button>
          </div>
        )}
      </div>

      <GlassCard className="p-0 overflow-hidden border-white/40 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-emerald-600/10 backdrop-blur-md">
                {headers.map((header, i) => (
                  <th key={i} className="p-4 text-left border-r border-white/10 relative group">
                    {userRole === "Teacher" ? (
                      <div className="flex items-center gap-2">
                        <input 
                          type="text"
                          value={header}
                          onChange={(e) => updateHeader(i, e.target.value)}
                          className="bg-transparent border-none focus:outline-none text-xs font-black text-emerald-800 uppercase tracking-widest w-full"
                          placeholder="Header Name"
                        />
                        {i > 0 && (
                          <button 
                            onClick={() => deleteColumn(i)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded transition-all"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs font-black text-emerald-800 uppercase tracking-widest">{header}</span>
                    )}
                  </th>
                ))}
                {userRole === "Teacher" && <th className="w-10"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {rows.map((row, r) => (
                <tr key={r} className={`${r % 2 === 0 ? "bg-white/5" : "bg-transparent"} hover:bg-emerald-500/5 transition-colors group`}>
                  {row.map((cell, c) => (
                    <td key={c} className="p-4 border-r border-white/10">
                      {userRole === "Teacher" ? (
                        <input 
                          type="text"
                          value={cell}
                          onChange={(e) => updateCell(r, c, e.target.value)}
                          className={`w-full bg-transparent border-none focus:outline-none text-sm ${c === 0 ? "font-bold text-emerald-900" : "text-emerald-800"}`}
                          placeholder="..."
                        />
                      ) : (
                        <span className={`text-sm ${c === 0 ? "font-bold text-emerald-900" : "text-emerald-800"}`}>{cell || "—"}</span>
                      )}
                    </td>
                  ))}
                  {userRole === "Teacher" && (
                    <td className="w-10 p-2 text-center">
                      <button 
                        onClick={() => deleteRow(r)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </motion.div>
  );
}
