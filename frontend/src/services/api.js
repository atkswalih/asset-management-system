import axios from "axios";


const api = axios.create({
  baseURL: "/api/",
  headers: {
    "Content-Type": "application/json",
  },
});


api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem(
        "access_token",
      );

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);


let isRefreshing = false;

let failedQueue = [];


const processQueue = (
  error,
  token = null,
) => {
  failedQueue.forEach(
    (promise) => {
      if (error) {
        promise.reject(error);
      } else {
        promise.resolve(token);
      }
    },
  );

  failedQueue = [];
};


api.interceptors.response.use(
  (response) => {
    return response;
  },

  async (error) => {
    const originalRequest =
      error.config;


    if (
      error.response?.status !== 401 ||
      originalRequest?._retry
    ) {
      return Promise.reject(error);
    }


    if (
      originalRequest?.url?.includes(
        "auth/login/",
      )
    ) {
      return Promise.reject(error);
    }


    const refreshToken =
      localStorage.getItem(
        "refresh_token",
      );


    if (!refreshToken) {
      localStorage.removeItem(
        "access_token",
      );

      localStorage.removeItem(
        "refresh_token",
      );

      localStorage.removeItem(
        "admin_access_token",
      );

      localStorage.removeItem(
        "impersonation",
      );

      window.location.href =
        "/login";

      return Promise.reject(error);
    }


    if (isRefreshing) {
      return new Promise(
        (resolve, reject) => {
          failedQueue.push({
            resolve,
            reject,
          });
        },
      )
        .then((token) => {
          originalRequest.headers.Authorization =
            `Bearer ${token}`;

          return api(
            originalRequest,
          );
        })
        .catch((refreshError) => {
          return Promise.reject(
            refreshError,
          );
        });
    }


    originalRequest._retry = true;

    isRefreshing = true;


    try {
      const response =
        await axios.post(
          "/api/auth/refresh/",
          {
            refresh: refreshToken,
          },
          {
            headers: {
              "Content-Type":
                "application/json",
            },
          },
        );


      const newAccessToken =
        response.data.access;


      localStorage.setItem(
        "access_token",
        newAccessToken,
      );


      processQueue(
        null,
        newAccessToken,
      );


      originalRequest.headers.Authorization =
        `Bearer ${newAccessToken}`;


      return api(
        originalRequest,
      );
    } catch (refreshError) {
      processQueue(
        refreshError,
        null,
      );


      localStorage.removeItem(
        "access_token",
      );

      localStorage.removeItem(
        "refresh_token",
      );

      localStorage.removeItem(
        "admin_access_token",
      );

      localStorage.removeItem(
        "impersonation",
      );


      window.location.href =
        "/login";


      return Promise.reject(
        refreshError,
      );
    } finally {
      isRefreshing = false;
    }
  },
);


export default api;
