import React, { useState, useEffect, useRef } from "react";
import { Heart, MessageCircle, Share2, MoreHorizontal, User, Star, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import GlassCard from "./GlassCard";
import { UserData } from "../App";
import { Language, translations } from "../lib/translations";
import { db } from "../firebase";
import { collection, onSnapshot, query, orderBy, doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  userRole: string;
  imageUrl: string;
  caption: string;
  likes: string[]; // Array of user IDs
  timestamp: number;
  rating?: number;
}

interface GlobeFeedProps {
  user: UserData;
  language: Language;
  onViewProfile: (userId: string) => void;
}

export default React.memo(function GlobeFeed({ user, language, onViewProfile }: GlobeFeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [showRatingMenu, setShowRatingMenu] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const t = translations[language];

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "posts"), (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      
      // Client-side sort to handle null timestamps from serverTimestamp()
      const sortedPosts = fetchedPosts.sort((a: any, b: any) => {
        const timeA = a.timestamp?.toMillis?.() || (typeof a.timestamp === 'number' ? a.timestamp : Date.now());
        const timeB = b.timestamp?.toMillis?.() || (typeof b.timestamp === 'number' ? b.timestamp : Date.now());
        return timeB - timeA;
      });
      
      const savedRatings = JSON.parse(localStorage.getItem("user_ratings_data") || "{}");
      const mergedPosts = sortedPosts.map(post => ({
        ...post,
        rating: savedRatings[post.userId]?.average || post.rating || 0
      }));
      
      setPosts(mergedPosts);
    }, (error) => {
      console.error("Error fetching globe posts:", error);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowRatingMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLike = async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const hasLiked = post.likes.includes(user.uid);
    const postRef = doc(db, "posts", postId);

    try {
      await updateDoc(postRef, {
        likes: hasLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
    } catch (error) {
      console.error("Error updating like:", error);
    }
  };

  const handleRateStudent = (studentId: string, stars: number) => {
    if (user.role !== "Teacher") return;
    const savedRatings = JSON.parse(localStorage.getItem("user_ratings_data") || "{}");
    const currentData = savedRatings[studentId] || { average: 0, count: 0, sums: 0 };
    
    // Toggle Logic: If clicking the same rating, reset to 0
    let newAverage = 0;
    let newCount = 0;
    let newSum = 0;

    if (Math.round(currentData.average) === stars) {
      newAverage = 0;
      newCount = 0;
      newSum = 0;
    } else {
      newCount = 1;
      newSum = stars;
      newAverage = stars;
    }

    const newData = { average: newAverage, count: newCount, sums: newSum };
    savedRatings[studentId] = newData;
    localStorage.setItem("user_ratings_data", JSON.stringify(savedRatings));

    // Update all posts by this student
    const updatedPosts = posts.map(p => {
      if (p.userId === studentId) {
        return { ...p, rating: newAverage };
      }
      return p;
    });
    setPosts(updatedPosts);
    // Keep menu open for better feedback or close it? User said "allow them to click any star", 
    // usually better to keep it open if they want to adjust. But let's close for "instant" feel.
    setShowRatingMenu(null);
  };

  const renderStars = (rating: number = 0) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            className={`w-3 h-3 ${star <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-emerald-200"}`} 
          />
        ))}
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl mx-auto space-y-6 pb-32"
    >
      <div className="flex items-center justify-between px-2">
        <h2 className="text-2xl font-black text-emerald-900 uppercase tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg">
            <Heart className="w-5 h-5 text-white" />
          </div>
          Global Feed
        </h2>
      </div>

      {posts.length === 0 ? (
        <GlassCard className="p-12 text-center opacity-60">
          <p className="text-emerald-900 font-bold">No posts yet.</p>
          <p className="text-xs text-emerald-700">Be the first to share something with the school!</p>
        </GlassCard>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <GlassCard key={post.id} className="p-0 overflow-hidden border-white/40 shadow-xl">
              {/* Post Header */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => onViewProfile(post.userId)}
                    className="w-10 h-10 rounded-full border-2 border-emerald-500/20 overflow-hidden shadow-sm hover:scale-110 transition-transform"
                  >
                    <img 
                      src={post.userPhoto} 
                      alt={post.userName} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => onViewProfile(post.userId)}
                        className="text-sm font-black text-emerald-900 hover:text-emerald-600 transition-colors"
                      >
                        {post.userName}
                      </button>
                      {post.userRole === "Student" && (
                        <div 
                          className={`px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-100 min-w-[60px] flex items-center justify-center ${user.role === "Teacher" ? "cursor-pointer hover:bg-emerald-100 transition-colors" : ""}`}
                          onClick={(e) => {
                            if (user.role === "Teacher") {
                              e.stopPropagation();
                              setShowRatingMenu(showRatingMenu === post.id ? null : post.id);
                            }
                          }}
                        >
                          {renderStars(post.rating)}
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] font-bold text-emerald-700/60 uppercase tracking-widest">{post.userRole}</p>
                  </div>
                </div>
                
                <div className="relative">
                  <button 
                    onClick={() => setShowRatingMenu(showRatingMenu === post.id ? null : post.id)}
                    className="p-2 hover:bg-white/20 rounded-xl text-emerald-900/40"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>

                  <AnimatePresence>
                    {showRatingMenu === post.id && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                        ref={menuRef}
                        className="absolute right-0 mt-2 w-48 glass rounded-2xl shadow-2xl border border-white/40 z-50 p-2"
                      >
                        {user.role === "Teacher" && post.userRole === "Student" ? (
                          <div className="space-y-2">
                            <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest px-2 py-1">Rate Student</p>
                            <div className="flex items-center justify-around p-2 bg-white/40 rounded-xl">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button 
                                  key={star}
                                  onClick={() => handleRateStudent(post.userId, star)}
                                  className="hover:scale-125 transition-transform"
                                >
                                  <Star className={`w-5 h-5 ${star <= (Math.round(post.rating || 0)) ? "fill-yellow-400 text-yellow-400" : "text-emerald-300"}`} />
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-[10px] font-bold text-emerald-700/60 p-2 text-center">No actions available</p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Post Image */}
              <div 
                onClick={() => setSelectedImage(post.imageUrl)}
                className="aspect-square w-full bg-emerald-50/50 relative group cursor-pointer overflow-hidden"
              >
                <img 
                  src={post.imageUrl} 
                  alt="Post" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileHover={{ opacity: 1, scale: 1 }}
                    className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white"
                  >
                    <MoreHorizontal className="w-6 h-6" />
                  </motion.div>
                </div>
              </div>

              {/* Post Actions */}
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-1.5 transition-all active:scale-90 ${
                      post.likes.includes(user.uid) ? "text-red-500" : "text-emerald-900 hover:text-red-500"
                    }`}
                  >
                    <Heart className={`w-6 h-6 ${post.likes.includes(user.uid) ? "fill-current" : ""}`} />
                    <span className="text-xs font-black">{post.likes.length}</span>
                  </button>
                </div>

                {post.caption && (
                  <p className="text-sm text-emerald-900 font-medium leading-relaxed">
                    <span className="font-black mr-2">{post.userName}</span>
                    {post.caption}
                  </p>
                )}

                <p className="text-[10px] font-bold text-emerald-700/40 uppercase tracking-widest">
                  {new Date(post.timestamp).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                </p>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Full-Screen Image View */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 cursor-zoom-out"
          >
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute top-8 right-8 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all z-[210]"
            >
              <X className="w-8 h-8" />
            </button>
            <motion.img 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={selectedImage} 
              alt="Full view" 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
