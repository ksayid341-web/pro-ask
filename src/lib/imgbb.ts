/**
 * Uploads an image to ImgBB and returns the display URL.
 * @param base64Image The base64 encoded image string.
 * @returns The URL of the uploaded image.
 */
export async function uploadToImgBB(base64Image: string): Promise<string> {
  const apiKey = "afd10cd7af2e159e7892cd4438ec2175"; // New API Key provided by user
  
  // Remove the data:image/jpeg;base64, prefix if it exists
  const base64Data = base64Image.split(',')[1] || base64Image;

  const formData = new FormData();
  formData.append("image", base64Data);

  try {
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("ImgBB upload failed");
    }

    const result = await response.json();
    return result.data.url;
  } catch (error) {
    console.error("Error uploading to ImgBB:", error);
    throw error;
  }
}
