"use client";

import { useRouter, usePathname } from "next/navigation";
import { BookOpen, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useLoading } from "@/components/loading-provider";
import { onAuthChanged, signOut } from "@/lib/auth/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface NavbarProps {
	className?: string;
}

export function Navbar({ className }: NavbarProps) {
	const router = useRouter();
	const pathname = usePathname();
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const { isLoading, setLoading } = useLoading();
	const [userDisplayName, setUserDisplayName] = useState<string | null>(null);
	const [userEmail, setUserEmail] = useState<string | null>(null);

	useEffect(() => {
		const unsub = onAuthChanged((u) => {
			setUserDisplayName(u?.displayName || null);
			setUserEmail(u?.email || null);
		});
		return () => unsub();
	}, []);

	const handleNavigation = (path: string) => {
		setLoading(true);
		router.push(path);
		setIsMobileMenuOpen(false); // Close mobile menu after navigation
	};

	const isActivePage = (path: string) => {
		if (path === "/" && pathname === "/") return true;
		if (path !== "/" && pathname.startsWith(path)) return true;
		return false;
	};

	const navItems = [
		{ label: "Browse", path: "/search" },
		{ label: "Categories", path: "/categories" },
		{ label: "About", path: "/about" },
	];

	return (
		<header
			className={`border-b border-border/60 bg-background/95 backdrop-blur-sm sticky top-0 z-50 ${className}`}
		>
			{isLoading && (
				<div className="absolute top-0 left-0 right-0 h-0.5 bg-muted overflow-hidden">
					<div className="h-full bg-foreground animate-pulse" />
				</div>
			)}

			<div className="container mx-auto px-6 py-4">
				<div className="flex items-center justify-between">
					{/* Logo - acts as home button */}
					<button
						onClick={() => handleNavigation("/")}
						className="flex items-center gap-3 transition-all duration-200 hover:opacity-80"
						disabled={isLoading}
					>
						<div className="p-1.5 rounded-lg bg-foreground">
							<BookOpen className="h-5 w-5 text-background" />
						</div>
						<h1 className="text-xl font-semibold text-foreground tracking-tight">
							CompeteDocs
						</h1>
					</button>

					{/* Desktop Navigation */}
					<nav className="hidden md:flex items-center gap-1">
						{navItems.map((item) => (
							<Button
								key={item.path}
								variant="ghost"
								size="sm"
								className={`transition-all duration-200 hover:shadow-sm hover:bg-muted/30 ${
									isActivePage(item.path)
										? "text-foreground bg-muted/50"
										: "text-muted-foreground hover:text-foreground"
								} ${isLoading ? "opacity-50" : ""}`}
								onClick={() => handleNavigation(item.path)}
								disabled={isLoading}
							>
								{item.label}
							</Button>
						))}

						<div className="w-px h-4 bg-border mx-2" />

						{userEmail ? (
							<div className="flex items-center gap-2">
								<Button
									variant="ghost"
									size="sm"
									className={`transition-all duration-200 hover:shadow-sm hover:bg-muted/30 ${
										isActivePage("/dashboard")
											? "text-foreground bg-muted/50"
											: "text-muted-foreground hover:text-foreground"
									} ${isLoading ? "opacity-50" : ""}`}
									onClick={() => handleNavigation("/dashboard")}
									disabled={isLoading}
								>
									Dashboard
								</Button>
								<div className="w-px h-4 bg-border" />
								<div className="flex items-center gap-2 px-2">
									<Avatar className="h-6 w-6">
										<AvatarFallback className="text-xs">
											{(userDisplayName || userEmail || "?")
												.slice(0, 2)
												.toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<span className="text-sm text-muted-foreground hidden lg:inline">
										{userDisplayName || userEmail}
									</span>
								</div>
								<Button
									variant="ghost"
									size="sm"
									className={`transition-all duration-200 hover:shadow-sm hover:bg-muted/30 ${
										isLoading ? "opacity-50" : ""
									}`}
									onClick={async () => {
										setLoading(true);
										try {
											await signOut();
											handleNavigation("/");
										} finally {
											setLoading(false);
										}
									}}
									disabled={isLoading}
								>
									Sign Out
								</Button>
								<Button
									size="sm"
									className={`ml-2 transition-all duration-200 hover:shadow-sm ${
										isLoading ? "opacity-50" : ""
									}`}
									onClick={() => handleNavigation("/upload")}
									disabled={isLoading}
								>
									Upload
								</Button>
							</div>
						) : (
							<>
								<Button
									variant="ghost"
									size="sm"
									className={`transition-all duration-200 hover:shadow-sm hover:bg-muted/30 ${
										isActivePage("/auth/login")
											? "text-foreground bg-muted/50"
											: "text-muted-foreground hover:text-foreground"
									} ${isLoading ? "opacity-50" : ""}`}
									onClick={() => handleNavigation("/auth/login")}
									disabled={isLoading}
								>
									Sign In
								</Button>

								<Button
									size="sm"
									className={`ml-2 transition-all duration-200 hover:shadow-sm ${
										isLoading ? "opacity-50" : ""
									}`}
									onClick={() => handleNavigation("/upload")}
									disabled={isLoading}
								>
									Upload
								</Button>
							</>
						)}
					</nav>

					{/* Mobile Menu Button */}
					<Button
						variant="ghost"
						size="sm"
						className="md:hidden"
						onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
						disabled={isLoading}
					>
						{isMobileMenuOpen ? (
							<X className="h-5 w-5" />
						) : (
							<Menu className="h-5 w-5" />
						)}
					</Button>
				</div>

				{/* Mobile Navigation Menu */}
				{isMobileMenuOpen && (
					<div className="md:hidden mt-4 pb-4 border-t border-border/60 pt-4">
						<nav className="flex flex-col gap-2">
							{navItems.map((item) => (
								<Button
									key={item.path}
									variant="ghost"
									size="sm"
									className={`justify-start transition-all duration-200 hover:shadow-sm hover:bg-muted/30 ${
										isActivePage(item.path)
											? "text-foreground bg-muted/50"
											: "text-muted-foreground hover:text-foreground"
									} ${isLoading ? "opacity-50" : ""}`}
									onClick={() => handleNavigation(item.path)}
									disabled={isLoading}
								>
									{item.label}
								</Button>
							))}

							<div className="h-px bg-border my-2" />

							{userEmail ? (
								<>
									<Button
										variant="ghost"
										size="sm"
										className={`justify-start transition-all duration-200 hover:shadow-sm hover:bg-muted/30 ${
											isActivePage("/dashboard")
												? "text-foreground bg-muted/50"
												: "text-muted-foreground hover:text-foreground"
										} ${isLoading ? "opacity-50" : ""}`}
										onClick={() => handleNavigation("/dashboard")}
										disabled={isLoading}
									>
										Dashboard
									</Button>
									<div className="h-px bg-border my-2" />
									<div className="flex items-center gap-2 px-2 py-1">
										<Avatar className="h-6 w-6">
											<AvatarFallback className="text-xs">
												{(userDisplayName || userEmail || "?")
													.slice(0, 2)
													.toUpperCase()}
											</AvatarFallback>
										</Avatar>
										<span className="text-sm text-muted-foreground">
											{userDisplayName || userEmail}
										</span>
									</div>
									<Button
										variant="ghost"
										size="sm"
										className={`justify-start transition-all duration-200 hover:shadow-sm hover:bg-muted/30 ${
											isLoading ? "opacity-50" : ""
										}`}
										onClick={async () => {
											setLoading(true);
											try {
												await signOut();
												handleNavigation("/");
											} finally {
												setLoading(false);
											}
										}}
										disabled={isLoading}
									>
										Sign Out
									</Button>
									<Button
										size="sm"
										className={`justify-start transition-all duration-200 hover:shadow-sm ${
											isLoading ? "opacity-50" : ""
										}`}
										onClick={() => handleNavigation("/upload")}
										disabled={isLoading}
									>
										Upload
									</Button>
								</>
							) : (
								<>
									<Button
										variant="ghost"
										size="sm"
										className={`justify-start transition-all duration-200 hover:shadow-sm hover:bg-muted/30 ${
											isActivePage("/auth/login")
												? "text-foreground bg-muted/50"
												: "text-muted-foreground hover:text-foreground"
										} ${isLoading ? "opacity-50" : ""}`}
										onClick={() => handleNavigation("/auth/login")}
										disabled={isLoading}
									>
										Sign In
									</Button>

									<Button
										size="sm"
										className={`justify-start transition-all duration-200 hover:shadow-sm ${
											isLoading ? "opacity-50" : ""
										}`}
										onClick={() => handleNavigation("/upload")}
										disabled={isLoading}
									>
										Upload
									</Button>
								</>
							)}
						</nav>
					</div>
				)}
			</div>
		</header>
	);
}
