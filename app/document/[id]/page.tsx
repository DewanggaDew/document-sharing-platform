"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
	Download,
	Share2,
	Heart,
	BookOpen,
	Calendar,
	Building,
	Users,
	Eye,
	ChevronLeft,
	ChevronRight,
	ZoomIn,
	ZoomOut,
	RotateCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Navbar } from "@/components/navbar";
import { getIdToken } from "@/lib/auth/client";
import { useLoading } from "@/components/loading-provider";

type PaperDetail = {
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
	fileType?: string;
	fileSize?: number;
};

const relatedDocuments = [
	{
		id: "ford-analysis-2024",
		title: "Ford Motor Company Strategic Analysis",
		competition: "McKinsey Case Competition",
		year: "2024",
		university: "Harvard Business School",
		downloads: 892,
		topics: ["Automotive", "Strategy", "Electric Vehicles"],
	},
	{
		id: "ev-market-research",
		title: "Electric Vehicle Market Research 2024",
		competition: "BCG Strategy Contest",
		year: "2024",
		university: "Stanford GSB",
		downloads: 634,
		topics: ["Market Research", "Electric Vehicles", "Industry Analysis"],
	},
	{
		id: "renewable-energy-valuation",
		title: "Renewable Energy Sector Valuation",
		competition: "Goldman Sachs Case Study",
		year: "2023",
		university: "MIT Sloan",
		downloads: 445,
		topics: ["Renewable Energy", "Valuation", "Financial Modeling"],
	},
];

