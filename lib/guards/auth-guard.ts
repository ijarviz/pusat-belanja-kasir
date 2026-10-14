import { redirect } from "next/navigation";

export function checkSignupEnabled() {
  if (process.env.NEXT_PUBLIC_ENABLE_SIGNUP !== "true") {
    redirect("/");
  }
}

export function checkForgotPasswordEnabled() {
  if (process.env.NEXT_PUBLIC_ENABLE_FORGOT_PASSWORD !== "true") {
    redirect("/");
  }
}