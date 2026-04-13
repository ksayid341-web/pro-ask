import React, { useState, useEffect } from "react";
import { X, Upload, Star, Camera, Send, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import GlassCard from "./GlassCard";
import { UserData } from "../App";
import { Language, translations } from "../lib/translations";
import { compressImage } from "../lib/imageUtils";

interface ProfileProps {
  user: UserData; // The logged in user
  profileUser: UserData | any; // The user whose profile is being viewed
  onClose?: () => void;
  language: Language;
  isPage?: boolean;
}

export default React.memo(function Profile({ user, profileUser, onClose, language, isPage = false }: ProfileProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [rating, setRating] = useState<number>(0);
  const [ratingCount, setRatingCount] = useState<number>(0);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const t = translations[language];

  useEffect(() => {
    const savedRatings = JSON.parse(localStorage.getItem("user_ratings_data") || "{}");
    const userData = savedRatings[profileUser.uid] || { average: 0, count: 0 };
    setRating(userData.average);
    setRatingCount(userData.count);

    const allPosts = JSON.parse(localStorage.getItem("globe_posts") || "[]");
    const userPosts = allPosts.filter((p: any) => p.userId === profileUser.uid);
    
    // Merge latest rating
    const updatedUserPosts = userPosts.map((p: any) => ({
      ...p,
      rating: userData.average || p.rating || 0
    }));

    setMyPosts(updatedUserPosts.sort((a: any, b: any) => b.timestamp - a.timestamp));
  }, [profileUser.uid]);

  const handlePostUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const compressed = await compressImage(file);
      const posts = JSON.parse(localStorage.getItem("globe_posts") || "[]");
      
      const newPost = {
        id: Math.random().toString(36).substr(2, 9),
        userId: user.uid,
        userName: user.name,
        userPhoto: user.photoURL,
        userRole: user.role,
        imageUrl: compressed,
        caption: caption,
        likes: [],
        timestamp: Date.now(),
        rating: JSON.parse(localStorage.getItem("user_ratings_data") || "{}")[user.uid]?.average || 0
      };

      const updatedPosts = [...posts, newPost];
      localStorage.setItem("globe_posts", JSON.stringify(updatedPosts));
      setMyPosts(updatedPosts.filter((p: any) => p.userId === profileUser.uid).sort((a: any, b: any) => b.timestamp - a.timestamp));
      setCaption("");
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRate = (stars: number) => {
    if (user.role !== "Teacher" || profileUser.role !== "Student") return;
    
    const savedRatings = JSON.parse(localStorage.getItem("user_ratings_data") || "{}");
    const currentData = savedRatings[profileUser.uid] || { average: 0, count: 0, sums: 0 };
    
    // Toggle Logic: If clicking the same rating, reset to 0
    let newAverage = 0;
    let newCount = 0;
    let newSum = 0;

    if (Math.round(currentData.average) === stars) {
      // Reset
      newAverage = 0;
      newCount = 0;
      newSum = 0;
    } else {
      // Set new rating (simplified for demo: one rating per student)
      newCount = 1;
      newSum = stars;
      newAverage = stars;
    }

    const newData = { average: newAverage, count: newCount, sums: newSum };
    savedRatings[profileUser.uid] = newData;
    localStorage.setItem("user_ratings_data", JSON.stringify(savedRatings));
    
    setRating(newAverage);
    setRatingCount(newCount);

    // Update rating in posts too
    const posts = JSON.parse(localStorage.getItem("globe_posts") || "[]");
    const updatedPosts = posts.map((p: any) => {
      if (p.userId === profileUser.uid) {
        return { ...p, rating: newAverage };
      }
      return p;
    });
    localStorage.setItem("globe_posts", JSON.stringify(updatedPosts));
  };

  const handleDeletePost = (postId: string) => {
    const allPosts = JSON.parse(localStorage.getItem("globe_posts") || "[]");
    const updatedPosts = allPosts.filter((p: any) => p.id !== postId);
    localStorage.setItem("globe_posts", JSON.stringify(updatedPosts));
    
    // Update local state
    setMyPosts(updatedPosts.filter((p: any) => p.userId === profileUser.uid).sort((a: any, b: any) => b.timestamp - a.timestamp));
  };

  const isOwnProfile = user.uid === profileUser.uid;

  const content = (
    <div className={`space-y-6 ${isPage ? "pb-32" : ""}`}>
      <GlassCard className="p-8 space-y-6 border-emerald-500/30 shadow-2xl relative">
        {!isPage && onClose && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-emerald-900" />
          </button>
        )}

        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-24 h-24 rounded-full glass p-1.5 ring-4 ring-emerald-500/20 relative">
            <img 
              src={profileUser.photoURL || profileUser.img} 
              alt={profileUser.name} 
              className="w-full h-full object-cover rounded-full"
              referrerPolicy="no-referrer"
            />
            {isOwnProfile && (
              <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-emerald-600 border-2 border-white flex items-center justify-center shadow-lg">
                <Camera className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2">
              <h3 className="text-2xl font-bold text-emerald-900">{profileUser.name}</h3>
              {rating > 0 && (
                <span className="text-sm font-bold bg-yellow-400/20 text-yellow-700 px-2 py-0.5 rounded-lg flex items-center gap-1">
                  {rating.toFixed(1)} ⭐
                </span>
              )}
            </div>
            <p className="text-emerald-700 font-bold uppercase tracking-widest text-xs">
              {profileUser.role === "Student" ? `Roll: ${profileUser.rollId || profileUser.roll}` : profileUser.designation}
            </p>
          </div>

          {/* Rating System for Teachers */}
          {user.role === "Teacher" && profileUser.role === "Student" && (
            <div className="w-full space-y-3 pt-4 border-t border-white/20">
              <p className="text-[10px] font-black text-emerald-700/60 uppercase tracking-widest">Rate Student Performance</p>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRate(star)}
                    className={`transition-all hover:scale-125 ${star <= Math.round(rating) ? "text-yellow-500" : "text-emerald-200"}`}
                  >
                    <Star className={`w-6 h-6 ${star <= Math.round(rating) ? "fill-current" : ""}`} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Post Upload for Own Profile */}
          {isOwnProfile && (
            <div className="w-full space-y-4 pt-4 border-t border-white/20">
              <p className="text-[10px] font-black text-emerald-700/60 uppercase tracking-widest">Create a Post</p>
              <div className="space-y-2">
                <textarea 
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="What's on your mind?"
                  className="w-full bg-white/30 border border-emerald-500/30 rounded-xl px-4 py-2 text-sm text-emerald-900 focus:outline-none h-20 resize-none"
                />
                <label className={`w-full flex items-center justify-center gap-3 p-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${isUploading ? "opacity-50 pointer-events-none" : "border-emerald-500/30 hover:bg-emerald-500/10"}`}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handlePostUpload}
                    disabled={isUploading}
                  />
                  <Upload className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-bold text-emerald-900">
                    {isUploading ? "Uploading..." : "Upload Image & Post"}
                  </span>
                </label>
              </div>
            </div>
          )}

          {!isOwnProfile && (
            <div className="w-full space-y-3 pt-4">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/30 border border-white/20">
                <Star className="w-5 h-5 text-emerald-600" />
                <span className="text-sm text-emerald-900 font-medium">Academic Excellence</span>
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      {/* My Posts Section */}
      <div className="space-y-4">
        <h4 className="text-lg font-black text-emerald-900 uppercase tracking-tight px-2">
          {isOwnProfile ? "My Posts" : `${profileUser.name}'s Posts`}
        </h4>
        {myPosts.length === 0 ? (
          <GlassCard className="p-12 text-center opacity-60">
            <p className="text-emerald-900 font-bold">No posts yet.</p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {myPosts.map((post) => (
              <GlassCard key={post.id} className="p-0 overflow-hidden border-white/40 shadow-lg aspect-square relative group">
                <img 
                  src={post.imageUrl} 
                  alt="Post" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                {isOwnProfile && (
                  <button 
                    onClick={() => handleDeletePost(post.id)}
                    className="absolute top-2 right-2 p-2 bg-red-500/80 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 active:scale-90"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (isPage) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-sm mx-auto"
      >
        {content}
      </motion.div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto scrollbar-hide"
      >
        {content}
      </motion.div>
    </div>
  );
});
