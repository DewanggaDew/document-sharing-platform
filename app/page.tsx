"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
	Search,
	TrendingUp,
	BookOpen,
	Calculator,
	BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/navbar";
import { useLoading } from "@/components/loading-provider";

export default function HomePage() {
	const [searchQuery, setSearchQuery] = useState("");
	const router = useRouter();
	const { setLoading } = useLoading();

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		if (searchQuery.trim()) {
			setLoading(true);
			router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
		}
	};

	const handleQuickSearch = (tag: string) => {
		setLoading(true);
		router.push(`/search?q=${encodeURIComponent(tag)}`);
	};

	const handleNavigation = (path: string) => {
		setLoading(true);
		router.push(path);
	};

	const categories = [
		{
			title: "Business Cases",
			description: "Strategic analysis and case competition solutions",
			icon: BarChart3,
			count: "1,247 documents",
			color: "bg-muted text-foreground",
		},
		{
			title: "Equity Research",
			description: "Company analysis and investment recommendations",
			icon: TrendingUp,
			count: "892 documents",
			color: "bg-muted text-foreground",
		},
		{
			title: "Accounting",
			description: "Financial statements and accounting case studies",
			icon: Calculator,
			count: "634 documents",
			color: "bg-muted text-foreground",
		},
	];

	const featuredDocuments = [
		{
			title: "Tesla Q3 2024 Equity Analysis",
			competition: "CFA Institute Research Challenge",
			year: "2024",
			university: "Wharton School",
			topics: ["Electric Vehicles", "Renewable Energy", "Financial Modeling"],
			downloads: 1247,
		},
		{
			title: "McKinsey Case: Digital Transformation Strategy",
			competition: "Case Competition World Championship",
			year: "2024",
			university: "Harvard Business School",
			topics: ["Digital Strategy", "Change Management", "Technology"],
			downloads: 892,
		},
		{
			title: "Coca-Cola Financial Statement Analysis",
			competition: "National Accounting Case Competition",
			year: "2023",
			university: "Stanford Graduate School",
			topics: ["Financial Analysis", "Ratio Analysis", "Valuation"],
			downloads: 634,
		},
	];

	return (
		<div className="min-h-screen bg-background">
			{/* Navbar */}
			<Navbar />

			{/* Hero Section */}
			<section className="py-20 px-6">
				<div className="container mx-auto max-w-4xl text-center">
					<h2 className="text-5xl md:text-6xl font-bold text-foreground mb-6 text-balance tracking-tight">
						Discover Winning Competition Documents
					</h2>
					<p className="text-lg text-muted-foreground mb-12 text-pretty max-w-2xl mx-auto leading-relaxed">
						Access a curated collection of award-winning business cases, equity
						research, and accounting analyses from top universities worldwide.
					</p>

					<form
						onSubmit={handleSearch}
						className="relative max-w-2xl mx-auto mb-8"
					>
						<Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
						<Input
							placeholder="Search by topic, company, or competition..."
							className="pl-12 py-4 text-base bg-background border-border/60 notion-focus shadow-sm"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
						<Button
							type="submit"
							className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8"
						>
							Search
						</Button>
					</form>

					<div className="flex flex-wrap justify-center gap-2 mb-16">
						{[
							"Tesla",
							"Financial Modeling",
							"McKinsey Case",
							"M&A Strategy",
							"Coca-Cola",
						].map((tag) => (
							<Badge
								key={tag}
								variant="secondary"
								className="cursor-pointer notion-hover px-3 py-1"
								onClick={() => handleQuickSearch(tag)}
							>
								{tag}
							</Badge>
						))}
					</div>
				</div>
			</section>

			{/* Categories Section */}
			<section className="py-16 px-6 bg-muted/20">
				<div className="container mx-auto">
					<h3 className="text-3xl font-semibold text-center mb-12 text-foreground tracking-tight">
						Browse by Category
					</h3>
					<div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
						{categories.map((category, index) => {
							const Icon = category.icon;
							return (
								<Card
									key={index}
									className="notion-hover cursor-pointer border-border/60 shadow-sm bg-background"
									onClick={() =>
										handleNavigation(
											`/categories?category=${category.title
												.toLowerCase()
												.replace(" ", "-")}`
										)
									}
								>
									<CardHeader className="text-center pb-4">
										<div
											className={`w-12 h-12 rounded-lg ${category.color} flex items-center justify-center mx-auto mb-4`}
										>
											<Icon className="h-6 w-6" />
										</div>
										<CardTitle className="text-lg font-semibold">
											{category.title}
										</CardTitle>
										<CardDescription className="text-muted-foreground text-sm leading-relaxed">
											{category.description}
										</CardDescription>
									</CardHeader>
									<CardContent className="text-center pt-0">
										<p className="text-xs text-muted-foreground font-medium">
											{category.count}
										</p>
									</CardContent>
								</Card>
							);
						})}
					</div>
				</div>
			</section>

			{/* Featured Documents */}
			<section className="py-16 px-6">
				<div className="container mx-auto">
					<div className="flex items-center justify-between mb-12">
						<h3 className="text-3xl font-semibold text-foreground tracking-tight">
							Most Downloaded
						</h3>
						<Button
							variant="outline"
							className="notion-hover notion-focus bg-transparent"
							onClick={() => handleNavigation("/search")}
						>
							View All
						</Button>
					</div>

					<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
						{featuredDocuments.map((doc, index) => (
							<Card
								key={index}
								className="notion-hover cursor-pointer border-border/60 shadow-sm bg-background"
								onClick={() =>
									handleNavigation(
										`/document/${doc.title
											.toLowerCase()
											.replace(/\s+/g, "-")
											.replace(/[^a-z0-9-]/g, "")}`
									)
								}
							>
								<CardHeader className="pb-4">
									<CardTitle className="text-base font-semibold text-balance leading-snug">
										{doc.title}
									</CardTitle>
									<CardDescription>
										<div className="space-y-1">
											<p className="font-medium text-foreground text-sm">
												{doc.competition}
											</p>
											<p className="text-xs text-muted-foreground">
												{doc.university} • {doc.year}
											</p>
										</div>
									</CardDescription>
								</CardHeader>
								<CardContent className="pt-0">
									<div className="flex flex-wrap gap-1 mb-4">
										{doc.topics.slice(0, 2).map((topic, topicIndex) => (
											<Badge
												key={topicIndex}
												variant="outline"
												className="text-xs px-2 py-0.5"
											>
												{topic}
											</Badge>
										))}
										{doc.topics.length > 2 && (
											<Badge
												variant="outline"
												className="text-xs px-2 py-0.5"
											>
												+{doc.topics.length - 2} more
											</Badge>
										)}
									</div>
									<div className="flex items-center justify-between text-xs text-muted-foreground">
										<span className="font-medium">
											{Number(doc.downloads).toLocaleString("en-US")} downloads
										</span>
										<Button
											size="sm"
											variant="ghost"
											className="h-7 px-2 text-xs notion-hover"
											onClick={(e) => {
												e.stopPropagation();
												handleNavigation(
													`/document/${doc.title
														.toLowerCase()
														.replace(/\s+/g, "-")
														.replace(/[^a-z0-9-]/g, "")}`
												);
											}}
										>
											View
										</Button>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="border-t border-border/60 bg-muted/10 py-12 px-6">
				<div className="container mx-auto">
					<div className="grid md:grid-cols-4 gap-8">
						<div>
							<div className="flex items-center gap-3 mb-4">
								<div className="p-1 rounded bg-foreground">
									<BookOpen className="h-4 w-4 text-background" />
								</div>
								<span className="font-semibold text-base">CompeteDocs</span>
							</div>
							<p className="text-sm text-muted-foreground leading-relaxed">
								The premier platform for sharing and discovering
								competition-winning documents.
							</p>
						</div>
						{[
							{
								title: "Categories",
								links: ["Business Cases", "Equity Research", "Accounting"],
							},
							{
								title: "Resources",
								links: [
									"Upload Guidelines",
									"Competition Calendar",
									"Help Center",
								],
							},
							{
								title: "Company",
								links: ["About Us", "Contact", "Privacy Policy"],
							},
						].map((section, index) => (
							<div key={index}>
								<h4 className="font-semibold mb-4 text-sm">{section.title}</h4>
								<ul className="space-y-2">
									{section.links.map((link) => (
										<li key={link}>
											<a
												href="#"
												className="text-sm text-muted-foreground hover:text-foreground transition-colors"
											>
												{link}
											</a>
										</li>
									))}
								</ul>
							</div>
						))}
					</div>
					<div className="border-t border-border/60 mt-8 pt-8 text-center">
						<p className="text-xs text-muted-foreground">
							&copy; 2024 CompeteDocs. All rights reserved.
						</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
