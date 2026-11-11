import type { Metadata } from "next";
import AuthForm from "@/app/components/auth-form";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create your free Daily CatchUp account.",
};

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
