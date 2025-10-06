import multer from "multer";
import path from "path";




//cb --> callback
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp")
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})

// 🔹 File filter to validate file types
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  // Allowed extensions
  const videoFormats = [".mp4", ".mov", ".avi", ".mkv"];
  const imageFormats = [".jpg", ".jpeg", ".png", ".webp"];

  // 🔹 Check the field name to apply specific validation
  if (file.fieldname === "videoFile") {
    if (!videoFormats.includes(ext)) {
      return cb(new Error("Only video formats (.mp4, .mov, .avi, .mkv) are allowed"), false);
    }
  }

  if (file.fieldname === "thumbnail") {
    if (!imageFormats.includes(ext)) {
      return cb(new Error("Only image formats (.jpg, .jpeg, .png, .webp) are allowed"), false);
    }
  }

  cb(null, true); // accept file if valid
};

export const upload = multer({  
    storage, 
    fileFilter,
})