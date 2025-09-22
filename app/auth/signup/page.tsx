"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Check } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Navbar } from "@/components/navbar";
import { emailSignUp, googleSignIn } from "@/lib/auth/client";

export default function SignUpPage() {
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		password: "",
		confirmPassword: "",
		agreeToTerms: false,
	});
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const handleInputChange = (field: string, value: string | boolean) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (
			!formData.name ||
			!formData.email ||
			!formData.password ||
			!formData.agreeToTerms
		)
			return;

		if (formData.password !== formData.confirmPassword) {
			alert("Passwords don't match!");
			return;
		}

		setIsLoading(true);

		try {
			await emailSignUp(formData.name, formData.email, formData.password);
			router.push("/dashboard");
		} catch (error) {
			console.error("Registration failed:", error);
			alert("Registration failed. Please try again.");
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
		} catch (error: any) {
			alert(error?.message || "Social signup failed");
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
							Join Our Community
						</h1>
						<p className="text-muted-foreground">
							Create your account to start sharing and discovering
						</p>
					</div>

					<Card className="glass-card">
						<CardHeader className="space-y-1 text-center">
							<CardTitle className="text-xl">Create Account</CardTitle>
							<CardDescription>
								Get access to thousands of competition resources
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<form
								onSubmit={handleSubmit}
								className="space-y-4"
							>
								<div className="space-y-2">
									<Label htmlFor="name">Full Name</Label>
									<div className="relative">
										<User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
										<Input
											id="name"
											type="text"
											placeholder="Enter your full name"
											value={formData.name}
											onChange={(e) =>
												handleInputChange("name", e.target.value)
											}
											className="pl-10 bg-white/80"
										/>
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="email">Email</Label>
									<div className="relative">
										<Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
										<Input
											id="email"
											type="email"
											placeholder="Enter your email"
											value={formData.email}
											onChange={(e) =>
												handleInputChange("email", e.target.value)
											}
											className="pl-10 bg-white/80"
										/>
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="password">Password</Label>
									<div className="relative">
										<Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
										<Input
											id="password"
											type={showPassword ? "text" : "password"}
											placeholder="Create a password"
											value={formData.password}
											onChange={(e) =>
												handleInputChange("password", e.target.value)
											}
											className="pl-10 pr-10 bg-white/80"
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

								<div className="space-y-2">
									<Label htmlFor="confirmPassword">Confirm Password</Label>
									<div className="relative">
										<Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
										<Input
											id="confirmPassword"
											type={showConfirmPassword ? "text" : "password"}
											placeholder="Confirm your password"
											value={formData.confirmPassword}
											onChange={(e) =>
												handleInputChange("confirmPassword", e.target.value)
											}
											className="pl-10 pr-10 bg-white/80"
										/>
										<button
											type="button"
											onClick={() =>
												setShowConfirmPassword(!showConfirmPassword)
											}
											className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
										>
											{showConfirmPassword ? (
												<EyeOff className="h-4 w-4" />
											) : (
												<Eye className="h-4 w-4" />
											)}
										</button>
									</div>
								</div>

								<div className="flex items-start space-x-2">
									<Checkbox
										id="terms"
										checked={formData.agreeToTerms}
										onCheckedChange={(checked) =>
											handleInputChange("agreeToTerms", checked as boolean)
										}
										className="mt-1"
									/>
									<Label
										htmlFor="terms"
										className="text-sm leading-relaxed"
									>
										I agree to the{" "}
										<Link
											href="/terms"
											className="text-primary hover:underline"
										>
											Terms of Service
										</Link>{" "}
										and{" "}
										<Link
											href="/privacy"
											className="text-primary hover:underline"
										>
											Privacy Policy
										</Link>
									</Label>
								</div>

								<Button
									type="submit"
									className="w-full"
									size="lg"
									disabled={!formData.agreeToTerms || isLoading}
								>
									{isLoading ? "Creating Account..." : "Create Account"}
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
									Already have an account?{" "}
								</span>
								<Link
									href="/auth/login"
									className="text-primary hover:underline font-medium"
								>
									Sign in
								</Link>
							</div>
						</CardContent>
					</Card>

					<Card className="glass-card mt-6">
						<CardContent className="pt-6">
							<h3 className="font-semibold mb-4 text-center">
								What you'll get:
							</h3>
							<div className="space-y-3">
								{[
									"Access to 50,000+ competition documents",
									"Personalized recommendations",
									"Upload and share your own materials",
									"Connect with competition winners",
								].map((benefit, index) => (
									<div
										key={index}
										className="flex items-center gap-3 text-sm"
									>
										<div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
											<Check className="h-3 w-3 text-green-600" />
										</div>
										<span className="text-muted-foreground">{benefit}</span>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
