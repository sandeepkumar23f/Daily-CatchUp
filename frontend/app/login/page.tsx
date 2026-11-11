import type { Metadata } from "next";
import AuthForm from "@/app/components/auth-form";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to your Daily CatchUp account.",
};

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