export default function DocumentViewerPage() {
	const [currentPage, setCurrentPage] = useState(1);
	const [zoom, setZoom] = useState(100);
	const [isLiked, setIsLiked] = useState(false);
	const [doc, setDoc] = useState<PaperDetail | null>(null);
	const router = useRouter();
	const { setLoading } = useLoading();

	const handleDownload = async () => {
		try {
			const token = await getIdToken(true);
			const headers: HeadersInit = token
				? { Authorization: `Bearer ${token}` }
				: {};
			const res = await fetch(`/api/papers/${(doc as any)?.id}/download`, {
				headers,
			});
			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				throw new Error(err.error || "Download not allowed");
			}
			const data = await res.json();
			window.location.href = data.url;
		} catch (e: any) {
			alert(e?.message || "Download failed");
		}
	};

	const handleShare = () => {
		// Simulate share
		navigator.clipboard.writeText(window.location.href);
	};

	const handleLike = () => {
		setIsLiked(!isLiked);
	};

	const handleNavigation = (path: string) => {
		setLoading(true);
		router.push(path);
	};

	const handleReport = async () => {
		try {
			const id = (doc as any)?.id;
			if (!id) return;
			const reason =
				prompt("Describe the issue briefly (max 500 chars):") || "";
			if (!reason.trim()) return;
			const token = await getIdToken(true);
			if (!token) throw new Error("Please sign in to report");
			const res = await fetch("/api/flags", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ paperId: id, reason: reason.slice(0, 500) }),
			});
			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				throw new Error(err.error || "Failed to submit report");
			}
			alert("Thanks. Your report has been submitted.");
		} catch (e: any) {
			alert(e?.message || "Report failed");
		}
	};

	// Fetch document
	useEffect(() => {
		const id = window.location.pathname.split("/").pop();
		if (!id) return;
		let mounted = true;
		fetch(`/api/papers/${id}`)
			.then((r) => (r.ok ? r.json() : Promise.reject()))
			.then((d) => {
				if (mounted) setDoc(d);
			})
			.catch(() => {});
		return () => {
			mounted = false;
		};
	}, []);

	return (
		<div className="min-h-screen bg-background">
			<Navbar />

			<div className="container mx-auto px-4 py-6">
				<div className="grid lg:grid-cols-3 gap-8">
					{/* Document Viewer */}
					<div className="lg:col-span-2">
						<Card className="mb-6">
							<CardHeader>
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<CardTitle className="text-2xl mb-2 text-balance">
											{doc?.title ?? "Loading..."}
										</CardTitle>
										<CardDescription className="text-base">
											{doc?.description ?? ""}
										</CardDescription>
									</div>
									<div className="flex items-center gap-2 ml-4">
										<Button
											variant={isLiked ? "default" : "outline"}
											size="sm"
											onClick={handleLike}
											className="gap-2"
										>
											<Heart
												className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`}
											/>
											{(doc?.likes || 0) + (isLiked ? 1 : 0)}
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={handleShare}
											className="gap-2 bg-transparent"
										>
											<Share2 className="h-4 w-4" />
											Share
										</Button>
										<Button
											onClick={handleDownload}
											className="gap-2"
										>
											<Download className="h-4 w-4" />
											Download
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={handleReport}
											className="gap-2"
										>
											Report
										</Button>
									</div>
								</div>
							</CardHeader>
						</Card>

						{/* PDF Viewer */}
						<Card>
							<CardHeader className="pb-4">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-4">
										<span className="text-sm text-muted-foreground">
											Page {currentPage}
										</span>
										<div className="flex items-center gap-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													setCurrentPage(Math.max(1, currentPage - 1))
												}
												disabled={currentPage === 1}
											>
												<ChevronLeft className="h-4 w-4" />
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() => setCurrentPage(currentPage + 1)}
												disabled={false}
											>
												<ChevronRight className="h-4 w-4" />
											</Button>
										</div>
									</div>
									<div className="flex items-center gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => setZoom(Math.max(50, zoom - 25))}
											disabled={zoom <= 50}
										>
											<ZoomOut className="h-4 w-4" />
										</Button>
										<span className="text-sm text-muted-foreground min-w-16 text-center">
											{zoom}%
										</span>
										<Button
											variant="outline"
											size="sm"
											onClick={() => setZoom(Math.min(200, zoom + 25))}
											disabled={zoom >= 200}
										>
											<ZoomIn className="h-4 w-4" />
										</Button>
										<Button
											variant="outline"
											size="sm"
										>
											<RotateCw className="h-4 w-4" />
										</Button>
									</div>
								</div>
							</CardHeader>
							<CardContent>
								{/* PDF Preview Placeholder */}
								<div
									className="bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border"
									style={{ height: `${400 * (zoom / 100)}px` }}
								>
									<div className="text-center">
										<BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
										<p className="text-muted-foreground font-medium">
											PDF Preview
										</p>
										<p className="text-sm text-muted-foreground">
											Page {currentPage}
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Sidebar */}
					<div className="space-y-6">
						{/* Document Details */}
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">Document Details</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex items-center gap-3">
									<Calendar className="h-5 w-5 text-muted-foreground" />
									<div>
										<p className="font-medium">{doc?.competition ?? ""}</p>
										<p className="text-sm text-muted-foreground">
											{doc?.year ?? ""}
										</p>
									</div>
								</div>

								<div className="flex items-center gap-3">
									<Building className="h-5 w-5 text-muted-foreground" />
									<div>
										<p className="font-medium">{doc?.university ?? ""}</p>
										{doc?.team && (
											<p className="text-sm text-muted-foreground">
												{doc.team}
											</p>
										)}
									</div>
								</div>

								<div className="flex items-center gap-3">
									<Users className="h-5 w-5 text-muted-foreground" />
									<div>
										<p className="font-medium">Author</p>
										<div className="flex items-center gap-2 mt-1">
											<Avatar className="h-6 w-6">
												<AvatarFallback className="text-xs">
													{(doc?.university || "?").slice(0, 2).toUpperCase()}
												</AvatarFallback>
											</Avatar>
											<span className="text-sm text-muted-foreground">
												{doc?.university || "Unknown"}
											</span>
										</div>
									</div>
								</div>

								<Separator />

								<div className="grid grid-cols-2 gap-4 text-sm">
									<div>
										<p className="text-muted-foreground">Downloads</p>
										<p className="font-medium">
											{Number(doc?.downloads || 0).toLocaleString("en-US")}
										</p>
									</div>
									<div>
										<p className="text-muted-foreground">Views</p>
										<p className="font-medium">
											{Number(doc?.views || 0).toLocaleString("en-US")}
										</p>
									</div>
									<div>
										<p className="text-muted-foreground">File Size</p>
										<p className="font-medium">
											{doc?.fileSize
												? `${(doc.fileSize / (1024 * 1024)).toFixed(1)} MB`
												: "-"}
										</p>
									</div>
									<div>
										<p className="text-muted-foreground">Pages</p>
										<p className="font-medium">-</p>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Topics */}
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">Topics</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex flex-wrap gap-2">
									{(doc?.topics || []).map((topic) => (
										<Badge
											key={topic}
											variant="secondary"
											className="cursor-pointer hover:bg-secondary/80"
										>
											{topic}
										</Badge>
									))}
								</div>
							</CardContent>
						</Card>

						{/* Companies */}
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">Companies Analyzed</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex flex-wrap gap-2">
									{(doc?.companies || []).map((company) => (
										<Badge
											key={company}
											variant="outline"
											className="cursor-pointer hover:bg-accent/10"
										>
											{company}
										</Badge>
									))}
								</div>
							</CardContent>
						</Card>

						{/* Related Documents */}
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">Related Documents</CardTitle>
								<CardDescription>
									Other documents you might find interesting
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								{relatedDocuments.map((doc) => (
									<div
										key={doc.id}
										className="border border-border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
									>
										<h4 className="font-medium text-sm mb-2 text-balance">
											{doc.title}
										</h4>
										<div className="space-y-1 text-xs text-muted-foreground">
											<p>
												{doc.competition} • {doc.year}
											</p>
											<p>{doc.university}</p>
											<div className="flex items-center gap-2 mt-2">
												<Eye className="h-3 w-3" />
												<span>{doc.downloads} downloads</span>
											</div>
										</div>
										<div className="flex flex-wrap gap-1 mt-2">
											{doc.topics.slice(0, 2).map((topic) => (
												<Badge
													key={topic}
													variant="outline"
													className="text-xs"
												>
													{topic}
												</Badge>
											))}
											{doc.topics.length > 2 && (
												<Badge
													variant="outline"
													className="text-xs"
												>
													+{doc.topics.length - 2}
												</Badge>
											)}
										</div>
									</div>
								))}
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
