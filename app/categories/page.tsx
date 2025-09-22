import {
	Search,
	Filter,
	Grid,
	List,
	BookOpen,
	TrendingUp,
	Users,
	Award,
	Building,
	Calculator,
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

const categories = [
	{
		id: "business-cases",
		title: "Business Cases",
		description:
			"Strategic analysis and case study solutions from top competitions",
		icon: Building,
		count: 1247,
		trending: true,
		color: "bg-blue-50 text-blue-700 border-blue-200",
	},
	{
		id: "equity-research",
		title: "Equity Research",
		description: "Investment analysis reports and financial modeling templates",
		icon: TrendingUp,
		count: 892,
		trending: true,
		color: "bg-green-50 text-green-700 border-green-200",
	},
	{
		id: "accounting",
		title: "Accounting & Finance",
		description:
			"Financial statements, auditing guides, and accounting principles",
		icon: Calculator,
		count: 634,
		trending: false,
		color: "bg-purple-50 text-purple-700 border-purple-200",
	},
	{
		id: "consulting",
		title: "Consulting Frameworks",
		description: "McKinsey, BCG, and Bain frameworks and methodologies",
		icon: Users,
		count: 456,
		trending: true,
		color: "bg-orange-50 text-orange-700 border-orange-200",
	},
	{
		id: "competition-winning",
		title: "Competition Winners",
		description: "Award-winning submissions from major business competitions",
		icon: Award,
		count: 289,
		trending: false,
		color: "bg-yellow-50 text-yellow-700 border-yellow-200",
	},
	{
		id: "study-guides",
		title: "Study Guides",
		description: "Comprehensive guides and summaries for business courses",
		icon: BookOpen,
		count: 723,
		trending: false,
		color: "bg-indigo-50 text-indigo-700 border-indigo-200",
	},
];

export default function CategoriesPage() {
	return (
		<div className="min-h-screen bg-pattern-diagonal">
			{/* Navbar */}
			<Navbar />

			{/* Categories Header */}
			<div className="border-b bg-white/80 backdrop-blur-sm">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
					<div className="flex flex-col gap-4">
						<div>
							<h1 className="text-3xl font-bold text-foreground">
								Browse Categories
							</h1>
							<p className="text-muted-foreground mt-2">
								Discover documents organized by subject and competition type
							</p>
						</div>

						{/* Search and Filters */}
						<div className="flex flex-col sm:flex-row gap-4">
							<div className="relative flex-1">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
								<Input
									placeholder="Search categories..."
									className="pl-10 bg-white border-border/50"
								/>
							</div>
							<div className="flex gap-2">
								<Button
									variant="outline"
									size="sm"
									className="bg-white/80"
								>
									<Filter className="h-4 w-4 mr-2" />
									Filter
								</Button>
								<Button
									variant="outline"
									size="sm"
									className="bg-white/80"
								>
									<Grid className="h-4 w-4" />
								</Button>
								<Button
									variant="outline"
									size="sm"
									className="bg-white/80"
								>
									<List className="h-4 w-4" />
								</Button>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Categories Grid */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{categories.map((category) => {
						const IconComponent = category.icon;
						return (
							<Card
								key={category.id}
								className="glass-card transition-all duration-200 hover:shadow-sm hover:bg-muted/30 cursor-pointer group"
							>
								<CardHeader className="pb-4">
									<div className="flex items-start justify-between">
										<div
											className={`p-3 rounded-lg ${category.color} transition-transform duration-200`}
										>
											<IconComponent className="h-6 w-6" />
										</div>
										<div className="flex items-center gap-2">
											{category.trending && (
												<Badge
													variant="secondary"
													className="text-xs bg-green-100 text-green-700 border-green-200"
												>
													Trending
												</Badge>
											)}
											<span className="text-sm text-muted-foreground font-medium">
												{Number(category.count).toLocaleString("en-US")}
											</span>
										</div>
									</div>
									<CardTitle className="text-xl group-hover:text-primary transition-colors">
										{category.title}
									</CardTitle>
									<CardDescription className="text-sm leading-relaxed">
										{category.description}
									</CardDescription>
								</CardHeader>
								<CardContent className="pt-0">
									<Button
										variant="ghost"
										className="w-full justify-start p-0 h-auto text-sm text-muted-foreground hover:text-primary"
									>
										Browse {category.title.toLowerCase()} →
									</Button>
								</CardContent>
							</Card>
						);
					})}
				</div>
			</div>
		</div>
	);
}
