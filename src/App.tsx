/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, ChangeEvent, lazy, Suspense } from "react";
import { useNavigate, useLocation, Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Navigation, { TabType } from "./components/Navigation";
import Home from "./components/Home";
import GlassCard from "./components/GlassCard";
import LoginView, { UserRole } from "./components/LoginView";
import ErrorBoundary from "./components/ErrorBoundary";
import { auth, db } from "./firebase";
import { signInAnonymously } from "firebase/auth";
import { doc, setDoc, updateDoc, addDoc, onSnapshot, collection, deleteDoc, query, orderBy, serverTimestamp } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "./lib/firestoreUtils";
import { motion, AnimatePresence } from "motion/react";
import { Bell, Image as ImageIcon, Info, GraduationCap, Users, Calendar, LogOut, Plus, Edit2, Phone, Mail, X, Trash2, Upload, Check, School, ChevronDown, LayoutGrid, Settings, Shield, Lock as LockIcon } from "lucide-react";
import { useAuth } from "./components/AuthContext";
import { compressImage } from "./lib/imageUtils";
import { ImageUploader } from "./components/ImageUploader";
import { uploadToImgBB } from "./lib/imgbb";
import { translations, Language } from "./lib/translations";

// Lazy load non-critical components for faster initial load
const ClassPortal = lazy(() => import("./components/ClassPortal"));
const NoticeView = lazy(() => import("./components/NoticeView"));
const AIAssistant = lazy(() => import("./components/AIAssistant"));
const GlobalInbox = lazy(() => import("./components/GlobalInbox"));
const GlobeFeed = lazy(() => import("./components/GlobeFeed"));
const Profile = lazy(() => import("./components/Profile"));

export interface UserData {
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
}

export interface TeacherProfile {
  uid: string;
  name: string;
  designation: string;
  email: string;
  img: string;
  phone: string;
}

export interface StudentProfile {
  uid: string;
  name: string;
  rollId: string;
  className: string;
  section: string;
  email: string;
}

export interface HomeworkItem {
  id: string;
  task: string;
  date: string;
}

export interface HomeworkData {
  [classId: string]: HomeworkItem[];
}

export interface SuggestionItem {
  id: string;
  text: string;
  date: string;
}

export interface BookSuggestionData {
  [bookKey: string]: SuggestionItem[];
}

export interface NoticeItem {
  id: string;
  title: string;
  content: string;
  type: "Important" | "General";
  date: string;
}

export interface GalleryImage {
  id: string;
  url: string;
  caption: string;
  uploadedBy: string;
  timestamp: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>("Home");
  const { user, setUser, logout } = useAuth();
  const [showGreeting, setShowGreeting] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('app_theme') === 'dark');
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('app_lang') as Language) || "EN");
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname.substring(1);
    if (!path) {
      setActiveTab("Home");
      return;
    }
    const tab = path.charAt(0).toUpperCase() + path.slice(1);
    const validTabs: TabType[] = ["Home", "Inbox", "Profile", "Globe", "Classes", "Notice", "AI", "Gallery", "About"];
    if (validTabs.includes(tab as TabType)) {
      setActiveTab(tab as TabType);
    }
  }, [location]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    navigate(`/${tab.toLowerCase() === "home" ? "" : tab.toLowerCase()}`);
  };
  
  // Ensure Firebase Auth session is active if user is logged in
  useEffect(() => {
    if (user && !auth.currentUser) {
      // Only try anonymous if no other provider is active
      signInAnonymously(auth).catch(err => {
        if (err.code !== 'auth/admin-restricted-operation') {
          console.error("Auto-signin failed:", err);
        }
      });
    }
  }, [user]);

  // Sync current user to app_users for profile lookups
  useEffect(() => {
    if (user) {
      const savedUsers = JSON.parse(localStorage.getItem("app_users") || "[]");
      const userIndex = savedUsers.findIndex((u: any) => u.uid === user.uid);
      if (userIndex > -1) {
        savedUsers[userIndex] = { ...savedUsers[userIndex], ...user };
      } else {
        savedUsers.push(user);
      }
      localStorage.setItem("app_users", JSON.stringify(savedUsers));
    }
  }, [user]);

  // Hydrate states from localStorage on init
  useEffect(() => {
    const hydrate = (key: string, setter: any) => {
      const data = localStorage.getItem(key);
      if (data) setter(JSON.parse(data));
    };

    hydrate('app_notices', setNotices);
    hydrate('app_homework', setHomework);
    hydrate('app_suggestions', setBookSuggestions);
    hydrate('app_pdfs', setBookPdfs);
    hydrate('app_gallery', setGalleryImages);
    hydrate('app_teacher_profiles', setTeacherProfiles);
    hydrate('app_student_profiles', setStudentProfiles);
  }, []);

  const t = translations[language];
  
  const [examTargetDate, setExamTargetDate] = useState("2027-02-01T00:00:00");
  const [schoolStatus, setSchoolStatus] = useState(() => localStorage.getItem('app_status') || "Class Ongoing");
  const [upcomingEvent, setUpcomingEvent] = useState({ title: "Annual Sports Meet 2026", description: "Join us for a day of athletic excellence and school spirit on April 15th." });
  const [isEditingExam, setIsEditingExam] = useState(false);
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [aboutText, setAboutText] = useState("Founded in 1995, TNHS ELITE ASK has been a beacon of knowledge for over three decades. What started as a small community school has grown into a premier educational institution, consistently producing top-tier results and fostering a culture of innovation and leadership.");
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState<UserData | any | null>(null);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [homework, setHomework] = useState<HomeworkData>({});
  
  const [bookSuggestions, setBookSuggestions] = useState<BookSuggestionData>({});
  const [bookPdfs, setBookPdfs] = useState<Record<string, string>>({});
  const [heroBannerUrl, setHeroBannerUrl] = useState<string | null>(() => localStorage.getItem('app_banner'));
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<GalleryImage | null>(null);
  const [superPassword, setSuperPassword] = useState(() => localStorage.getItem('app_super_pass') || "8958");
  const [showAdminPortal, setShowAdminPortal] = useState(false);
  const [adminAuthMode, setAdminAuthMode] = useState<"portal" | "switch">("portal");
  const [showRoleSwitchToast, setShowRoleSwitchToast] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordToChange, setPasswordToChange] = useState("");
  const [adminAuthPass, setAdminAuthPass] = useState("");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showAdminAuth, setShowAdminAuth] = useState(false);

  // New Academic States
  const [results, setResults] = useState<any>({});
  const [attendance, setAttendance] = useState<any>({});
  const [routines, setRoutines] = useState<any>({});
  const [notices, setNotices] = useState<NoticeItem[]>([]);

  const [teacherProfiles, setTeacherProfiles] = useState<TeacherProfile[]>([]);

  const [studentProfiles, setStudentProfiles] = useState<StudentProfile[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherProfile | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editData, setEditData] = useState({ designation: "", phone: "" });

  const [signInTrigger, setSignInTrigger] = useState<{name: string, role: string} | null>(null);

  // Initialize localStorage empty objects
  useEffect(() => {
    const arrayKeys = ['app_notices', 'app_homework', 'app_suggestions', 'app_gallery', 'app_teacher_profiles', 'app_student_profiles'];
    const objectKeys = ['app_results', 'app_attendance', 'app_routines', 'app_pdfs'];
    
    arrayKeys.forEach(key => {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify([]));
      }
    });
    
    objectKeys.forEach(key => {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify({}));
      }
    });
  }, []);

  // Firestore Sync
  useEffect(() => {
    const path = "users";
    const unsubTeachers = onSnapshot(collection(db, path), (snapshot) => {
      const teachers: TeacherProfile[] = [];
      const students: StudentProfile[] = [];
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.role === "Teacher") {
          teachers.push({
            uid: data.uid,
            name: data.name,
            designation: data.designation,
            email: data.email,
            img: data.photoURL,
            phone: data.phoneNumber
          });
        } else {
          students.push({
            uid: data.uid,
            name: data.name,
            rollId: data.rollId,
            className: data.className,
            section: data.section || "N/A",
            email: data.email
          });
        }
      });
      setTeacherProfiles(teachers);
      setStudentProfiles(students);
      localStorage.setItem('app_teacher_profiles', JSON.stringify(teachers));
      localStorage.setItem('app_student_profiles', JSON.stringify(students));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    return () => unsubTeachers();
  }, []);

  // Sync Gallery and Settings
  useEffect(() => {
    const galleryPath = "gallery";
    const unsubGallery = onSnapshot(collection(db, galleryPath), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }) as GalleryImage);
      
      // Client-side sort to handle null timestamps from serverTimestamp()
      const sortedItems = items.sort((a: any, b: any) => {
        const timeA = a.timestamp?.toMillis?.() || (typeof a.timestamp === 'string' ? new Date(a.timestamp).getTime() : Date.now());
        const timeB = b.timestamp?.toMillis?.() || (typeof b.timestamp === 'string' ? new Date(b.timestamp).getTime() : Date.now());
        return timeB - timeA;
      });
      
      setGalleryImages(sortedItems);
      localStorage.setItem('app_gallery', JSON.stringify(sortedItems));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, galleryPath);
    });

    const settingsPath = "settings/global";
    const unsubSettings = onSnapshot(doc(db, "settings", "global"), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.examTargetDate) setExamTargetDate(data.examTargetDate);
        if (data.schoolStatus) {
          setSchoolStatus(data.schoolStatus);
          localStorage.setItem('app_status', data.schoolStatus);
        }
        if (data.upcomingEventTitle || data.upcomingEventDescription) {
          setUpcomingEvent(prev => ({
            title: data.upcomingEventTitle || prev.title,
            description: data.upcomingEventDescription || prev.description
          }));
        }
        if (data.aboutText) setAboutText(data.aboutText);
        if (data.heroBannerUrl) {
          setHeroBannerUrl(data.heroBannerUrl);
          localStorage.setItem('app_banner', data.heroBannerUrl);
        } else {
          setHeroBannerUrl(null);
          localStorage.removeItem('app_banner');
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, settingsPath);
    });

    return () => {
      unsubGallery();
      unsubSettings();
    };
  }, []);

  // Sync Notices, Homework, and Attendance
  useEffect(() => {
    if (!user) return;

    const noticesPath = "notices";
    const unsubNotices = onSnapshot(collection(db, noticesPath), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }) as NoticeItem);
      
      // Client-side sort to handle null timestamps from serverTimestamp()
      const sortedItems = items.sort((a: any, b: any) => {
        const timeA = a.timestamp?.toMillis?.() || Date.now();
        const timeB = b.timestamp?.toMillis?.() || Date.now();
        return timeB - timeA;
      });
      
      setNotices(sortedItems);
      localStorage.setItem('app_notices', JSON.stringify(sortedItems));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, noticesPath);
    });

    const homeworkPath = "homework";
    const unsubHomework = onSnapshot(collection(db, homeworkPath), (snapshot) => {
      const hwData: HomeworkData = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (!hwData[data.classId]) hwData[data.classId] = [];
        hwData[data.classId].push({
          id: doc.id,
          task: data.task,
          date: data.date,
          timestamp: data.timestamp
        } as any);
      });
      
      // Sort each class's homework
      Object.keys(hwData).forEach(classId => {
        hwData[classId].sort((a: any, b: any) => {
          const timeA = a.timestamp?.toMillis?.() || (typeof a.timestamp === 'string' ? new Date(a.timestamp).getTime() : Date.now());
          const timeB = b.timestamp?.toMillis?.() || (typeof b.timestamp === 'string' ? new Date(b.timestamp).getTime() : Date.now());
          return timeB - timeA;
        });
      });
      
      setHomework(hwData);
      localStorage.setItem('app_homework', JSON.stringify(hwData));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, homeworkPath);
    });

    const attendancePath = "attendance";
    const unsubAttendance = onSnapshot(collection(db, attendancePath), (snapshot) => {
      const attData: any = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        attData[data.classId] = data.percentage;
      });
      setAttendance(attData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, attendancePath);
    });

    const suggestionsPath = "suggestions";
    const unsubSuggestions = onSnapshot(collection(db, suggestionsPath), (snapshot) => {
      const sugData: BookSuggestionData = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (!sugData[data.bookKey]) sugData[data.bookKey] = [];
        sugData[data.bookKey].push({
          id: doc.id,
          text: data.text,
          date: data.date,
          timestamp: data.timestamp
        } as any);
      });
      
      // Sort suggestions
      Object.keys(sugData).forEach(key => {
        sugData[key].sort((a: any, b: any) => {
          const timeA = a.timestamp?.toMillis?.() || (typeof a.timestamp === 'string' ? new Date(a.timestamp).getTime() : Date.now());
          const timeB = b.timestamp?.toMillis?.() || (typeof b.timestamp === 'string' ? new Date(b.timestamp).getTime() : Date.now());
          return timeB - timeA;
        });
      });
      
      setBookSuggestions(sugData);
      localStorage.setItem('app_suggestions', JSON.stringify(sugData));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, suggestionsPath);
    });

    const routinesPath = "routines";
    const unsubRoutines = onSnapshot(collection(db, routinesPath), (snapshot) => {
      const routData: any = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        routData[data.classId] = data.data;
      });
      setRoutines(routData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, routinesPath);
    });

    const resultsPath = "results";
    const unsubResults = onSnapshot(collection(db, resultsPath), (snapshot) => {
      const resData: any = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data && data.classId && data.userId) {
          if (!resData[data.classId]) resData[data.classId] = {};
          resData[data.classId][data.userId] = data.subjects;
        }
      });
      setResults(resData);
      localStorage.setItem('app_results', JSON.stringify(resData));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, resultsPath);
    });

    const pdfsPath = "pdfs";
    const unsubPdfs = onSnapshot(collection(db, pdfsPath), (snapshot) => {
      const pdfData: Record<string, string> = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        pdfData[data.id] = data.url;
      });
      setBookPdfs(pdfData);
      localStorage.setItem('app_pdfs', JSON.stringify(pdfData));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, pdfsPath);
    });

    return () => {
      unsubNotices();
      unsubHomework();
      unsubAttendance();
      unsubSuggestions();
      unsubRoutines();
      unsubResults();
      unsubPdfs();
    };
  }, []);

  // Sync states to localStorage for persistence
  useEffect(() => {
    localStorage.setItem('app_status', schoolStatus);
  }, [schoolStatus]);

  useEffect(() => {
    if (heroBannerUrl) {
      localStorage.setItem('app_banner', heroBannerUrl);
    } else {
      localStorage.removeItem('app_banner');
    }
  }, [heroBannerUrl]);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add("dark-mode");
      document.body.classList.remove("light-mode");
      localStorage.setItem('app_theme', 'dark');
    } else {
      document.body.classList.add("light-mode");
      document.body.classList.remove("dark-mode");
      localStorage.setItem('app_theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('app_lang', language);
  }, [language]);

  useEffect(() => {
    if (user) {
      setShowGreeting(true);
      const timer = setTimeout(() => setShowGreeting(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    const targetDate = new Date(examTargetDate).getTime();
    
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;
      
      if (distance < 0) {
        setTimeLeft({ days: 0, hours: 0, mins: 0, secs: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        mins: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        secs: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examTargetDate]);

  const [tourTrigger, setTourTrigger] = useState(0);

  const handleUpdateSchoolStatus = async (status: string) => {
    if (!user || user.role !== "Teacher") return;
    const path = "settings/global";
    try {
      setSchoolStatus(status);
      localStorage.setItem('app_status', status);
      await setDoc(doc(db, "settings", "global"), { schoolStatus: status }, { merge: true });
      announceSuccess(`School status updated to ${status}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const handleLogin = async (userData: UserData) => {
    try {
      // Ensure Firebase Auth session exists for security rules
      let firebaseUid = userData.uid;
      
      // Only sign in anonymously if we don't already have a valid session
      // This prevents overwriting Google Sign-In UIDs
      if (!auth.currentUser) {
        try {
          const authResult = await signInAnonymously(auth);
          firebaseUid = authResult.user.uid;
        } catch (authErr: any) {
          if (authErr.code === 'auth/admin-restricted-operation') {
            console.warn("Anonymous Auth is disabled. Proceeding with local UID.");
          } else {
            throw authErr;
          }
        }
      } else {
        // If already authenticated (e.g. via Google), use that UID
        firebaseUid = auth.currentUser.uid;
        console.log("Using existing authenticated UID:", firebaseUid);
      }
      
      const finalUserData = { 
        ...userData, 
        uid: firebaseUid,
        portalId: userData.uid 
      };

      setUser(finalUserData);
      localStorage.setItem('user_name', userData.name);
      if (userData.rollId) localStorage.setItem('user_roll', userData.rollId);
      
      // Save to Firestore
      const path = `users/${firebaseUid}`;
      await setDoc(doc(db, "users", firebaseUid), {
        ...finalUserData,
        lastLogin: serverTimestamp()
      }, { merge: true });

      setSignInTrigger({ name: userData.name, role: userData.role });

      const hasSeenTour = localStorage.getItem(`tnhs_tour_${userData.name}_${userData.role}`);
      if (!hasSeenTour) {
        setTourTrigger(prev => prev + 1);
        localStorage.setItem(`tnhs_tour_${userData.name}_${userData.role}`, "true");
      }
    } catch (error) {
      console.error("Login failed:", error);
      announceError("Login failed. Please check your connection.");
    }
  };

  const handleRoleSwitch = (role: "Teacher" | "Student") => {
    if (!user) return;
    const updatedUser = { ...user, role };
    setUser(updatedUser);
  };

  const handleUpdateUserRole = async (uid: string, newRole: "Teacher" | "Student") => {
    const path = `users/${uid}`;
    try {
      // Update current user state immediately for "Super Fast" feel
      if (user && user.uid === uid) {
        setUser({ ...user, role: newRole });
      }
      
      // Update app_users in localStorage
      const savedUsers = JSON.parse(localStorage.getItem("app_users") || "[]");
      const updatedUsers = savedUsers.map((u: any) => u.uid === uid ? { ...u, role: newRole } : u);
      localStorage.setItem("app_users", JSON.stringify(updatedUsers));
      
      await setDoc(doc(db, "users", uid), { role: newRole }, { merge: true });
      announceSuccess(`User role updated to ${newRole}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const handleUpdateProfilePic = async (uid: string, photoURL: string) => {
    // Explicitly handle the user's reported UID if it matches
    const targetUid = uid === 'G7nosxOfdBOHmLowS6lVKwQQ0p2' ? 'G7nosxOfdBOHmLowS6lVKwQQ0p2' : uid;
    const path = `users/${targetUid}`;
    
    try {
      console.log(`Updating photoURL for target UID ${targetUid} to: ${photoURL}`);
      
      // Update current user state immediately if it's the logged in user
      if (user && user.uid === targetUid) {
        setUser({ ...user, photoURL });
      }
      
      // Update app_users in localStorage
      const savedUsers = JSON.parse(localStorage.getItem("app_users") || "[]");
      const updatedUsers = savedUsers.map((u: any) => u.uid === targetUid ? { ...u, photoURL } : u);
      localStorage.setItem("app_users", JSON.stringify(updatedUsers));
      
      // Explicitly update the document in Firestore
      await setDoc(doc(db, "users", targetUid), { photoURL }, { merge: true });
      console.log(`Firestore document users/${targetUid} updated successfully`);
      
      announceSuccess("Profile picture updated successfully");
    } catch (error: any) {
      console.error("Profile picture update failed in App.tsx:", error);
      // Re-throw to be caught by the component and shown to the user
      throw new Error(error.message || "Failed to save profile picture to database");
    }
  };

  const handleUpdateSuperPassword = (newPass: string) => {
    setSuperPassword(newPass);
    localStorage.setItem('app_super_pass', newPass);
    announceSuccess("Super Admin password updated");
  };

  const handleUpdateUserPassword = async (newPass: string) => {
    if (!user) return;
    const path = `users/${user.uid}`;
    try {
      await setDoc(doc(db, "users", user.uid), { password: newPass }, { merge: true });
      
      // Update app_users in localStorage
      const savedUsers = JSON.parse(localStorage.getItem("app_users") || "[]");
      const updatedUsers = savedUsers.map((u: any) => u.uid === user.uid ? { ...u, password: newPass } : u);
      localStorage.setItem("app_users", JSON.stringify(updatedUsers));
      
      announceSuccess("Your password has been updated");
      setShowPasswordChange(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const handleOpenAdminPortal = () => {
    setAdminAuthMode("portal");
    setShowAdminAuth(true);
  };

  const handleDirectRoleSwitch = () => {
    setAdminAuthMode("switch");
    setShowAdminAuth(true);
  };

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminAuthPass === superPassword) {
      setIsAdminAuthenticated(true);
      setShowAdminAuth(false);
      setAdminAuthPass("");
      
      if (adminAuthMode === "switch") {
        const newRole = user?.role === "Teacher" ? "Student" : "Teacher";
        handleUpdateUserRole(user?.uid!, newRole);
        setShowRoleSwitchToast(true);
        setTimeout(() => setShowRoleSwitchToast(false), 3000);
      } else {
        setShowAdminPortal(true);
      }
    } else {
      announceError("Invalid Super Password");
    }
  };

  const handleLogout = () => {
    logout();
    setActiveTab("Home");
    announceSuccess("Logged out successfully");
  };

  const handleUpdateExamDate = async (newDate: string) => {
    if (!user || user.role !== "Teacher") return;
    const path = "settings/global";
    try {
      await updateDoc(doc(db, "settings", "global"), { examTargetDate: newDate });
      setIsEditingExam(false);
      announceSuccess("Exam date updated");
    } catch (error) {
      try {
        await setDoc(doc(db, "settings", "global"), { examTargetDate: newDate }, { merge: true });
        setIsEditingExam(false);
        announceSuccess("Exam date updated");
      } catch (innerError) {
        handleFirestoreError(innerError, OperationType.WRITE, path);
      }
    }
  };

  const handleUpdateEvent = async (title: string, description: string) => {
    if (!user || user.role !== "Teacher") return;
    const path = "settings/global";
    try {
      await updateDoc(doc(db, "settings", "global"), { 
        upcomingEventTitle: title,
        upcomingEventDescription: description
      });
      setIsEditingEvent(false);
      announceSuccess("Upcoming event updated");
    } catch (error) {
      try {
        await setDoc(doc(db, "settings", "global"), { 
          upcomingEventTitle: title,
          upcomingEventDescription: description
        }, { merge: true });
        setIsEditingEvent(false);
        announceSuccess("Upcoming event updated");
      } catch (innerError) {
        handleFirestoreError(innerError, OperationType.WRITE, path);
      }
    }
  };

  const handleUpdateAbout = async (text: string) => {
    if (!user || user.role !== "Teacher") return;
    const path = "settings/global";
    try {
      await updateDoc(doc(db, "settings", "global"), { aboutText: text });
      setIsEditingAbout(false);
      announceSuccess("The about section has been updated");
    } catch (error) {
      // If document doesn't exist, create it
      try {
        await setDoc(doc(db, "settings", "global"), { aboutText: text });
        setIsEditingAbout(false);
        announceSuccess("The about section has been updated");
      } catch (innerError) {
        handleFirestoreError(innerError, OperationType.WRITE, path);
      }
    }
  };

  const handleUpdateBanner = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!user || user.role !== "Teacher") return;
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        const path = "settings/global";
        try {
          // Client-side compression
          const compressed = await compressImage(base64);
          
          // Upload to ImgBB
          const downloadURL = await uploadToImgBB(compressed);
          
          setHeroBannerUrl(downloadURL);
          localStorage.setItem('app_banner', downloadURL);
          await setDoc(doc(db, "settings", "global"), { heroBannerUrl: downloadURL }, { merge: true });
          announceSuccess("Hero banner updated successfully");
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, path);
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Banner processing failed:", error);
      setIsUploading(false);
    }
  };

  const handleDeleteBanner = async () => {
    if (!user || user.role !== "Teacher") return;
    const path = "settings/global";
    try {
      await setDoc(doc(db, "settings", "global"), { heroBannerUrl: null }, { merge: true });
      announceSuccess("Hero banner removed");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const announceSuccess = (message: string) => {
    const toast = document.createElement("div");
    toast.className = "fixed bottom-24 left-1/2 -translate-x-1/2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold shadow-2xl z-50 animate-bounce-in";
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const announceError = (message: string) => {
    const toast = document.createElement("div");
    toast.className = "fixed bottom-24 left-1/2 -translate-x-1/2 px-6 py-3 bg-red-600 text-white rounded-2xl font-bold shadow-2xl z-50 animate-bounce-in";
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const handleUploadImage = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!user || user.role !== "Teacher" || !file) return;

    setIsUploading(true);
    
    try {
      const compressed = await compressImage(file);
      
      // Upload to ImgBB
      const downloadURL = await uploadToImgBB(compressed);

      const id = Math.random().toString(36).substr(2, 9);
      const newImage: any = {
        url: downloadURL,
        caption: "New Gallery Photo",
        uploadedBy: user.name,
        timestamp: serverTimestamp()
      };
      
      await setDoc(doc(db, "gallery", id), newImage);
      announceSuccess("The gallery has been updated");
    } catch (error) {
      console.error("Error uploading image:", error);
      announceError("Upload failed");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleDeleteGalleryImage = async (id: string) => {
    if (!user || user.role !== "Teacher") return;
    const path = `gallery/${id}`;
    try {
      await deleteDoc(doc(db, "gallery", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleDeleteProfile = async (uid: string) => {
    if (!user || user.role !== "Teacher") return;
    const path = `users/${uid}`;
    try {
      await deleteDoc(doc(db, "users", uid));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const deleteHomework = useCallback(async (classId: string, id: string) => {
    if (!user || user.role !== "Teacher") return;
    const path = `homework/${id}`;
    try {
      await deleteDoc(doc(db, "homework", id));
      announceSuccess("Homework removed");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }, [user]);

  const deleteNotice = useCallback(async (id: string) => {
    if (!user || user.role !== "Teacher") return;
    const path = `notices/${id}`;
    try {
      await deleteDoc(doc(db, "notices", id));
      announceSuccess("Notice deleted successfully");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }, [user]);

  const deleteBookSuggestion = useCallback(async (bookKey: string, id: string) => {
    if (!user || user.role !== "Teacher") return;
    const path = `suggestions/${id}`;
    try {
      await deleteDoc(doc(db, "suggestions", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }, [user]);

  const [postTrigger, setPostTrigger] = useState<{ classId: string; type: string; isUpdate?: boolean } | null>(null);

  const addHomework = useCallback(async (classId: string, task: string) => {
    if (!user || user.role !== "Teacher") return;
    const date = new Date().toLocaleDateString();
    const id = Math.random().toString(36).substr(2, 9);
    const path = `homework/${id}`;
    try {
      await setDoc(doc(db, "homework", id), {
        classId,
        task,
        date,
        timestamp: serverTimestamp()
      });
      setPostTrigger({ classId, type: "Homework" });
      announceSuccess(`Homework added for Class ${classId}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }, [user]);

  const updateHomework = useCallback(async (classId: string, id: string, newTask: string) => {
    if (!user || user.role !== "Teacher") return;
    const path = `homework/${id}`;
    try {
      await setDoc(doc(db, "homework", id), { task: newTask }, { merge: true });
      setPostTrigger({ classId, type: "Homework", isUpdate: true });
      announceSuccess("Homework updated successfully");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }, [user]);

  const addBookSuggestion = useCallback(async (bookKey: string, suggestion: string) => {
    if (!user || user.role !== "Teacher") return;
    const date = new Date().toLocaleDateString();
    const id = Math.random().toString(36).substr(2, 9);
    const path = `suggestions/${id}`;
    try {
      await setDoc(doc(db, "suggestions", id), {
        bookKey,
        text: suggestion,
        date,
        timestamp: serverTimestamp()
      });
      setPostTrigger({ classId: bookKey.split("-")[0], type: "Suggestion" });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }, [user]);

  const updateBookSuggestion = useCallback(async (bookKey: string, id: string, newText: string) => {
    if (!user || user.role !== "Teacher") return;
    const path = `suggestions/${id}`;
    try {
      await setDoc(doc(db, "suggestions", id), { text: newText }, { merge: true });
      setPostTrigger({ classId: bookKey.split("-")[0], type: "Suggestion", isUpdate: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }, [user]);

  const updateAttendance = useCallback(async (classId: string, percentage: number) => {
    if (!user || user.role !== "Teacher") return;
    const path = `attendance/${classId}`;
    try {
      await setDoc(doc(db, "attendance", classId), {
        classId,
        percentage,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }, [user]);

  const updateRoutine = useCallback(async (classId: string, headers: string[], rows: string[][]) => {
    if (!user || user.role !== "Teacher") return;
    const path = `routines/${classId}`;
    try {
      await setDoc(doc(db, "routines", classId), {
        classId,
        headers,
        rows,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }, [user]);

  const addNotice = useCallback(async (title: string, content: string, type: "Important" | "General") => {
    if (!user || user.role !== "Teacher") return;
    const path = "notices";
    try {
      await addDoc(collection(db, "notices"), {
        title,
        content,
        type,
        date: new Date().toLocaleDateString(),
        timestamp: serverTimestamp()
      });
      announceSuccess("Notice posted successfully");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }, [user]);

  const updateNotice = useCallback(async (id: string, newTitle: string, newContent: string) => {
    if (!user || user.role !== "Teacher") return;
    const path = `notices/${id}`;
    try {
      await setDoc(doc(db, "notices", id), {
        title: newTitle,
        content: newContent
      }, { merge: true });
      setPostTrigger({ classId: "Global", type: "Notice", isUpdate: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSplashVisible(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  if (!user) {
    return <LoginView 
      onLogin={handleLogin} 
      isDarkMode={isDarkMode} 
      toggleDarkMode={() => setIsDarkMode(!isDarkMode)} 
      language={language}
    />;
  }

  const handleUpdateSelfProfile = async () => {
    if (!user || user.role !== "Teacher") return;
    const path = `users/${user.uid}`;
    try {
      await updateDoc(doc(db, "users", user.uid), {
        designation: editData.designation,
        phoneNumber: editData.phone
      });
      
      setUser(prev => prev ? { ...prev, designation: editData.designation, phone: editData.phone } : null);
      setIsEditingProfile(false);
      setSelectedTeacher(null);
      announceSuccess("Profile updated successfully");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const AdminPortal = lazy(() => import("./components/AdminPortal"));

  const updateBookPdf = useCallback(async (bookKey: string, url: string) => {
    if (!user || user.role !== "Teacher") return;
    const path = `pdfs/${bookKey}`;
    try {
      await setDoc(doc(db, "pdfs", bookKey), {
        id: bookKey,
        url,
        timestamp: new Date().toISOString()
      });
      announceSuccess("PDF uploaded successfully");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }, [user]);

  const renderContent = () => {
    const statusColors: any = {
      "Class Ongoing": "bg-emerald-500",
      "Tiffin Time": "bg-yellow-400",
      "School Closed": "bg-orange-500",
      "Occasion Running": "bg-purple-500"
    };

    const statusGlows: any = {
      "Class Ongoing": "shadow-[0_0_40px_rgba(16,185,129,0.8)]",
      "Tiffin Time": "shadow-[0_0_40px_rgba(250,204,21,0.8)]",
      "School Closed": "shadow-[0_0_40px_rgba(249,115,22,0.8)]",
      "Occasion Running": "shadow-[0_0_40px_rgba(168,85,247,0.8)]"
    };

    const statusLabels: any = {
      "Class Ongoing": "Academic sessions are proceeding as scheduled.",
      "Tiffin Time": "Break is active. Students are in the playground.",
      "School Closed": "The campus is currently closed for the day.",
      "Occasion Running": "A special event is currently being celebrated."
    };

    return (
      <Suspense fallback={
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="w-full"
        >
          {(() => {
            switch (activeTab) {
              case "Home":
                return (
                  <Home 
                    user={user} 
                    language={language} 
                    heroBannerUrl={heroBannerUrl} 
                    schoolStatus={schoolStatus}
                    statusColors={statusColors}
                    statusGlows={statusGlows}
                    statusLabels={statusLabels}
                    notices={notices}
                    showQuickActions={showQuickActions}
                    setShowQuickActions={setShowQuickActions}
                    isEditingExam={isEditingExam}
                    setIsEditingExam={setIsEditingExam}
                    examTargetDate={examTargetDate}
                    setExamTargetDate={setExamTargetDate}
                    handleUpdateExamDate={handleUpdateExamDate}
                    timeLeft={{
                      days: timeLeft.days,
                      hours: timeLeft.hours,
                      minutes: timeLeft.mins,
                      seconds: timeLeft.secs
                    }}
                    upcomingEvent={upcomingEvent}
                    setUpcomingEvent={setUpcomingEvent}
                    isEditingEvent={isEditingEvent}
                    setIsEditingEvent={setIsEditingEvent}
                    handleUpdateEvent={handleUpdateEvent}
                    setActiveTab={setActiveTab}
                    handleUpdateBanner={handleUpdateBanner}
                    handleUpdateSchoolStatus={handleUpdateSchoolStatus}
                    handleDeleteBanner={handleDeleteBanner}
                  />
                );
              case "Inbox":
                return <GlobalInbox user={user} language={language} onClose={() => setActiveTab("Home")} />;
              case "Profile":
                return <Profile user={user} profileUser={user} language={language} isPage={true} onUpdateProfilePic={handleUpdateProfilePic} />;
              case "Globe":
                return <GlobeFeed user={user} language={language} onViewProfile={(uid) => {
                  const savedUsers = JSON.parse(localStorage.getItem("app_users") || "[]");
                  const foundUser = savedUsers.find((u: any) => u.uid === uid);
                  if (foundUser) {
                    setSelectedUserProfile(foundUser);
                  } else {
                    const teacher = teacherProfiles.find(t => t.uid === uid);
                    if (teacher) {
                      setSelectedUserProfile({ ...teacher, role: "Teacher", photoURL: teacher.img });
                    }
                  }
                }} />;
              case "Classes":
                return (
                  <ClassPortal 
                    userRole={user.role} 
                    userClass={user.className} 
                    homework={homework || {}}
                    onAddHomework={addHomework}
                    onUpdateHomework={updateHomework}
                    onDeleteHomework={deleteHomework}
                    bookSuggestions={bookSuggestions || {}}
                    onAddSuggestion={addBookSuggestion}
                    onUpdateSuggestion={updateBookSuggestion}
                    onDeleteSuggestion={deleteBookSuggestion}
                    attendance={attendance || {}}
                    onUpdateAttendance={updateAttendance}
                    routines={routines || {}}
                    onUpdateRoutine={updateRoutine}
                    language={language}
                    bookPdfs={bookPdfs || {}}
                    onUpdateBookPdf={updateBookPdf}
                  />
                );
              case "Notice":
                return (
                  <NoticeView 
                    user={user} 
                    notices={notices} 
                    onAddNotice={addNotice} 
                    onUpdateNotice={updateNotice} 
                    onDeleteNotice={deleteNotice}
                    language={language}
                  />
                );
              case "AI":
                return <AIAssistant user={user} language={language} />;
              case "Gallery":
                return (
                  <div className="px-6 space-y-6 pb-32">
                    <div className="flex items-center justify-between">
                      <h2 className="text-3xl font-bold text-emerald-900">{t.gallery}</h2>
                      <AnimatePresence>
                        {user.role === "Teacher" && (
                          <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="relative"
                          >
                            <ImageUploader
                              id="gallery-upload"
                              isUploading={isUploading}
                              onUpload={async (base64) => {
                                const id = Math.random().toString(36).substr(2, 9);
                                try {
                                  setIsUploading(true);
                                  const downloadURL = await uploadToImgBB(base64);
                                  const newImage: any = {
                                    url: downloadURL,
                                    caption: "New Gallery Photo",
                                    uploadedBy: user.name,
                                    timestamp: serverTimestamp()
                                  };
                                  await setDoc(doc(db, "gallery", id), newImage);
                                  announceSuccess("The gallery has been updated");
                                } catch (error) {
                                  console.error("Gallery upload failed:", error);
                                  announceError("Failed to upload to gallery");
                                } finally {
                                  setIsUploading(false);
                                }
                              }}
                            >
                              <div className={`p-3 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center gap-2 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                {isUploading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Upload className="w-6 h-6" />}
                                <span className="font-bold text-sm">Upload</span>
                              </div>
                            </ImageUploader>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {galleryImages?.length > 0 ? galleryImages?.map((img) => (
                        <motion.div
                          key={img.id}
                          whileHover={{ scale: 1.02 }}
                          onClick={() => setSelectedGalleryImage(img)}
                          className="aspect-square rounded-3xl overflow-hidden glass border-white/40 shadow-lg group cursor-pointer relative"
                        >
                          <img 
                            src={img.url} 
                            alt={img.caption} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                            <div className="flex-1">
                              <span className="text-white text-[10px] font-bold block">{img.caption}</span>
                              <span className="text-white/60 text-[8px]">By {img.uploadedBy}</span>
                            </div>
                            <AnimatePresence>
                              {user.role === "Teacher" && (
                                <motion.button 
                                  initial={{ opacity: 0, scale: 0.5 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.5 }}
                                  onClick={(e) => { e.stopPropagation(); handleDeleteGalleryImage(img.id); }}
                                  className="p-2 bg-red-500/80 text-white rounded-lg hover:bg-red-600 transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </motion.button>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      )) : (
                        [1, 2, 3, 4, 5, 6].map((i) => (
                          <div key={i} className="aspect-square rounded-3xl glass animate-pulse" />
                        ))
                      )}
                    </div>

                    {/* Gallery Lightbox */}
                    <AnimatePresence>
                      {selectedGalleryImage && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12"
                        >
                          <div 
                            className="absolute inset-0 bg-black/60 backdrop-blur-xl" 
                            onClick={() => setSelectedGalleryImage(null)}
                          />
                          <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative z-10 max-w-full max-h-full flex flex-col items-center"
                          >
                            <button 
                              onClick={() => setSelectedGalleryImage(null)}
                              className="absolute -top-12 right-0 p-2 rounded-full glass text-white hover:bg-white/20 transition-all"
                            >
                              <X className="w-6 h-6" />
                            </button>
                            <img 
                              src={selectedGalleryImage.url} 
                              alt={selectedGalleryImage.caption}
                              className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl border border-white/20 object-contain"
                              referrerPolicy="no-referrer"
                            />
                            <div className="mt-6 glass px-6 py-3 rounded-2xl text-center border-white/20">
                              <h3 className="text-white font-bold text-lg">{selectedGalleryImage.caption}</h3>
                              <p className="text-white/60 text-xs mt-1">Uploaded by {selectedGalleryImage.uploadedBy} • {new Date(selectedGalleryImage.timestamp).toLocaleDateString()}</p>
                            </div>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              case "About":
                return (
                  <div className="px-6 space-y-8 pb-32">
                    <div className="flex items-center justify-between">
                      <h2 className="text-3xl font-bold text-emerald-900">{t.about}</h2>
                      <AnimatePresence>
                        {user.role === "Teacher" && (
                          <motion.button 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={() => setIsEditingAbout(!isEditingAbout)}
                            className="p-3 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all"
                          >
                            {isEditingAbout ? <X className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </div>

                    <GlassCard className="space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                        <Info className="w-8 h-8 text-emerald-700" />
                      </div>
                      <h3 className="text-xl font-bold text-emerald-900">{t.ourHistory}</h3>
                      {isEditingAbout ? (
                        <div className="space-y-3">
                          <textarea 
                            value={aboutText}
                            onChange={(e) => setAboutText(e.target.value)}
                            className="w-full bg-white/30 border border-emerald-500/30 rounded-xl px-4 py-3 text-emerald-900 focus:outline-none text-sm h-48 leading-relaxed"
                          />
                          <button 
                            onClick={() => handleUpdateAbout(aboutText)}
                            className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                          >
                            <Check className="w-5 h-5" />
                            {t.save}
                          </button>
                        </div>
                      ) : (
                        <p className="text-emerald-800/70 leading-relaxed text-sm">{aboutText}</p>
                      )}
                    </GlassCard>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-bold text-emerald-900">{t.teachersGallery}</h3>
                        <span className="text-xs font-bold text-emerald-700/60 uppercase tracking-widest">{teacherProfiles.length} {t.members}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        {teacherProfiles?.map((teacher, i) => (
                          <GlassCard 
                            key={i} 
                            onClick={() => {
                              setSelectedTeacher(teacher);
                              setEditData({ designation: teacher.designation, phone: teacher.phone });
                            }}
                            className="flex flex-col items-center text-center gap-3 p-4 cursor-pointer hover:scale-105 transition-transform"
                          >
                            <div className="w-20 h-20 rounded-full glass p-1">
                              <img 
                                src={teacher.img} 
                                alt={teacher.name} 
                                className="w-full h-full object-cover rounded-full"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div>
                              <h4 className="font-bold text-emerald-900 text-sm">{teacher.name}</h4>
                              <p className="text-[10px] text-emerald-700/60 uppercase tracking-wider font-bold">{teacher.designation}</p>
                            </div>
                          </GlassCard>
                        ))}
                      </div>
                    </div>

                    {/* Profile Popup */}
                    <AnimatePresence>
                      {selectedUserProfile && (
                        <Profile 
                          user={user}
                          profileUser={selectedUserProfile}
                          onClose={() => setSelectedUserProfile(null)}
                          language={language}
                        />
                      )}
                    </AnimatePresence>

                    {/* Teacher Profile Popup (Legacy - keeping for backward compatibility if needed, but Profile component is preferred) */}
                    <AnimatePresence>
                      {selectedTeacher && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => { setSelectedTeacher(null); setIsEditingProfile(false); }}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                          />
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-sm"
                          >
                            <GlassCard className="p-8 space-y-6 border-emerald-500/30 shadow-2xl">
                              <button 
                                onClick={() => { setSelectedTeacher(null); setIsEditingProfile(false); }}
                                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors"
                              >
                                <X className="w-5 h-5 text-emerald-900" />
                              </button>

                              <div className="flex flex-col items-center text-center gap-4">
                                <div className="w-24 h-24 rounded-full glass p-1.5 ring-4 ring-emerald-500/20">
                                  <img 
                                    src={selectedTeacher.img} 
                                    alt={selectedTeacher.name} 
                                    className="w-full h-full object-cover rounded-full"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                                
                                <div className="space-y-1">
                                  <h3 className="text-2xl font-bold text-emerald-900">{selectedTeacher.name}</h3>
                                  {isEditingProfile ? (
                                    <input 
                                      type="text"
                                      value={editData.designation}
                                      onChange={(e) => setEditData({ ...editData, designation: e.target.value })}
                                      className="w-full bg-white/30 border border-emerald-500/30 rounded-lg px-3 py-1 text-center text-emerald-900 focus:outline-none"
                                    />
                                  ) : (
                                    <p className="text-emerald-700 font-bold uppercase tracking-widest text-xs">{selectedTeacher.designation}</p>
                                  )}
                                </div>

                                <div className="w-full space-y-3 pt-4">
                                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/30 border border-white/20">
                                    <Mail className="w-5 h-5 text-emerald-600" />
                                    <span className="text-sm text-emerald-900 font-medium truncate">{selectedTeacher.email}</span>
                                  </div>
                                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/30 border border-white/20">
                                    <Phone className="w-5 h-5 text-emerald-600" />
                                    {isEditingProfile ? (
                                      <input 
                                        type="tel"
                                        value={editData.phone}
                                        onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                                        className="flex-1 bg-transparent border-none focus:outline-none text-sm text-emerald-900 font-medium"
                                      />
                                    ) : (
                                      <span className="text-sm text-emerald-900 font-medium">{selectedTeacher.phone}</span>
                                    )}
                                  </div>
                                </div>

                                <AnimatePresence>
                                  {user.role === "Teacher" && user.uid === selectedTeacher.uid && (
                                    <motion.div 
                                      initial={{ opacity: 0, scale: 0.9 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.9 }}
                                      className="w-full pt-4"
                                    >
                                      {isEditingProfile ? (
                                        <div className="flex gap-3">
                                          <button 
                                            onClick={handleUpdateSelfProfile}
                                            className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200"
                                          >
                                            {t.save}
                                          </button>
                                          <button 
                                            onClick={() => setIsEditingProfile(false)}
                                            className="px-6 py-3 glass text-emerald-700 rounded-xl font-bold"
                                          >
                                            {t.cancel}
                                          </button>
                                        </div>
                                      ) : (
                                        <button 
                                          onClick={() => setIsEditingProfile(true)}
                                          className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
                                        >
                                          <Edit2 className="w-4 h-4" />
                                          {t.editProfile}
                                        </button>
                                      )}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </GlassCard>
                          </motion.div>
                        </div>
                      )}
                    </AnimatePresence>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-bold text-emerald-900">{t.studentGallery}</h3>
                        <span className="text-xs font-bold text-emerald-700/60 uppercase tracking-widest">{studentProfiles.length} {t.members}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        {studentProfiles?.map((student, i) => (
                          <GlassCard key={i} className="flex flex-col items-center text-center gap-3 p-4 relative group">
                            <AnimatePresence>
                              {user.role === "Teacher" && (
                                <motion.button 
                                  initial={{ opacity: 0, scale: 0.5 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.5 }}
                                  onClick={() => handleDeleteProfile(student.uid)}
                                  className="absolute top-2 right-2 p-2 bg-red-500/10 text-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </motion.button>
                              )}
                            </AnimatePresence>
                            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-700 font-bold">
                              {student.name.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-bold text-emerald-900 text-sm">{student.name}</h4>
                              <p className="text-[10px] text-emerald-700/60 uppercase tracking-wider font-bold">{t.classLabel} {student.className} • {t.section} {student.section}</p>
                              <p className="text-[10px] text-emerald-700/40 mt-1">{t.roll}: {student.rollId}</p>
                            </div>
                          </GlassCard>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              default:
                return null;
            }
          })()}
        </motion.div>
      </Suspense>
    );
  };

  return (
    <ErrorBoundary>
      <div className={`min-h-screen transition-colors duration-500 ${isDarkMode ? "dark-mode" : "light-mode"}`}>
      <AnimatePresence>
        {isSplashVisible && (
          <motion.div 
            key="splash"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: "blur(20px)" }}
            transition={{ duration: 1 }}
            className="fixed inset-0 z-[1000] bg-white flex flex-col items-center justify-center overflow-hidden"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ 
                duration: 1.2, 
                ease: [0.22, 1, 0.36, 1]
              }}
              className="w-32 h-32 rounded-[32px] bg-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-200 mb-8 animate-float will-change-transform"
            >
              <School className="w-16 h-16 text-white" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 1, ease: "easeOut" }}
              className="text-center space-y-3 will-change-transform"
            >
              <h1 className="text-4xl font-black text-emerald-900 tracking-tighter glow-text">
                TNHS ELITE ASK
              </h1>
              <div className="flex items-center justify-center gap-2">
                <div className="h-[1px] w-8 bg-emerald-500/20" />
                <p className="text-emerald-700/40 font-bold uppercase tracking-[0.4em] text-[10px]">
                  Premium Academic Portal
                </p>
                <div className="h-[1px] w-8 bg-emerald-500/20" />
              </div>
            </motion.div>
            
            <style dangerouslySetInnerHTML={{ __html: `
              .animate-float {
                animation: float 4s ease-in-out infinite;
                transform: translate3d(0, 0, 0);
              }
              @keyframes float {
                0%, 100% { transform: translate3d(0, 0, 0); }
                50% { transform: translate3d(0, -10px, 0); }
              }
              .glow-text {
                text-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
                animation: glow 3s ease-in-out infinite alternate;
              }
              @keyframes glow {
                from { text-shadow: 0 0 10px rgba(16, 185, 129, 0.1); }
                to { text-shadow: 0 0 30px rgba(16, 185, 129, 0.4); }
              }
            `}} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeTab === "Home" && !isSplashVisible && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Header 
              user={user} 
              onNoticeClick={() => setActiveTab("Notice")}
              hasNewNotices={notices.length > 0}
              language={language}
              setLanguage={setLanguage}
              isDarkMode={isDarkMode}
              setIsDarkMode={setIsDarkMode}
              onLogout={handleLogout}
              setActiveTab={setActiveTab}
              activeTab={activeTab}
              onOpenAdminPortal={handleOpenAdminPortal}
              onDirectRoleSwitch={handleDirectRoleSwitch}
              onChangePassword={() => setShowPasswordChange(true)}
              isSuperAdmin={user?.email === 'ksayid341@gmail.com'}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Details Popup removed */}

      {/* Role Switch Toast */}
      <AnimatePresence>
        {showRoleSwitchToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: -20, x: "-50%" }}
            exit={{ opacity: 0, y: 50, x: "-50%" }}
            className="fixed bottom-24 left-1/2 z-[200] w-auto"
          >
            <GlassCard className="!bg-emerald-600 !border-emerald-400 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
              <Check className="w-5 h-5" />
              <span className="font-bold whitespace-nowrap">Role Switched Successfully!</span>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGreeting && !showRoleSwitchToast && (
          <motion.div
            initial={{ opacity: 0, y: -100, x: "-50%" }}
            animate={{ opacity: 1, y: 20, x: "-50%" }}
            exit={{ opacity: 0, y: -100, x: "-50%" }}
            className="fixed top-0 left-1/2 z-[100] w-[90%] max-w-sm"
          >
            <GlassCard className="!bg-emerald-600/90 !border-emerald-400/30 text-white p-4 text-center shadow-2xl">
              <p className="text-lg font-bold">
                Assalamu Alaikum {user.name},
              </p>
              <p className="text-sm opacity-90">
                {t.welcome} to {user.role === "Teacher" ? t.teacherPortal : `${t.classLabel}${user.className}`}
              </p>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      <main className={`max-w-4xl mx-auto ${activeTab === "Home" ? "pt-24" : activeTab === "Inbox" ? "pt-0" : "pt-8"}`}>
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </main>
      <Navigation 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        hasNewNotices={notices.length > 0}
        language={language}
      />
      
      <AIAssistant 
        user={user} 
        homework={homework} 
        onAddHomework={addHomework} 
        tourTrigger={tourTrigger}
        signInTrigger={signInTrigger}
        postTrigger={postTrigger}
        language={language}
      />

      {/* Admin Auth Modal */}
      <AnimatePresence>
        {showAdminAuth && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAdminAuth(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="relative w-full max-w-sm will-change-transform"
            >
              <GlassCard className="p-8 space-y-6 border-emerald-500/30 shadow-2xl">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 rounded-full bg-emerald-600 text-white mx-auto flex items-center justify-center shadow-lg">
                    <Shield className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black text-emerald-900 tracking-tight">Super Admin Access</h3>
                  <p className="text-xs font-bold text-emerald-700/60 uppercase tracking-widest">Enter Super Password</p>
                </div>

                <form onSubmit={handleAdminAuth} className="space-y-4">
                  <input 
                    type="password"
                    autoFocus
                    value={adminAuthPass}
                    onChange={(e) => setAdminAuthPass(e.target.value)}
                    placeholder="Super Password"
                    className="w-full bg-white/50 border border-emerald-500/20 rounded-2xl px-4 py-4 text-center text-emerald-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <button 
                    type="submit"
                    className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all haptic-glow"
                  >
                    Authenticate
                  </button>
                </form>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Password Change Modal */}
      <AnimatePresence>
        {showPasswordChange && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPasswordChange(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="relative w-full max-w-sm will-change-transform"
            >
              <GlassCard className="p-8 space-y-6 border-emerald-500/30 shadow-2xl">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 rounded-full bg-emerald-600 text-white mx-auto flex items-center justify-center shadow-lg">
                    <LockIcon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black text-emerald-900 tracking-tight">Change Password</h3>
                  <p className="text-xs font-bold text-emerald-700/60 uppercase tracking-widest">Set your login password</p>
                </div>

                <div className="space-y-4">
                  <input 
                    type="password"
                    autoFocus
                    value={passwordToChange}
                    onChange={(e) => setPasswordToChange(e.target.value)}
                    placeholder="New Password"
                    className="w-full bg-white/50 border border-emerald-500/20 rounded-2xl px-4 py-4 text-center text-emerald-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <button 
                    onClick={() => {
                      if (passwordToChange.trim()) {
                        handleUpdateUserPassword(passwordToChange);
                        setPasswordToChange("");
                      }
                    }}
                    className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-200"
                  >
                    Update Password
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Portal */}
      <AnimatePresence>
        {showAdminPortal && (
          <Suspense fallback={null}>
            <AdminPortal 
              onClose={() => setShowAdminPortal(false)}
              onUpdateUserRole={handleUpdateUserRole}
              superPassword={superPassword}
              onUpdateSuperPassword={handleUpdateSuperPassword}
            />
          </Suspense>
        )}
      </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}
