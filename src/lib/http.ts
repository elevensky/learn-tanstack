import ky, { type Options } from "ky";

const REQUEST_TIMEOUT_MS = 10000;

/**
 * 必须使用「站点根」下的绝对前缀。若写相对路径 `api`，在 `/app/...` 路由下会被解析成 `/app/api/...`。
 */
function getApiPrefixUrl() {
  if (typeof window !== "undefined") {
    return new URL("api/", `${window.location.origin}/`).href;
  }
  return "/api/";
}

/** 业务成功码（HTTP 一般为 200，与 body 里的 code 无关） */
const API_SUCCESS_CODE = 200;

export type ApiResponse<TData> = {
  code: number;
  data: TData;
  message: string;
};

type HttpConfig = Options & {
  origin?: boolean;
};

const client = ky.create({
  prefixUrl: getApiPrefixUrl(),
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

async function request<TData>(
  method: "get" | "post" | "put" | "patch" | "delete",
  path: string,
  config: HttpConfig = {},
) {
  const { origin = false, ...kyOptions } = config;
  const normalizedPath = normalizePath(path);
  const raw = await client(normalizedPath, {
    method,
    ...kyOptions,
  }).json<ApiResponse<TData>>();
  if (raw.code !== API_SUCCESS_CODE) {
    throw new Error(raw.message || "Request failed");
  }
  return (origin ? raw : raw.data) as TData;
}

function normalizePath(path: string) {
  return path.trim().replace(/^\/+/, "").replace(/^api\/?/, "");
}

export const http = {
  get: <TData>(path: string, config?: HttpConfig) => request<TData>("get", path, config),
  post: <TData>(path: string, config?: HttpConfig) =>
    request<TData>("post", path, config),
  put: <TData>(path: string, config?: HttpConfig) => request<TData>("put", path, config),
  patch: <TData>(path: string, config?: HttpConfig) =>
    request<TData>("patch", path, config),
  delete: <TData>(path: string, config?: HttpConfig) =>
    request<TData>("delete", path, config),
};
