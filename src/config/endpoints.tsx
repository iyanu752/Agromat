const BASE_URL = "http://localhost:3000";

const API_ENDPOINTS = {
LOGIN: `${BASE_URL}/auth/login`,
SIGNUP: `${BASE_URL}/auth/signup`,
LOGOUT: `${BASE_URL}/auth/logout`,
VENDORDASHBOARD: `${BASE_URL}/dashboard/`,
RIDERDASHBOARD: `${BASE_URL}/dashboard/`,
ADMINDASHBOARD: `${BASE_URL}/dashboard/`,
SUPERMARKET: `${BASE_URL}/supermarket`,
PRODUCTS: `${BASE_URL}/products`,
PROFILE: `${BASE_URL}/profile`,
USERS: `${BASE_URL}/users`,
CART: `${BASE_URL}/cart`,
ORDER: `${BASE_URL}/orders`,
UPLOAD: `${BASE_URL}/upload`,


}

export default API_ENDPOINTS;