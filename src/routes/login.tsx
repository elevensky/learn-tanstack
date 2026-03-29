import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { redirect, useRouter, useRouterState } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Checkbox, Form, Input, Spin, Typography, message } from "antd";

import { postLogin } from "#/api/auth";
import { LOGIN_CAPTCHA_QUERY_KEY, getCaptchaImage } from "#/api/captcha";
import { useAuth } from "../auth";

const fallback = "/app/dashboard";

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
  const queryClient = useQueryClient();
  const isLoading = useRouterState({ select: (s) => s.isLoading });
  const navigate = Route.useNavigate();
  const [form] = Form.useForm<{
    username: string;
    password: string;
    captcha: string;
    remember?: boolean;
  }>();

  const search = Route.useSearch();
  const {
    data: captchaData,
    isFetching: isCaptchaLoading,
    isError: isCaptchaError,
    refetch: refetchCaptcha,
  } = useQuery({
    queryKey: LOGIN_CAPTCHA_QUERY_KEY,
    queryFn: getCaptchaImage,
  });

  const loginMutation = useMutation({
    mutationFn: postLogin,
    onSuccess: async (session) => {
      queryClient.removeQueries({ queryKey: [...LOGIN_CAPTCHA_QUERY_KEY] });
      await auth.login(session);
      await router.invalidate();
      message.success("登录成功");
      if (search.redirect) {
        window.location.href = search.redirect;
        return;
      }
      await navigate({ to: fallback });
    },
    onError: (err: Error) => {
      message.error(err.message || "登录失败");
      void refetchCaptcha();
    },
  });

  const onFormSubmit = (values: {
    username: string;
    password: string;
    captcha: string;
    remember?: boolean;
  }) => {
    const captchaId = captchaData?.captchaId ?? "";
    if (!captchaId) {
      message.error("验证码未就绪，请点击图片刷新");
      return;
    }
    void values.remember;
    loginMutation.mutate({
      username: values.username.trim(),
      password: values.password,
      captchaId,
      verifyCode: values.captcha.trim(),
    });
  };

  React.useEffect(() => {
    form.setFieldValue("captcha", "");
  }, [captchaData?.captchaId, form]);

  React.useEffect(() => {
    const html = document.documentElement;
    html.classList.remove("dark");
    html.classList.add("light");
    html.setAttribute("data-theme", "light");
    html.style.colorScheme = "light";
  }, []);

  const isLoggingIn = isLoading || loginMutation.isPending;

  return (
    <div className="min-h-[calc(100vh-2rem)] grid place-items-center px-6 py-8 sm:px-10">
      <div className="w-full max-w-[1080px] grid gap-8 lg:grid-cols-[1fr_430px] items-center">
        <section className="hidden lg:block rise-in">
          <Typography.Text className="island-kicker">
            TanStack Demo
          </Typography.Text>
          <Typography.Title
            level={2}
            style={{ marginTop: 10, marginBottom: 10 }}
          >
            简洁的用户中心登录
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>
            登录后进入 App Center，统一由 `/app`
            布局渲染。页面聚焦输入效率，支持图文验证码刷新。
          </Typography.Paragraph>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            适合后续扩展短信登录、第三方登录和多租户切换等能力。
          </Typography.Paragraph>
        </section>

        <section
          className="rise-in rounded-xl border border-[#e5e7eb] bg-white p-5 sm:p-6"
          style={{ boxShadow: "0 8px 24px rgba(15,23,42,0.06)" }}
        >
          <div className="mb-4">
            <Typography.Title level={3} style={{ marginBottom: 4 }}>
              登录
            </Typography.Title>
            <Typography.Text type="secondary">请输入账号信息</Typography.Text>
          </div>

          <Form
            form={form}
            layout="horizontal"
            initialValues={{ remember: true }}
            disabled={isLoggingIn || isCaptchaLoading}
            onFinish={onFormSubmit}
            requiredMark={false}
            size="middle"
            labelCol={{ flex: "84px" }}
            wrapperCol={{ flex: 1 }}
            labelAlign="right"
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

            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: "请输入密码" }]}
            >
              <Input.Password
                placeholder="请输入密码"
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
              <div className="flex items-center gap-2">
                <Input
                  placeholder="请输入验证码"
                  autoComplete="off"
                  maxLength={8}
                  style={{ width: 130 }}
                />
                <button
                  type="button"
                  onClick={() => {
                    refetchCaptcha().catch(() => {});
                  }}
                  disabled={isLoggingIn || isCaptchaLoading}
                  title="点击刷新验证码"
                  className="h-8 w-[100px] rounded border border-[#d1d5db] bg-white px-2 grid place-items-center disabled:cursor-not-allowed"
                >
                  {isCaptchaLoading ? (
                    <Spin size="small" />
                  ) : captchaData?.imageSrc ? (
                    <img
                      src={captchaData.imageSrc}
                      alt="图文验证码"
                      className="h-6 w-auto object-contain select-none"
                    />
                  ) : (
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {isCaptchaError ? "加载失败" : "暂无验证码"}
                    </Typography.Text>
                  )}
                </button>
              </div>
            </Form.Item>

            <Form.Item label=" " colon={false} style={{ marginBottom: 10 }}>
              <div className="flex items-center justify-between">
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox>自动登录</Checkbox>
                </Form.Item>
                <Typography.Link href="#" onClick={(e) => e.preventDefault()}>
                  忘记密码
                </Typography.Link>
              </div>
            </Form.Item>

            <Form.Item label=" " colon={false} style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoggingIn}
                className="min-w-24"
              >
                登录
              </Button>
            </Form.Item>
          </Form>
        </section>
      </div>
    </div>
  );
}
