"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
	Upload,
	Download,
	Eye,
	Heart,
	User,
	Calendar,
	TrendingUp,
	FileText,
	Star,
	Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Navbar } from "@/components/navbar";
import { useLoading } from "@/components/loading-provider";
import { onAuthChanged, getIdToken } from "@/lib/auth/client";
import type { PaperRow, FlagRow } from "@/lib/supabase/types";
import React from "react";
// Removed mock data and Firestore; using Supabase via /api/me

export default function DashboardPage() {
	const [activeTab, setActiveTab] = useState("overview");
	const router = useRouter();
	const { setLoading } = useLoading();

	const [userName, setUserName] = useState<string | null>(null);
	const [userEmail, setUserEmail] = useState<string | null>(null);
	const [userAvatar] = useState<string | null>(null);
	const [uploads, setUploads] = useState<PaperRow[]>([]);
	const [stats, setStats] = useState({
		documentsUploaded: 0,
		totalDownloads: 0,
		totalViews: 0,
		totalLikes: 0,
	});
	const [myFlags, setMyFlags] = useState<FlagRow[]>([]);

	// Fetch current user and their uploads
	React.useEffect(() => {
		const unsub = onAuthChanged(async (u) => {
			setUserName(u?.displayName || null);
			setUserEmail(u?.email || null);

			if (!u) {
				setUploads([]);
				setStats({
					documentsUploaded: 0,
					totalDownloads: 0,
					totalViews: 0,
					totalLikes: 0,
				});
				return;
			}

			try {
				const token = await getIdToken();
				if (!token) return;
				const res = await fetch("/api/me", {
					headers: { Authorization: `Bearer ${token}` },
					cache: "no-store",
				});
				if (!res.ok) return;
				const data = await res.json();
				setUploads(data.uploads || []);
				setStats(
					data.stats || {
						documentsUploaded: 0,
						totalDownloads: 0,
						totalViews: 0,
						totalLikes: 0,
					}
				);
				setMyFlags(data.flags || []);
			} catch {
				// ignore
			}
		});
		return () => unsub();
	}, []);

	const handleNavigation = (path: string) => {
		setLoading(true);
		router.push(path);
	};

	const handleDownload = (docId: string) => {
		console.log(`Downloading document: ${docId}`);
	};

	const handleEdit = (docId: string) => {
		console.log(`Editing document: ${docId}`);
		setLoading(true);
		router.push(`/upload?edit=${docId}`);
	};

	return (
		<div className="min-h-screen bg-background">
			<Navbar />

			<div className="container mx-auto px-4 py-6">
				{/* User Profile Header */}
				<div className="mb-8">
					<Card>
						<CardContent className="pt-6">
							<div className="flex items-center gap-6">
								<Avatar className="h-20 w-20">
									<AvatarImage
										src={userAvatar || "/placeholder.svg"}
										alt={userName || userEmail || "User"}
									/>
									<AvatarFallback className="text-lg">
										{(userName || userEmail || "U").slice(0, 2).toUpperCase()}
									</AvatarFallback>
								</Avatar>
								<div className="flex-1">
									<h2 className="text-2xl font-bold text-foreground mb-1">
										{userName || userEmail || "Guest"}
									</h2>
									{userEmail && (
										<p className="text-muted-foreground mb-2">{userEmail}</p>
									)}
									<div className="flex items-center gap-4 text-sm text-muted-foreground">
										<div className="flex items-center gap-1">
											<User className="h-4 w-4" />
											<span>{userName ? "Member" : "Not signed in"}</span>
										</div>
										<div className="flex items-center gap-1">
											<Calendar className="h-4 w-4" />
											<span>Joined —</span>
										</div>
									</div>
								</div>
								<Button
									className="gap-2"
									onClick={() => handleNavigation("/upload")}
									disabled={!userEmail}
								>
									<Upload className="h-4 w-4" />
									Upload Document
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Stats Cards */}
				<div className="grid md:grid-cols-4 gap-6 mb-8">
					<Card>
						<CardContent className="pt-6">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-primary/10 rounded-lg">
									<FileText className="h-6 w-6 text-primary" />
								</div>
								<div>
									<p className="text-2xl font-bold">
										{stats.documentsUploaded}
									</p>
									<p className="text-sm text-muted-foreground">
										Documents Uploaded
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="pt-6">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-secondary/10 rounded-lg">
									<Download className="h-6 w-6 text-secondary" />
								</div>
								<div>
									<p className="text-2xl font-bold">
										{stats.totalDownloads.toLocaleString("en-US")}
									</p>
									<p className="text-sm text-muted-foreground">
										Total Downloads
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="pt-6">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-accent/10 rounded-lg">
									<Eye className="h-6 w-6 text-accent" />
								</div>
								<div>
									<p className="text-2xl font-bold">
										{stats.totalViews.toLocaleString("en-US")}
									</p>
									<p className="text-sm text-muted-foreground">Total Views</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="pt-6">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-destructive/10 rounded-lg">
									<Heart className="h-6 w-6 text-destructive" />
								</div>
								<div>
									<p className="text-2xl font-bold">{stats.totalLikes}</p>
									<p className="text-sm text-muted-foreground">Total Likes</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Main Content Tabs */}
				<Tabs
					value={activeTab}
					onValueChange={setActiveTab}
				>
					<TabsList className="grid w-full grid-cols-4">
						<TabsTrigger value="overview">Overview</TabsTrigger>
						<TabsTrigger value="uploads">My Uploads</TabsTrigger>
						<TabsTrigger value="downloads">Download History</TabsTrigger>
						<TabsTrigger value="flags">Flags</TabsTrigger>
					</TabsList>

					<TabsContent
						value="overview"
						className="space-y-6"
					>
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<TrendingUp className="h-5 w-5" />
									Performance Overview
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2 text-sm text-muted-foreground">
								<p>Documents uploaded: {stats.documentsUploaded}</p>
								<p>
									Total downloads:{" "}
									{stats.totalDownloads.toLocaleString("en-US")}
								</p>
								<p>Total views: {stats.totalViews.toLocaleString("en-US")}</p>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent
						value="uploads"
						className="space-y-6"
					>
						<div className="flex items-center justify-between">
							<h3 className="text-xl font-semibold">My Uploaded Documents</h3>
							<Button
								onClick={() => handleNavigation("/upload")}
								disabled={!userEmail}
							>
								Upload New Document
							</Button>
						</div>

						<div className="space-y-4">
							{uploads.length === 0 && (
								<Card className="transition-all duration-200">
									<CardContent className="pt-6 text-sm text-muted-foreground">
										No uploads yet.
									</CardContent>
								</Card>
							)}
							{uploads.map((doc) => (
								<Card
									key={doc.id}
									className="transition-all duration-200 hover:shadow-sm hover:bg-muted/30"
								>
									<CardContent className="pt-6">
										<div className="flex items-start justify-between">
											<div className="flex-1">
												<div className="flex items-center gap-3 mb-2">
													<h4 className="font-semibold text-lg">{doc.title}</h4>
													<Badge
														variant={
															(doc.status === "active"
																? "default"
																: "secondary") as any
														}
													>
														{doc.status === "active" ? "Published" : doc.status}
													</Badge>
												</div>
												<div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
													<span>
														{doc.competition} • {doc.year}
													</span>
													<Badge variant="outline">{doc.category}</Badge>
												</div>
												<div className="flex items-center gap-6 text-sm text-muted-foreground">
													<div className="flex items-center gap-1">
														<Download className="h-4 w-4" />
														<span>
															{Number(doc.downloads || 0).toLocaleString(
																"en-US"
															)}
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
														<span>{Number(doc.likes || 0)}</span>
													</div>
												</div>
											</div>
											<div className="flex items-center gap-2">
												<Button
													variant="outline"
													size="sm"
													onClick={() => handleEdit(doc.id)}
												>
													Edit
												</Button>
												<Button
													variant="outline"
													size="sm"
													onClick={() =>
														handleNavigation(`/document/${doc.id}`)
													}
												>
													View
												</Button>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</TabsContent>

					<TabsContent
						value="downloads"
						className="space-y-6"
					>
						<h3 className="text-xl font-semibold">Download History</h3>
						<Card className="transition-all duration-200">
							<CardContent className="pt-6 text-sm text-muted-foreground">
								No download history available.
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent
						value="flags"
						className="space-y-6"
					>
						<h3 className="text-xl font-semibold">My Flags</h3>
						{myFlags.length === 0 ? (
							<Card className="transition-all duration-200">
								<CardContent className="pt-6 text-sm text-muted-foreground">
									No flags submitted.
								</CardContent>
							</Card>
						) : (
							<div className="space-y-3">
								{myFlags.map((f) => (
									<Card
										key={f.id}
										className="transition-all duration-200 hover:shadow-sm hover:bg-muted/30"
									>
										<CardContent className="pt-4">
											<div className="flex items-center justify-between text-sm">
												<div>
													<div className="font-medium">
														Paper ID: {f.paper_id}
													</div>
													<div className="text-muted-foreground">
														Reason: {f.reason}
													</div>
												</div>
												<Badge variant="outline">{f.status || "open"}</Badge>
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						)}
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
