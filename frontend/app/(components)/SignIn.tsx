"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { signIn } from "@/app/(utils)/auth";

const signInSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type SignInFormValues = z.infer<typeof signInSchema>;

const inputClassName = (hasError: boolean) =>
  `w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:ring-2 ${
    hasError
      ? "border-red-500 focus:border-red-500 focus:ring-red-500/10"
      : "border-gray-300 focus:border-gray-900 focus:ring-gray-900/10"
  }`;

const SignIn = () => {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onTouched",
    reValidateMode: "onChange",
  });

  const onSubmit = async (userData: SignInFormValues) => {
    const { email, password } = userData;

    setAuthError(null);

    const { data, error } = await signIn.email({
      email,
      password,
    });

    if (data) {
      setSuccess(true);
      router.replace("/dashboard");
    } else {
      setAuthError(error.message || "Unable to sign in. Please try again.");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {success ? (
          <p>Success</p>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-gray-900">
                Welcome back
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                Sign in to continue to DropVault.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  aria-invalid={errors.email ? "true" : "false"}
                  className={inputClassName(!!errors.email)}
                  {...register("email")}
                />

                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-600" role="alert">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    aria-invalid={errors.password ? "true" : "false"}
                    className={`${inputClassName(!!errors.password)} pr-20`}
                    {...register("password")}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 hover:text-gray-900"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>

                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-600" role="alert">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {authError && (
                <p className="text-sm text-red-600" role="alert">
                  {authError}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-500"
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
              </button>
            </form>

            {/* Sign up */}
            <p className="mt-6 text-center text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <Link
                href="/getting-started/sign-up"
                className="font-medium text-gray-900 hover:underline"
              >
                Create account
              </Link>
            </p>
          </div>
        )}
      </div>
    </main>
  );
};

export { SignIn };
