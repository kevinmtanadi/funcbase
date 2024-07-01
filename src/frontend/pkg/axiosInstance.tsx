import axios from "axios";
import Cookies from "cookie-ts";

const axiosInstance = axios.create({
  headers: {
    "Content-Type": "application/json",
    Authorization: Cookies.get("_auth") ? `${Cookies.get("_auth")}` : "",
    "X-API-KEY": "019039ff-f5be-7520-8ab8-bbcf248a6585",
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
