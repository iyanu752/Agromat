import API_ENDPOINTS from "@/config/endpoints";
import axios from "axios";


 const uploadImage = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axios.post(API_ENDPOINTS.UPLOAD, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data; 
};

export {uploadImage}