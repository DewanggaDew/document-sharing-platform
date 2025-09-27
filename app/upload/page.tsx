"use client";

import type React from "react";
import { Navbar } from "@/components/navbar";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Progress } from "@/components/ui/progress";
import { getIdToken } from "@/lib/auth/client";

interface UploadedFile {
	file: File;
	preview: string;
}

export default function UploadPage() {
	const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [formData, setFormData] = useState({
		title: "",
		competition: "",
		year: "",
		university: "",
		team: "",
		description: "",
		category: "",
		topics: [] as string[],
		companies: [] as string[],
	});
	const [currentTopic, setCurrentTopic] = useState("");
	const [currentCompany, setCurrentCompany] = useState("");

	const router = useRouter();

	const onDrop = useCallback((acceptedFiles: File[]) => {
		const newFiles = acceptedFiles.map((file) => ({
			file,
			preview: URL.createObjectURL(file),
		}));
		setUploadedFiles((prev) => [...prev, ...newFiles]);
	}, []);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: {
			"application/pdf": [".pdf"],
			"application/msword": [".doc"],
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document":
				[".docx"],
			"application/vnd.ms-powerpoint": [".ppt"],
			"application/vnd.openxmlformats-officedocument.presentationml.presentation":
				[".pptx"],
		},
		maxSize: 50 * 1024 * 1024, // 50MB
	});

	const removeFile = (index: number) => {
		setUploadedFiles((prev) => {
			const newFiles = [...prev];
			URL.revokeObjectURL(newFiles[index].preview);
			newFiles.splice(index, 1);
			return newFiles;
		});
	};

	const addTopic = () => {
		if (currentTopic.trim() && !formData.topics.includes(currentTopic.trim())) {
			setFormData((prev) => ({
				...prev,
				topics: [...prev.topics, currentTopic.trim()],
			}));
			setCurrentTopic("");
		}
	};

	const removeTopic = (topic: string) => {
		setFormData((prev) => ({
			...prev,
			topics: prev.topics.filter((t) => t !== topic),
		}));
	};

	const addCompany = () => {
		if (
			currentCompany.trim() &&
			!formData.companies.includes(currentCompany.trim())
		) {
			setFormData((prev) => ({
				...prev,
				companies: [...prev.companies, currentCompany.trim()],
			}));
			setCurrentCompany("");
		}
	};

	const removeCompany = (company: string) => {
		setFormData((prev) => ({
			...prev,
			companies: prev.companies.filter((c) => c !== company),
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (uploadedFiles.length === 0) return;

		// Basic client-side validation to reduce 400s from API
		if (
			!formData.title ||
			!formData.category ||
			!formData.competition ||
			!formData.year ||
			!formData.university
		) {
			alert(
				"Please fill all required fields (title, category, competition, year, university)."
			);
			return;
		}
		if (!/^\d{4}$/.test(String(formData.year).trim())) {
			alert("Year must be a 4-digit value, e.g. 2024.");
			return;
		}

		setIsUploading(true);
		setUploadProgress(0);

		try {
			const token = await getIdToken(true);
			if (!token) throw new Error("Please login to upload");

			const fd = new FormData();
			// Only send the first file for MVP
			const fileToUpload = uploadedFiles[0].file;
			fd.append("file", fileToUpload);
			fd.append(
				"metadata",
				JSON.stringify({
					title: formData.title,
					competition: formData.competition,
					year: formData.year,
					university: formData.university,
					team: formData.team || undefined,
					description: formData.description,
					category: formData.category,
					topics: formData.topics,
					companies: formData.companies,
				})
			);

			const data = await new Promise<any>((resolve, reject) => {
				const xhr = new XMLHttpRequest();
				xhr.open("POST", "/api/upload");
				xhr.setRequestHeader("Authorization", `Bearer ${token}`);
				xhr.responseType = "json";

				xhr.upload.onloadstart = () => setUploadProgress(0);
				xhr.upload.onprogress = (event) => {
					if (!event) return;
					if (event.lengthComputable && event.total > 0) {
						setUploadProgress(Math.round((event.loaded / event.total) * 100));
					} else if (fileToUpload.size > 0) {
						const estimated = Math.round(
							(event.loaded / fileToUpload.size) * 100
						);
						setUploadProgress(Math.min(99, Math.max(0, estimated)));
					}
				};

				xhr.onload = () => {
					const status = xhr.status;
					const response =
						typeof xhr.response === "object" && xhr.response !== null
							? xhr.response
							: (() => {
									try {
										return JSON.parse(xhr.responseText || "{}");
									} catch {
										return {};
									}
							  })();

					if (status >= 200 && status < 300) {
						setUploadProgress(100);
						resolve(response);
					} else {
						const error = new Error(
							response?.error || `Upload failed (${status})`
						);
						(error as any).details = response?.details;
						reject(error);
					}
				};

				xhr.onerror = () => {
					reject(new Error("Network error during upload"));
				};

				xhr.onabort = () => {
					reject(new Error("Upload aborted"));
				};

				xhr.send(fd);
			});

			setUploadProgress(100);
			setUploadedFiles([]);
			setFormData({
				title: "",
				competition: "",
				year: "",
				university: "",
				team: "",
				description: "",
				category: "",
				topics: [],
				companies: [],
			});
			router.push(`/document/${data.paperId}`);
		} catch (err: any) {
			console.error("Upload failed:", err);
			let message = err?.message || "Upload failed";
			const fieldErrors = err?.details?.fieldErrors;
			if (fieldErrors && typeof fieldErrors === "object") {
				const lines = Object.entries(fieldErrors).flatMap(([field, arr]: any) =>
					(arr || []).map((m: string) => `${field}: ${m}`)
				);
				if (lines.length) message += "\n" + lines.join("\n");
			}
			alert(message);
		} finally {
			setIsUploading(false);
		}
	};

	const handleNavigation = (path: string) => {
		router.push(path);
	};

	return (
		<div className="min-h-screen bg-background">
			<Navbar />

			<div className="container mx-auto px-4 py-8 max-w-4xl">
				<div className="mb-8">
					<h2 className="text-3xl font-bold text-foreground mb-2">
						Upload Document
					</h2>
					<p className="text-muted-foreground">
						Share your competition-winning document with the community. Help
						others learn from your success.
					</p>
				</div>

				<form
					onSubmit={handleSubmit}
					className="space-y-8"
				>
					{/* File Upload */}
					<Card>
						<CardHeader>
							<CardTitle>Document Files</CardTitle>
							<CardDescription>
								Upload your PDF, Word, or PowerPoint files (max 50MB each)
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div
								{...getRootProps()}
								className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
									isDragActive
										? "border-primary bg-primary/5"
										: "border-border hover:border-primary/50 hover:bg-muted/50"
								}`}
							>
								<input {...getInputProps()} />
								<Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
								{isDragActive ? (
									<p className="text-primary font-medium">
										Drop the files here...
									</p>
								) : (
									<div>
										<p className="text-foreground font-medium mb-2">
											Drag & drop files here, or click to select
										</p>
										<p className="text-sm text-muted-foreground">
											Supports PDF, DOC, DOCX, PPT, PPTX
										</p>
									</div>
								)}
							</div>

							{/* Uploaded Files */}
							{uploadedFiles.length > 0 && (
								<div className="mt-6 space-y-3">
									<h4 className="font-medium text-foreground">
										Uploaded Files
									</h4>
									{uploadedFiles.map((uploadedFile, index) => (
										<div
											key={index}
											className="flex items-center gap-3 p-3 bg-muted rounded-lg"
										>
											<FileText className="h-5 w-5 text-primary" />
											<div className="flex-1">
												<p className="font-medium text-sm">
													{uploadedFile.file.name}
												</p>
												<p className="text-xs text-muted-foreground">
													{(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
												</p>
											</div>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												onClick={() => removeFile(index)}
												className="text-destructive hover:text-destructive"
											>
												<X className="h-4 w-4" />
											</Button>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>

					{/* Document Information */}
					<Card>
						<CardHeader>
							<CardTitle>Document Information</CardTitle>
							<CardDescription>
								Provide details about your document to help others discover it
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="grid md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="title">Document Title *</Label>
									<Input
										id="title"
										placeholder="e.g., Tesla Q3 2024 Equity Analysis"
										value={formData.title}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												title: e.target.value,
											}))
										}
										required
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="category">Category *</Label>
									<Select
										value={formData.category}
										onValueChange={(value) =>
											setFormData((prev) => ({ ...prev, category: value }))
										}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select category" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="business-case">
												Business Case
											</SelectItem>
											<SelectItem value="equity-research">
												Equity Research
											</SelectItem>
											<SelectItem value="accounting">Accounting</SelectItem>
											<SelectItem value="financial-modeling">
												Financial Modeling
											</SelectItem>
											<SelectItem value="strategy">Strategy</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="grid md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="competition">Competition Name *</Label>
									<Input
										id="competition"
										placeholder="e.g., CFA Institute Research Challenge"
										value={formData.competition}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												competition: e.target.value,
											}))
										}
										required
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="year">Year *</Label>
									<Input
										id="year"
										placeholder="e.g., 2024"
										value={formData.year}
										onChange={(e) =>
											setFormData((prev) => ({ ...prev, year: e.target.value }))
										}
										required
									/>
								</div>
							</div>

							<div className="grid md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="university">University/Institution *</Label>
									<Input
										id="university"
										placeholder="e.g., Wharton School"
										value={formData.university}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												university: e.target.value,
											}))
										}
										required
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="team">Team Name (Optional)</Label>
									<Input
										id="team"
										placeholder="e.g., Team Alpha"
										value={formData.team}
										onChange={(e) =>
											setFormData((prev) => ({ ...prev, team: e.target.value }))
										}
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="description">Description</Label>
								<Textarea
									id="description"
									placeholder="Brief description of the document content and key insights..."
									value={formData.description}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											description: e.target.value,
										}))
									}
									rows={4}
								/>
							</div>
						</CardContent>
					</Card>

					{/* Topics and Companies */}
					<Card>
						<CardHeader>
							<CardTitle>Topics & Companies</CardTitle>
							<CardDescription>
								Add relevant topics and companies to improve discoverability
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							{/* Topics */}
							<div className="space-y-3">
								<Label>Topics</Label>
								<div className="flex gap-2">
									<Input
										placeholder="e.g., Financial Modeling, M&A Strategy"
										value={currentTopic}
										onChange={(e) => setCurrentTopic(e.target.value)}
										onKeyPress={(e) =>
											e.key === "Enter" && (e.preventDefault(), addTopic())
										}
									/>
									<Button
										type="button"
										onClick={addTopic}
										size="sm"
									>
										<Plus className="h-4 w-4" />
									</Button>
								</div>
								{formData.topics.length > 0 && (
									<div className="flex flex-wrap gap-2">
										{formData.topics.map((topic) => (
											<Badge
												key={topic}
												variant="secondary"
												className="gap-1"
											>
												{topic}
												<button
													type="button"
													onClick={() => removeTopic(topic)}
													className="hover:text-destructive"
												>
													<X className="h-3 w-3" />
												</button>
											</Badge>
										))}
									</div>
								)}
							</div>

							{/* Companies */}
							<div className="space-y-3">
								<Label>Companies/Equities</Label>
								<div className="flex gap-2">
									<Input
										placeholder="e.g., Tesla, Coca-Cola, Apple"
										value={currentCompany}
										onChange={(e) => setCurrentCompany(e.target.value)}
										onKeyPress={(e) =>
											e.key === "Enter" && (e.preventDefault(), addCompany())
										}
									/>
									<Button
										type="button"
										onClick={addCompany}
										size="sm"
									>
										<Plus className="h-4 w-4" />
									</Button>
								</div>
								{formData.companies.length > 0 && (
									<div className="flex flex-wrap gap-2">
										{formData.companies.map((company) => (
											<Badge
												key={company}
												variant="outline"
												className="gap-1"
											>
												{company}
												<button
													type="button"
													onClick={() => removeCompany(company)}
													className="hover:text-destructive"
												>
													<X className="h-3 w-3" />
												</button>
											</Badge>
										))}
									</div>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Upload Progress */}
					{isUploading && (
						<Card>
							<CardContent className="pt-6">
								<div className="space-y-2">
									<div className="flex justify-between text-sm">
										<span>Uploading document...</span>
										<span>{uploadProgress}%</span>
									</div>
									<Progress
										value={uploadProgress}
										className="w-full"
									/>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Submit Button */}
					<div className="flex justify-end gap-4">
						<Button
							type="button"
							variant="outline"
							disabled={isUploading}
						>
							Save as Draft
						</Button>
						<Button
							type="submit"
							disabled={uploadedFiles.length === 0 || isUploading}
							className="min-w-32"
						>
							{isUploading ? "Uploading..." : "Publish Document"}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}
