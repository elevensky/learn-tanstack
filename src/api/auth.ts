import { http } from "#/lib/http";

export type LoginRequestBody = {
  username: string;
  password: string;
  captchaId: string;
  verifyCode: string;
};

/** 登录接口 data 常见字段（按后端实际可再扩展） */
export type LoginResultDto = {
  token?: string;
  accessToken?: string;
  username?: string;
  user?: string | { username?: string; name?: string };
};

export type SessionAfterLogin = {
  token: string;
  username: string;
};

function pickToken(data: LoginResultDto): string | undefined {
  return data.token ?? data.accessToken;
}

function pickUsername(data: LoginResultDto, fallback: string): string {
  if (data.username) {
    return data.username;
  }
  const u = data.user;
  if (typeof u === "string") {
    return u;
  }
  if (u && typeof u === "object") {
    return u.username ?? u.name ?? fallback;
  }
  return fallback;
}

/** POST auth/login */
export async function postLogin(
  body: LoginRequestBody,
): Promise<SessionAfterLogin> {
  const data = await http.post<LoginResultDto>("auth/login", { json: body });
  const token = pickToken(data);
  if (!token) {
    throw new Error("登录响应缺少 token");
  }
  const username = pickUsername(data, body.username);
  return { token, username };
}

export type ValidateTokenDto = {
  valid: boolean;
  user: string;
};

/** GET validate-token（需携带 Bearer） */
export async function getValidateToken(): Promise<ValidateTokenDto> {
  return http.get<ValidateTokenDto>("validate-token");
}

/** GET account/logout（需携带 Bearer，服务端注销会话） */
export async function getLogout(): Promise<void> {
  await http.get<unknown>("account/logout");
}
