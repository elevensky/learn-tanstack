import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { redirect, useRouter, useRouterState } from "@tanstack/react-router";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Divider,
  Form,
  Input,
  Spin,
  Typography,
  message,
} from "antd";

import { useAuth } from "../auth";
import { sleep } from "../utils";

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
const fallback = "/app/dashboard" as const;
const CAPTCHA_API = "/api/captcha";

type CaptchaResponse = {
  captchaId?: string;
  id?: string;
  imageBase64?: string;
  base64?: string;
  image?: string;
};

function normalizeCaptchaImage(rawBase64: string) {
  const trimmed = rawBase64.trim();
  if (trimmed.startsWith("data:image/")) {
    return trimmed;
  }
  return `data:image/png;base64,${trimmed}`;
}

async function fetchCaptcha() {
  const response = await fetch(CAPTCHA_API, { method: "GET" });
  if (!response.ok) {
    throw new Error(`Captcha API error: ${response.status}`);
  }

  const data = (await response.json()) as CaptchaResponse;
  const captchaId = data.captchaId ?? data.id ?? "";
  const imageBase64 = data.imageBase64 ?? data.base64 ?? data.image ?? "";
  if (!imageBase64) {
    throw new Error("Captcha image base64 is empty");
  }

  return {
    captchaId,
    imageSrc: normalizeCaptchaImage(imageBase64),
  };
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect:
      typeof search.redirect === "string" && search.redirect.length > 0
        ? search.redirect
        : undefined,
  }),
  beforeLoad: ({ context, search }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: search.redirect || fallback });
    }
  },
  component: LoginComponent,
});

function LoginComponent() {
  const auth = useAuth();
  const router = useRouter();
  const isLoading = useRouterState({ select: (s) => s.isLoading });
  const navigate = Route.useNavigate();
  const [form] = Form.useForm<{
    username: string;
    password?: string;
    captcha: string;
    remember?: boolean;
  }>();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [captchaImageSrc, setCaptchaImageSrc] = React.useState("");
  const [captchaId, setCaptchaId] = React.useState("");
  const [isCaptchaLoading, setIsCaptchaLoading] = React.useState(false);
  const [captchaLoadError, setCaptchaLoadError] = React.useState("");

  const search = Route.useSearch();

  const onFormSubmit = async (values: {
    username: string;
    password?: string;
    captcha: string;
    remember?: boolean;
  }) => {
    if (!captchaId) {
      message.error("验证码未就绪，请先刷新验证码");
      return;
    }

    setIsSubmitting(true);
    try {
      // Demo 里 auth.login 只接收用户名，这里先完成验证码输入校验和 captchaId 携带准备。
      // 后续可将 values.captcha + captchaId 一起提交到真实登录接口。
      void values.captcha;
      void captchaId;
      await auth.login(values.username.trim());

      await router.invalidate();

      // This is just a hack being used to wait for the auth state to update
      // in a real app, you'd want to use a more robust solution
      await sleep(1);

      if (search.redirect) {
        window.location.href = search.redirect;
        return;
      }

      await navigate({ to: fallback });
    } catch (error) {
      console.error("Error logging in: ", error);
      message.error("登录失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  const reloadCaptcha = React.useCallback(async () => {
    setIsCaptchaLoading(true);
    setCaptchaLoadError("");
    try {
      const captchaData = await fetchCaptcha();
      setCaptchaImageSrc(captchaData.imageSrc);
      setCaptchaId(captchaData.captchaId);
      form.setFieldValue("captcha", "");
    } catch (error) {
      console.error("Failed to load captcha:", error);
      setCaptchaLoadError("验证码加载失败，请点击刷新");
      setCaptchaImageSrc("");
      setCaptchaId("");
    } finally {
      setIsCaptchaLoading(false);
    }
  }, [form]);

  React.useEffect(() => {
    void reloadCaptcha();
  }, [reloadCaptcha]);

  const isLoggingIn = isLoading || isSubmitting;

  return (
    <div className="min-h-[calc(100vh-2rem)] grid place-items-center p-6 sm:p-10">
      <div className="w-full max-w-[1000px] grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-stretch">
        <section className="hidden lg:flex flex-col justify-center rounded-2xl p-8 island-shell rise-in">
          <Typography.Text className="island-kicker">
            TanStack Demo
          </Typography.Text>
          <Typography.Title
            level={2}
            style={{ marginTop: 12, marginBottom: 12 }}
          >
            企业级管理台登录体验
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            基于 Ant Design Form
            重构，采用独立登录布局，不继承站点公共头尾。输入用户名即可体验鉴权路由跳转。
          </Typography.Paragraph>
        </section>

        <Card
          className="rise-in"
          style={{ borderRadius: 16 }}
          styles={{
            body: {
              padding: 28,
              display: "grid",
              gap: 16,
            },
          }}
        >
          <div>
            <Typography.Title level={3} style={{ marginBottom: 6 }}>
              欢迎登录
            </Typography.Title>
            <Typography.Text type="secondary">
              使用账号密码登录系统
            </Typography.Text>
          </div>

          {search.redirect ? (
            <Alert
              type="warning"
              showIcon
              message="需要登录后才能访问目标页面"
              description="登录成功后将自动跳转到你原本想访问的地址。"
            />
          ) : null}

          <Form
            form={form}
            layout="vertical"
            initialValues={{ remember: true }}
            disabled={isLoggingIn || isCaptchaLoading}
            onFinish={onFormSubmit}
            requiredMark={false}
            size="large"
          >
            <Form.Item
              name="username"
              label="用户名"
              rules={[
                { required: true, message: "请输入用户名" },
                { min: 2, message: "用户名至少 2 个字符" },
              ]}
            >
              <Input placeholder="请输入用户名" autoComplete="username" />
            </Form.Item>

            <Form.Item name="password" label="密码">
              <Input.Password
                placeholder="请输入密码（示例中不校验）"
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item
              name="captcha"
              label="图文验证码"
              rules={[
                { required: true, message: "请输入图文验证码" },
                { min: 4, message: "验证码长度至少 4 位" },
              ]}
            >
              <Input
                placeholder="请输入验证码"
                autoComplete="off"
                maxLength={8}
                addonAfter={
                  <Button
                    type="link"
                    size="small"
                    onClick={() => void reloadCaptcha()}
                    disabled={isLoggingIn}
                    style={{ paddingInline: 4 }}
                  >
                    刷新
                  </Button>
                }
              />
            </Form.Item>

            <div className="mb-5">
              <div className="h-12 rounded-md border border-[var(--line)] bg-white/70 px-3 grid items-center">
                {isCaptchaLoading ? (
                  <Spin size="small" />
                ) : captchaImageSrc ? (
                  <img
                    src={captchaImageSrc}
                    alt="图文验证码"
                    className="h-8 w-auto object-contain select-none"
                  />
                ) : (
                  <Typography.Text type="secondary">
                    {captchaLoadError || "暂无验证码"}
                  </Typography.Text>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between mb-5">
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>自动登录</Checkbox>
              </Form.Item>
              <Typography.Link href="#" onClick={(e) => e.preventDefault()}>
                忘记密码
              </Typography.Link>
            </div>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                block
                type="primary"
                htmlType="submit"
                loading={isLoggingIn}
              >
                登录
              </Button>
            </Form.Item>
          </Form>

          <Divider style={{ margin: "4px 0 0" }} />
          <Typography.Text type="secondary">
            还没有账号？
            <Typography.Link href="#" onClick={(e) => e.preventDefault()}>
              立即注册
            </Typography.Link>
          </Typography.Text>
        </Card>
      </div>
    </div>
  );
}
