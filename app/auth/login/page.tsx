"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Navbar } from "@/components/navbar";
import { emailSignIn, googleSignIn } from "@/lib/auth/client";

export default function LoginPage() {
	const [showPassword, setShowPassword] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!email || !password) return;

		setIsLoading(true);

		try {
			await emailSignIn(email, password);
			router.push("/dashboard");
		} catch (error) {
			console.error("Login failed:", error);
			alert("Login failed. Please check your credentials.");
		} finally {
			setIsLoading(false);
		}
	};

	const handleSocialLogin = async (provider: string) => {
		try {
			if (provider === "Google") {
				setIsLoading(true);
				await googleSignIn();
				router.push("/dashboard");
				return;
			}
		} catch (err: any) {
			alert(err?.message || "Social login failed");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-pattern-dots">
			<Navbar />

			<div className="flex items-center justify-center p-4 pt-20">
				<div className="w-full max-w-md">
					<div className="text-center mb-8">
						<h1 className="text-2xl font-bold text-foreground mb-2">
							Welcome Back
						</h1>
						<p className="text-muted-foreground">
							Sign in to access competition resources
						</p>
					</div>

					<Card className="glass-card">
						<CardHeader className="space-y-1 text-center">
							<CardTitle className="text-xl">Sign In</CardTitle>
							<CardDescription>
								Enter your credentials to continue
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<form
								onSubmit={handleSubmit}
								className="space-y-4"
							>
								<div className="space-y-2">
									<Label htmlFor="email">Email</Label>
									<div className="relative">
										<Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
										<Input
											id="email"
											type="email"
											placeholder="Enter your email"
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											className="pl-10 bg-white/80"
											required
										/>
									</div>
								</div>

								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<Label htmlFor="password">Password</Label>
										<Link
											href="/auth/forgot-password"
											className="text-sm text-muted-foreground hover:text-primary transition-colors"
										>
											Forgot password?
										</Link>
									</div>
									<div className="relative">
										<Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
										<Input
											id="password"
											type={showPassword ? "text" : "password"}
											placeholder="Enter your password"
											value={password}
											onChange={(e) => setPassword(e.target.value)}
											className="pl-10 pr-10 bg-white/80"
											required
										/>
										<button
											type="button"
											onClick={() => setShowPassword(!showPassword)}
											className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
										>
											{showPassword ? (
												<EyeOff className="h-4 w-4" />
											) : (
												<Eye className="h-4 w-4" />
											)}
										</button>
									</div>
								</div>

								<Button
									type="submit"
									className="w-full"
									size="lg"
									disabled={isLoading}
								>
									{isLoading ? "Signing In..." : "Sign In"}
									{!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
								</Button>
							</form>

							<div className="relative">
								<div className="absolute inset-0 flex items-center">
									<Separator />
								</div>
								<div className="relative flex justify-center text-xs uppercase">
									<span className="bg-card px-2 text-muted-foreground">
										Or continue with
									</span>
								</div>
							</div>

							<div className="grid grid-cols-1 gap-3">
								<Button
									variant="outline"
									className="bg-white/80"
									onClick={() => handleSocialLogin("Google")}
								>
									<svg
										className="mr-2 h-4 w-4"
										viewBox="0 0 24 24"
									>
										<path
											fill="currentColor"
											d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
										/>
										<path
											fill="currentColor"
											d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
										/>
										<path
											fill="currentColor"
											d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
										/>
										<path
											fill="currentColor"
											d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
										/>
									</svg>
									Google
								</Button>
							</div>

							<div className="text-center text-sm">
								<span className="text-muted-foreground">
									Don't have an account?{" "}
								</span>
								<Link
									href="/auth/signup"
									className="text-primary hover:underline font-medium"
								>
									Sign up
								</Link>
							</div>
						</CardContent>
					</Card>

					<div className="text-center mt-8 text-xs text-muted-foreground">
						By signing in, you agree to our{" "}
						<Link
							href="/terms"
							className="hover:text-primary transition-colors"
						>
							Terms of Service
						</Link>{" "}
						and{" "}
						<Link
							href="/privacy"
							className="hover:text-primary transition-colors"
						>
							Privacy Policy
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
