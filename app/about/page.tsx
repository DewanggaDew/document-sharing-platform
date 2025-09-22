import { Users, Target, Award, BookOpen, TrendingUp, Globe } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/navbar"

const stats = [
  { label: "Documents Shared", value: "50K+", icon: BookOpen },
  { label: "Active Users", value: "12K+", icon: Users },
  { label: "Universities", value: "200+", icon: Globe },
  { label: "Success Rate", value: "94%", icon: TrendingUp },
]

const features = [
  {
    title: "Curated Excellence",
    description: "Every document is reviewed and verified by competition winners and industry experts.",
    icon: Award,
  },
  {
    title: "Community Driven",
    description: "Built by students, for students. Share your winning strategies and learn from others.",
    icon: Users,
  },
  {
    title: "Competition Focus",
    description: "Specialized content for business case competitions, equity research, and consulting challenges.",
    icon: Target,
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-pattern-grid">
      <Navbar />

      {/* Hero Section */}
      <div className="bg-white/90 backdrop-blur-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-6">Empowering Competition Success</h1>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            We're building the world's largest repository of competition-winning documents, frameworks, and strategies
            to help students and professionals excel in business competitions.
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon
            return (
              <Card
                key={index}
                className="glass-card text-center transition-all duration-200 hover:shadow-sm hover:bg-muted/30"
              >
                <CardContent className="pt-6">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-primary/5 rounded-full">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-foreground mb-2">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Mission Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-6">Our Mission</h2>
          <div className="max-w-3xl mx-auto">
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              Competition success shouldn't depend on access to exclusive networks or expensive resources. We
              democratize access to winning strategies, frameworks, and insights that have helped thousands of students
              excel in business competitions worldwide.
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => {
            const IconComponent = feature.icon
            return (
              <Card key={index} className="glass-card transition-all duration-200 hover:shadow-sm hover:bg-muted/30">
                <CardHeader>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-2 bg-primary/5 rounded-lg">
                      <IconComponent className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </div>
                  <CardDescription className="text-base leading-relaxed">{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            )
          })}
        </div>

        {/* Story Section */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-2xl text-center mb-6">Our Story</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Founded by competition winners from Harvard Business School and Wharton, our platform emerged from a
                  simple frustration: the best competition resources were scattered, inaccessible, or locked behind
                  paywalls.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  After winning multiple case competitions and seeing talented peers struggle without access to quality
                  materials, we decided to build something different. A platform where excellence is shared, not
                  hoarded.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Today, we're proud to serve students from over 200 universities worldwide, helping them access the
                  same caliber of resources that were once available only to a privileged few.
                </p>
              </div>
              <div className="bg-muted/30 rounded-lg p-8 text-center">
                <div className="text-4xl font-bold text-primary mb-2">2019</div>
                <div className="text-muted-foreground mb-4">Founded</div>
                <div className="flex justify-center gap-4 text-sm text-muted-foreground">
                  <Badge variant="outline">Harvard</Badge>
                  <Badge variant="outline">Wharton</Badge>
                  <Badge variant="outline">Competition Winners</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
