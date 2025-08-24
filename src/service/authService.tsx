import API_ENDPOINTS from "@/config/endpoints";
import axios, { AxiosError } from "axios";

const loginUser = async (email: string, password: string, userType: string, adminPassKey: string) => {
  try {
    const response = await axios.post(API_ENDPOINTS.LOGIN, {
      email,
      password,
      userType,
      adminPassKey,
    });

    const { user, token } = response.data;

    if (response.status === 201 || response.status === 200) {
      localStorage.setItem("userId", user.id);
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      return { success: true, message: "Login successful" };
    }
  } catch (error) {
    const err = error as AxiosError;
    const resMessage = err.response?.data;
    const message = Array.isArray(resMessage)
      ? resMessage.join(", ")
      : resMessage || "Login failed. Please try again.";
    return { success: false, message };
  }
};

const signupUser = async (data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  address: string;
  phone: string;
  userType: string;
  estate: string;
  businessDescription?: string;
  businessPhoneNumber?: string;
  businessName?: string;
  adminPassKey?: string;
}): Promise<{ success: boolean; message: string }> => {
  try {
    const payload = {
      ...data,
      ...(data.userType === 'vendor' && {
        businessName: data.businessName,
        businessDescription: data.businessDescription,
        businessPhoneNumber: data.businessPhoneNumber,
      }),
      ...(data.userType === 'admin' && {
        adminPassKey: data.adminPassKey,
      }),
    };

    const response = await axios.post(API_ENDPOINTS.SIGNUP, payload);

    if (response.data && response.data.user) {
      return { success: true, message: 'Signup successful' };
    } else {
      return { success: false, message: 'Signup failed' };
    }
  } catch (err) {
    console.error('Signup failed', err);
    if (axios.isAxiosError(err) && err.response?.data) {
      const errorMessage = err.response.data.message || 'Signup failed. Please try again.';
      return { success: false, message: errorMessage };
    }
    return { success: false, message: 'Signup failed. Please try again.' };
  }
};


 const logoutUser = async (userId: string) => {
  try {
    const response = await axios.post(API_ENDPOINTS.LOGOUT, { userId });
    return response.data;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    throw error?.response?.data?.message || 'Logout failed';
  }
};

export { loginUser, signupUser, logoutUser };