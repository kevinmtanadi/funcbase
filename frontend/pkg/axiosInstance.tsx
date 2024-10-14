import axios from "axios";

export interface APIResponse<T> {
  data: T;
  message: string;
  error: any;
}

const axiosInstance = axios.create({
  headers: {
    "Content-Type": "application/json",
    "X-API-KEY": "019039ff-f5be-7520-8ab8-bbcf248a6585",
    "X-MAIN-APP": "true",
  },
  withCredentials: true,
});

// axiosInstance.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response && error.response.status === 401) {
//       window.location.href = "/signin";
//     }
//     return Promise.reject(error);
//   }
// );

export default axiosInstance;
