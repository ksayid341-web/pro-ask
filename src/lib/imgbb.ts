// 1. Function to update Profile Picture
  const handleUpdateProfilePic = async (base64: string) => {
    if (!auth.currentUser || auth.currentUser.uid !== profileUser.uid) return;
    
    setIsUploadingProfilePic(true);
    try {
      const url = await uploadToImgBB(base64);
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        photoURL: url
      });
      if (onUpdateProfilePic) onUpdateProfilePic(auth.currentUser.uid, url);
    } catch (error) {
      console.error("Profile update error:", error);
    } finally {
      setIsUploadingProfilePic(false); // Stops loading spinner
    }
  };

  // 2. Function to upload to Gallery (Multiple images fix)
  const handlePostUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const compressed = await compressImage(file);
      const downloadURL = await uploadToImgBB(compressed);

      // addDoc ensures new images don't overwrite the old ones
      await addDoc(collection(db, "posts"), {
        userId: user.uid,
        userName: user.name,
        userPhoto: user.photoURL,
        userRole: user.role,
        imageUrl: downloadURL,
        caption: caption,
        likes: [],
        timestamp: serverTimestamp(),
      });
      
      setCaption("");
    } catch (error: any) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false); // Stops loading spinner
    }
  };
