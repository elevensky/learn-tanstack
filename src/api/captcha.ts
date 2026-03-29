import { http } from "#/lib/http";

/** 与登录页 useQuery 的 queryKey 保持一致，便于登录成功后 removeQueries */
export const LOGIN_CAPTCHA_QUERY_KEY = ["login-captcha-img"] as const;

export type CaptchaImgDto = {
  id?: string;
  img?: string;
};

export type CaptchaImageResult = {
  captchaId: string;
  imageSrc: string;
};

function normalizeCaptchaImage(rawBase64: string) {
  const trimmed = rawBase64.trim();
  if (trimmed.startsWith("data:image/")) {
    return trimmed;
  }
  return `data:image/png;base64,${trimmed}`;
}

/** GET auth/captcha/img — 返回 data 中的 id + base64 图片字段 */
export async function getCaptchaImage(): Promise<CaptchaImageResult> {
  const data = await http.get<CaptchaImgDto>("auth/captcha/img");
  const captchaId = data.id ?? "";
  const imageBase64 = data.img ?? "";
  if (!imageBase64) {
    throw new Error("Captcha image base64 is empty");
  }
  return {
    captchaId,
    imageSrc: normalizeCaptchaImage(imageBase64),
  };
}
