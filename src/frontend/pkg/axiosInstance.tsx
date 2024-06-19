import axios from "axios";
import Cookies from "cookie-ts";

const axiosInstance = axios.create({
  headers: {
    "Content-Type": "application/json",
    Authorization: Cookies.get("_auth") ? `${Cookies.get("_auth")}` : "",
    // Add any cusom headers if needed
  },
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      window.location.href = "/signin";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
