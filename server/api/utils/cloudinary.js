import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
// it's helps to upload files

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    try {
      fs.unlinkSync(localFilePath);
    } catch {
      /* ignore */
    }
    return response;
  } catch (error) {
    if (localFilePath) {
      try {
        fs.unlinkSync(localFilePath);
      } catch {
        /* ignore */
      }
    }
    console.error("Error uploading file to Cloudinary:", error);
    return null;
  }
};

/** Base64 string or full data URI (e.g. data:image/jpeg;base64,...) */
const uploadImageFromDataUri = async (base64OrDataUri) => {
  if (!base64OrDataUri || typeof base64OrDataUri !== "string") {
    return null;
  }
  const trimmed = base64OrDataUri.trim();
  if (trimmed.length < 80) return null;
  const dataUri = trimmed.startsWith("data:")
    ? trimmed
    : `data:image/jpeg;base64,${trimmed}`;
  try {
    const response = await cloudinary.uploader.upload(dataUri, {
      resource_type: "image",
      folder: "4n_eco/providers",
    });
    return response;
  } catch (error) {
    console.error("Error uploading base64 image to Cloudinary:", error);
    return null;
  }
};

const deleteOnCloudinary = async (publicId) => {
  try {
    if (!publicId) return null;

    //delete the file on cloudinary

    const response = await cloudinary.uploader.destroy(publicId);
    //file has been uploded successfull
    // console.log("File is upload on cloudinary", response.url)
    return response;
  } catch (error) {
    return null;
  }
};

export {uploadOnCloudinary, uploadImageFromDataUri, deleteOnCloudinary};
