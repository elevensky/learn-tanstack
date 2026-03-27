import ky from "ky";

const REQUEST_TIMEOUT_MS = 10000;

export const http = ky.create({
  timeout: REQUEST_TIMEOUT_MS,
  retry: {
    limit: 1,
    methods: ["get", "post", "put", "patch", "delete"],
    statusCodes: [408, 413, 429, 500, 502, 503, 504],
  },
  hooks: {
    beforeRequest: [
      (request) => {
        request.headers.set("Accept", "application/json");

        if (typeof window === "undefined") {
          return;
        }

        const token = window.localStorage.getItem("auth-token");
        if (token) {
          request.headers.set("Authorization", `Bearer ${token}`);
        }
      },
    ],
    afterResponse: [
      (_request, _options, response) => {
        if (response.status === 401 && typeof window !== "undefined") {
          window.localStorage.removeItem("auth-token");
        }
      },
    ],
  },
});
