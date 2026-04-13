import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, Edit2, Check, X, Save, Search, User, Hash, Banknote, Plus, LayoutGrid } from "lucide-react";
import GlassCard from "./GlassCard";
import { UserRole } from "./LoginView";
import { db } from "../firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../lib/firestoreUtils";
import { Language, translations } from "../lib/translations";

interface ChargeEntry {
  roll: string;
  name: string;
  section: string;
  amount: string;
}

interface ExamChargeTableProps {
  examType: "Half Yearly" | "Annual";
  classId: string;
  userRole: UserRole;
  onBack: () => void;
  language: Language;
}

export default function ExamChargeTable({ examType, classId, userRole, onBack, language }: ExamChargeTableProps) {
  const t = translations[language];
  const [data, setData] = useState<ChargeEntry[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const docId = `exam_charge_${classId}_${examType.replace(/\s+/g, "_").toLowerCase()}`;
  const storageKey = `local_charges_${classId}_${examType.replace(/\s+/g, "_").toLowerCase()}`;

  useEffect(() => {
    // Load from localStorage first
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      setData(JSON.parse(cached));
      setIsLoading(false);
    }

    const unsub = onSnapshot(doc(db, "exam_charges", docId), (snapshot) => {
      if (snapshot.exists()) {
        const remoteData = snapshot.data()?.entries || [];
        setData(remoteData);
        localStorage.setItem(storageKey, JSON.stringify(remoteData));
      } else if (!cached) {
        // Initialize with empty data if not exists
        const initialData = Array.from({ length: 10 }, (_, i) => ({
          roll: (i + 1).toString(),
          name: "",
          section: "",
          amount: "0"
        }));
        setData(initialData);
      }
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `exam_charges/${docId}`);
      setIsLoading(false);
    });

    return () => unsub();
  }, [docId, storageKey]);

  const handleSave = async () => {
    try {
      await setDoc(doc(db, "exam_charges", docId), { entries: data });
      localStorage.setItem(storageKey, JSON.stringify(data));
      setIsEditing(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `exam_charges/${docId}`);
    }
  };

  const updateCell = (index: number, field: keyof ChargeEntry, value: string) => {
    const newData = [...data];
    newData[index] = { ...newData[index], [field]: value };
    setData(newData);
  };

  const addRow = () => {
    setData([...data, { roll: (data.length + 1).toString(), name: "", section: "", amount: "0" }]);
  };

  const filteredData = data.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.roll.includes(searchTerm)
  );

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
            <h2 className="text-2xl font-bold text-emerald-900">{examType === "Half Yearly" ? t.halfYearly : t.annual} {t.examCharge}</h2>
            <p className="text-sm text-emerald-700/60">{t.classLabel} {classId} • {t.spreadsheetView}</p>
          </div>
        </div>
        
        {userRole === "Teacher" && (
          <button 
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className={`p-3 rounded-2xl shadow-lg transition-all flex items-center gap-2 font-bold ${
              isEditing ? "bg-emerald-600 text-white" : "bg-white/40 text-emerald-700"
            }`}
          >
            {isEditing ? (
              <><Save className="w-5 h-5" /> {t.save}</>
            ) : (
              <><Edit2 className="w-5 h-5" /> {t.edit}</>
            )}
          </button>
        )}
      </div>

      <GlassCard className="p-0 overflow-hidden border-white/40">
        <div className="p-4 bg-emerald-500/5 border-b border-white/20 flex items-center gap-3">
          <Search className="w-4 h-4 text-emerald-600" />
          <input 
            type="text" 
            placeholder={t.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none focus:outline-none text-sm text-emerald-900 w-full placeholder:text-emerald-700/40"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-emerald-500/10">
                <th className="p-4 text-left text-xs font-black text-emerald-800 uppercase tracking-widest border-r border-white/10 w-20">
                  <div className="flex items-center gap-2"><Hash className="w-3 h-3" /> {t.roll}</div>
                </th>
                <th className="p-4 text-left text-xs font-black text-emerald-800 uppercase tracking-widest border-r border-white/10">
                  <div className="flex items-center gap-2"><User className="w-3 h-3" /> {t.studentName}</div>
                </th>
                <th className="p-4 text-left text-xs font-black text-emerald-800 uppercase tracking-widest border-r border-white/10 w-24">
                  <div className="flex items-center gap-2"><LayoutGrid className="w-3 h-3" /> {t.section}</div>
                </th>
                <th className="p-4 text-left text-xs font-black text-emerald-800 uppercase tracking-widest w-32">
                  <div className="flex items-center gap-2"><Banknote className="w-3 h-3" /> {t.amountTaka}</div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="p-12 text-center">
                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredData.length > 0 ? (
                filteredData.map((row, i) => (
                  <tr key={i} className={`${i % 2 === 0 ? "bg-white/5" : "bg-transparent"} hover:bg-emerald-500/5 transition-colors`}>
                    <td className="p-4 border-r border-white/10">
                      {isEditing ? (
                        <input 
                          type="text"
                          value={row.roll}
                          onChange={(e) => updateCell(i, "roll", e.target.value)}
                          className="w-full bg-white/30 border border-emerald-500/20 rounded px-2 py-1 text-sm text-emerald-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      ) : (
                        <span className="text-emerald-900 font-bold">{row.roll}</span>
                      )}
                    </td>
                    <td className="p-4 border-r border-white/10">
                      {isEditing ? (
                        <input 
                          type="text"
                          value={row.name}
                          onChange={(e) => updateCell(i, "name", e.target.value)}
                          className="w-full bg-white/30 border border-emerald-500/20 rounded px-2 py-1 text-sm text-emerald-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      ) : (
                        <span className="text-emerald-900 font-medium">{row.name || "—"}</span>
                      )}
                    </td>
                    <td className="p-4 border-r border-white/10">
                      {isEditing ? (
                        <input 
                          type="text"
                          value={row.section}
                          onChange={(e) => updateCell(i, "section", e.target.value)}
                          className="w-full bg-white/30 border border-emerald-500/20 rounded px-2 py-1 text-sm text-emerald-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      ) : (
                        <span className="text-emerald-900 font-medium">{row.section || "—"}</span>
                      )}
                    </td>
                    <td className="p-4">
                      {isEditing ? (
                        <input 
                          type="text"
                          value={row.amount}
                          onChange={(e) => updateCell(i, "amount", e.target.value)}
                          className="w-full bg-white/30 border border-emerald-500/20 rounded px-2 py-1 text-sm text-emerald-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      ) : (
                        <span className="text-emerald-700 font-black">{row.amount}</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-emerald-700/40 italic">{t.noRecords}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {isEditing && (
          <div className="p-4 bg-emerald-500/5 border-t border-white/20">
            <button 
              onClick={addRow}
              className="w-full py-2 border-2 border-dashed border-emerald-500/30 rounded-xl text-emerald-700 font-bold text-sm hover:bg-emerald-500/10 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> {t.addRow}
            </button>
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}
