"use client";

import type React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, createContext, useContext } from "react";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

interface LoadingContextType {
	isLoading: boolean;
	setLoading: (loading: boolean) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function useLoading() {
	const context = useContext(LoadingContext);
	if (!context) {
		throw new Error("useLoading must be used within LoadingProvider");
	}
	return context;
}

interface LoadingProviderProps {
	children: React.ReactNode;
}

export function LoadingProvider({ children }: LoadingProviderProps) {
	const [isLoading, setIsLoading] = useState(false);
	const pathname = usePathname();
	const router = useRouter();

	const setLoading = (loading: boolean) => {
		setIsLoading(loading);
	};

	useEffect(() => {
		setIsLoading(false);
	}, [pathname]);

	// Global link click handler to show loader during navigations
	useEffect(() => {
		const onClick = (e: MouseEvent) => {
			const target = e.target as HTMLElement | null;
			if (!target) return;
			const anchor = target.closest("a") as HTMLAnchorElement | null;
			if (!anchor) return;
			const href = anchor.getAttribute("href");
			if (!href) return;
			// Only handle internal navigations
			const isInternal = href.startsWith("/") && !href.startsWith("//");
			const newTab = anchor.target === "_blank" || e.metaKey || e.ctrlKey;
			if (isInternal && !newTab) {
				setIsLoading(true);
			}
		};
		window.addEventListener("click", onClick, true);
		return () => window.removeEventListener("click", onClick, true);
	}, []);

	const contextValue = {
		isLoading,
		setLoading,
	};

	return (
		<LoadingContext.Provider value={contextValue}>
			{children}
			{isLoading && (
				<div className="fixed inset-0 z-[9999] bg-background/70 backdrop-blur-sm flex items-center justify-center transition-opacity duration-200">
					<div className="flex flex-col items-center gap-3">
						<Spinner
							variant="ring"
							size={40}
							className="text-foreground"
						/>
						<div className="text-sm text-muted-foreground font-medium animate-pulse">
							Loading...
						</div>
					</div>
				</div>
			)}
		</LoadingContext.Provider>
	);
}
