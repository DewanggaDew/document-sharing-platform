"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
	Search,
	Filter,
	Calendar,
	Building,
	Download,
	Eye,
	Heart,
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Navbar } from "@/components/navbar";
import { useLoading } from "@/components/loading-provider";
import { getIdToken } from "@/lib/auth/client";
import { useToast } from "@/hooks/use-toast";

// Remote data fetched from /api/papers
type Paper = {
	id: string;
	title: string;
	description?: string;
	competition: string;
	year: number;
	university: string;
	team?: string | null;
	category: string;
	topics?: string[];
	companies?: string[];
	downloads?: number;
	views?: number;
	likes?: number;
	created_at?: string;
};

const categories = [
	"All",
	"Business Case",
	"Equity Research",
	"Accounting",
	"Financial Modeling",
	"Strategy",
];
const years = ["All", "2024", "2023", "2022", "2021"];
const sortOptions = [
	{ value: "relevance", label: "Relevance" },
	{ value: "downloads", label: "Most Downloaded" },
	{ value: "recent", label: "Most Recent" },
	{ value: "views", label: "Most Viewed" },
	{ value: "likes", label: "Most Liked" },
];

export default function SearchPage() {
	const [searchQuery, setSearchQuery] = useState("");
	const [filteredDocuments, setFilteredDocuments] = useState<Paper[]>([]);
	const [selectedCategory, setSelectedCategory] = useState("All");
	const [selectedYear, setSelectedYear] = useState("All");
	const [sortBy, setSortBy] = useState("relevance");
	const [showFilters, setShowFilters] = useState(false);
	const router = useRouter();
	const { setLoading } = useLoading();
	const { toast } = useToast();
	const [cursor, setCursor] = useState<string | null>(null);
	const [isLoadingPage, setIsLoadingPage] = useState(false);

	// Filter and sort documents
	useEffect(() => {
		let active = true;
		const controller = new AbortController();
		const fetchResults = async () => {
			setIsLoadingPage(true);
			const params = new URLSearchParams();
			if (searchQuery.trim()) params.set("q", searchQuery);
			if (selectedCategory !== "All") params.set("category", selectedCategory);
			if (selectedYear !== "All") params.set("year", selectedYear);
			// Map UI sort to API sort
			const apiSort =
				sortBy === "downloads" || sortBy === "views" || sortBy === "likes"
					? sortBy
					: "recent";
			params.set("sort", apiSort);
			params.set("limit", "20");
			const res = await fetch(`/api/papers?${params.toString()}`, {
				signal: controller.signal,
			});
			if (!res.ok) {
				setIsLoadingPage(false);
				return;
			}
			const data = await res.json();
			if (!active) return;
			let items: Paper[] = data.items || [];
			// Local sort options
			switch (sortBy) {
				case "downloads":
					items = [...items].sort(
						(a, b) => (b.downloads || 0) - (a.downloads || 0)
					);
					break;
				case "recent":
					items = [...items].sort(
						(a, b) =>
							new Date(b.created_at || 0).getTime() -
							new Date(a.created_at || 0).getTime()
					);
					break;
				case "views":
					items = [...items].sort((a, b) => (b.views || 0) - (a.views || 0));
					break;
				case "likes":
					items = [...items].sort((a, b) => (b.likes || 0) - (a.likes || 0));
					break;
				default:
					break;
			}
			setFilteredDocuments(items);
			setCursor(data.nextCursor || null);
			setIsLoadingPage(false);
		};
		const id = setTimeout(fetchResults, 250);
		return () => {
			active = false;
			controller.abort();
			clearTimeout(id);
		};
	}, [searchQuery, selectedCategory, selectedYear, sortBy]);

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		// Search is handled by useEffect
	};

	const handleNavigation = (path: string) => {
		setLoading(true);
		router.push(path);
	};

	const handleDownloadDoc = async (id: string) => {
		try {
			const token = await getIdToken(true);
			const headers: HeadersInit = token
				? { Authorization: `Bearer ${token}` }
				: {};
			const res = await fetch(`/api/papers/${id}/download`, { headers });
			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				throw new Error(err.error || "Download not allowed");
			}
			const downloadsHeader = res.headers.get("X-Downloads");
			const nextDownloads = downloadsHeader
				? Number.parseInt(downloadsHeader, 10)
				: undefined;
			const blob = await res.blob();
			const url = URL.createObjectURL(blob);
			const disposition = res.headers.get("Content-Disposition") ?? "";
			const match = disposition.match(/filename="?([^";]+)"?/i);
			const filename = match?.[1] || "document";
			const anchor = document.createElement("a");
			anchor.href = url;
			anchor.download = filename;
			anchor.rel = "noopener";
			document.body.appendChild(anchor);
			anchor.click();
			document.body.removeChild(anchor);
			setTimeout(() => URL.revokeObjectURL(url), 2000);
			toast({ title: "Your file is downloading…" });
			setFilteredDocuments((prev) =>
				prev.map((paper) =>
					paper.id === id
						? {
								...paper,
								downloads: nextDownloads ?? (paper.downloads || 0) + 1,
						  }
						: paper
				)
			);
		} catch (e: any) {
			alert(e?.message || "Download failed");
		}
	};

	const loadMore = async () => {
		if (!cursor) return;
		setIsLoadingPage(true);
		const params = new URLSearchParams();
		if (searchQuery.trim()) params.set("q", searchQuery);
		if (selectedCategory !== "All") params.set("category", selectedCategory);
		if (selectedYear !== "All") params.set("year", selectedYear);
		const apiSort =
			sortBy === "downloads" || sortBy === "views" || sortBy === "likes"
				? sortBy
				: "recent";
		params.set("sort", apiSort);
		params.set("limit", "20");
		params.set("cursor", cursor);
		const res = await fetch(`/api/papers?${params.toString()}`);
		if (!res.ok) {
			setIsLoadingPage(false);
			return;
		}
		const data = await res.json();
		let items: Paper[] = data.items || [];
		setFilteredDocuments((prev) => [...prev, ...items]);
		setCursor(data.nextCursor || null);
		setIsLoadingPage(false);
	};

	return (
		<div className="min-h-screen bg-background">
			<Navbar />

			<div className="container mx-auto px-4 py-6">
				{/* Search Header */}
				<div className="mb-8">
					<h2 className="text-3xl font-bold text-foreground mb-4">
						Search Documents
					</h2>

					{/* Search Bar */}
					<form
						onSubmit={handleSearch}
						className="relative max-w-2xl mb-6"
					>
						<Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
						<Input
							placeholder="Search by topic, company, competition, or university..."
							className="pl-12 py-6 text-lg bg-card border-border"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</form>

					{/* Quick Filters and Sort */}
					<div className="flex flex-wrap items-center gap-4">
						<div className="flex items-center gap-2">
							<Label htmlFor="category">Category:</Label>
							<Select
								value={selectedCategory}
								onValueChange={setSelectedCategory}
							>
								<SelectTrigger className="w-48">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{categories.map((category) => (
										<SelectItem
											key={category}
											value={category}
										>
											{category}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="flex items-center gap-2">
							<Label htmlFor="year">Year:</Label>
							<Select
								value={selectedYear}
								onValueChange={setSelectedYear}
							>
								<SelectTrigger className="w-32">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{years.map((year) => (
										<SelectItem
											key={year}
											value={year}
										>
											{year}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="flex items-center gap-2">
							<Label htmlFor="sort">Sort by:</Label>
							<Select
								value={sortBy}
								onValueChange={setSortBy}
							>
								<SelectTrigger className="w-48">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{sortOptions.map((option) => (
										<SelectItem
											key={option.value}
											value={option.value}
										>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<Button
							variant="outline"
							onClick={() => setShowFilters(!showFilters)}
							className="gap-2"
						>
							<Filter className="h-4 w-4" />
							{showFilters ? "Hide Filters" : "More Filters"}
						</Button>
					</div>
				</div>

				<div className="grid lg:grid-cols-4 gap-8">
					{/* Advanced Filters Sidebar */}
					{showFilters && (
						<div className="lg:col-span-1">
							<Card>
								<CardHeader>
									<CardTitle className="text-lg">Advanced Filters</CardTitle>
								</CardHeader>
								<CardContent className="space-y-6">
									{/* Competition Type */}
									<div>
										<Label className="text-sm font-medium mb-3 block">
											Competition Type
										</Label>
										<div className="space-y-2">
											{[
												"CFA Institute",
												"McKinsey",
												"BCG",
												"Goldman Sachs",
												"Case Competition",
											].map((comp) => (
												<div
													key={comp}
													className="flex items-center space-x-2"
												>
													<Checkbox id={comp} />
													<Label
														htmlFor={comp}
														className="text-sm"
													>
														{comp}
													</Label>
												</div>
											))}
										</div>
									</div>

									<Separator />

									{/* University */}
									<div>
										<Label className="text-sm font-medium mb-3 block">
											University
										</Label>
										<div className="space-y-2">
											{[
												"Harvard",
												"Wharton",
												"Stanford",
												"MIT",
												"Columbia",
											].map((uni) => (
												<div
													key={uni}
													className="flex items-center space-x-2"
												>
													<Checkbox id={uni} />
													<Label
														htmlFor={uni}
														className="text-sm"
													>
														{uni}
													</Label>
												</div>
											))}
										</div>
									</div>

									<Separator />

									{/* Topics */}
									<div>
										<Label className="text-sm font-medium mb-3 block">
											Popular Topics
										</Label>
										<div className="space-y-2">
											{[
												"Financial Modeling",
												"Strategy",
												"Valuation",
												"M&A",
												"ESG",
											].map((topic) => (
												<div
													key={topic}
													className="flex items-center space-x-2"
												>
													<Checkbox id={topic} />
													<Label
														htmlFor={topic}
														className="text-sm"
													>
														{topic}
													</Label>
												</div>
											))}
										</div>
									</div>
								</CardContent>
							</Card>
						</div>
					)}

					{/* Search Results */}
					<div className={showFilters ? "lg:col-span-3" : "lg:col-span-4"}>
						<div className="mb-6">
							<p className="text-muted-foreground">
								Found {filteredDocuments.length} document
								{filteredDocuments.length !== 1 ? "s" : ""}
								{searchQuery && ` for "${searchQuery}"`}
							</p>
						</div>

						<div className="space-y-6">
							{filteredDocuments.map((doc) => (
								<Card
									key={doc.id}
									className="hover:shadow-lg transition-shadow cursor-pointer"
								>
									<CardHeader>
										<div className="flex items-start justify-between">
											<div className="flex-1">
												<CardTitle className="text-xl mb-2 text-balance">
													<button
														onClick={() =>
															handleNavigation(`/document/${doc.id}`)
														}
														className="hover:text-primary text-left"
													>
														{doc.title}
													</button>
												</CardTitle>
												<CardDescription className="text-base mb-3">
													{doc.description}
												</CardDescription>

												<div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
													<div className="flex items-center gap-1">
														<Calendar className="h-4 w-4" />
														<span>
															{doc.competition} • {doc.year}
														</span>
													</div>
													<div className="flex items-center gap-1">
														<Building className="h-4 w-4" />
														<span>{doc.university}</span>
													</div>
												</div>

												<div className="flex flex-wrap gap-2 mb-3">
													<Badge variant="secondary">{doc.category}</Badge>
													{(doc.topics || []).slice(0, 3).map((topic) => (
														<Badge
															key={topic}
															variant="outline"
															className="text-xs"
														>
															{topic}
														</Badge>
													))}
													{(doc.topics || []).length > 3 && (
														<Badge
															variant="outline"
															className="text-xs"
														>
															+{(doc.topics || []).length - 3} more
														</Badge>
													)}
												</div>

												<div className="flex flex-wrap gap-2">
													{(doc.companies || []).map((company) => (
														<Badge
															key={company}
															variant="outline"
															className="text-xs bg-primary/5 text-primary"
														>
															{company}
														</Badge>
													))}
												</div>
											</div>
										</div>
									</CardHeader>
									<CardContent>
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-6 text-sm text-muted-foreground">
												<div className="flex items-center gap-1">
													<Download className="h-4 w-4" />
													<span>
														{Number(doc.downloads || 0).toLocaleString("en-US")}
													</span>
												</div>
												<div className="flex items-center gap-1">
													<Eye className="h-4 w-4" />
													<span>
														{Number(doc.views || 0).toLocaleString("en-US")}
													</span>
												</div>
												<div className="flex items-center gap-1">
													<Heart className="h-4 w-4" />
													<span>{doc.likes || 0}</span>
												</div>
											</div>
											<div className="flex items-center gap-2">
												<Button
													variant="outline"
													size="sm"
													onClick={() =>
														handleNavigation(`/document/${doc.id}`)
													}
												>
													View
												</Button>
												<Button
													size="sm"
													onClick={() => handleDownloadDoc(doc.id)}
												>
													Download
												</Button>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>

						{cursor && (
							<div className="flex justify-center mt-8">
								<Button
									onClick={loadMore}
									disabled={isLoadingPage}
								>
									{isLoadingPage ? "Loading..." : "Load More"}
								</Button>
							</div>
						)}

						{filteredDocuments.length === 0 && (
							<Card className="text-center py-12">
								<CardContent>
									<Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
									<h3 className="text-xl font-semibold mb-2">
										No documents found
									</h3>
									<p className="text-muted-foreground mb-4">
										Try adjusting your search terms or filters to find what
										you're looking for.
									</p>
									<Button
										variant="outline"
										onClick={() => {
											setSearchQuery("");
											setSelectedCategory("All");
											setSelectedYear("All");
											setSortBy("relevance");
										}}
									>
										Clear all filters
									</Button>
								</CardContent>
							</Card>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
