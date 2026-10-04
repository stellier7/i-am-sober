import LoginForm from "./login-form";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return <LoginForm unreachable={searchParams.error === "unreachable"} />;
}
