"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Loader2, AlertCircle, Zap, Palette, ImageIcon, Globe, Sparkles, Wand2, Calendar, Video, Briefcase, Star, Users, Clock, Rocket, ArrowRight, CheckCircle, Search, Award, Target, Brain } from 'lucide-react'

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export default function Home() {
  // Basic form state
    const router = useRouter();

    const [input, setInput] = useState("")
  const [websiteName, setWebsiteName] = useState("")
  const [selectedIndustry, setSelectedIndustry] = useState("")
  const [selectedStyle, setSelectedStyle] = useState("modern")
  const [aiProvider, setAiProvider] = useState("gemini-rag")
  const [includeImages, setIncludeImages] = useState(true)
  const [targetAudience, setTargetAudience] = useState("")
  const [businessGoals, setBusinessGoals] = useState("")
  const [uniqueSellingPoints, setUniqueSellingPoints] = useState("")

  // UI state
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStage, setGenerationStage] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [activeStep, setActiveStep] = useState(0)



  useEffect(() => {
    setIsVisible(true)
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const websiteTypes = [
    "Modern SaaS platform with user dashboard and pricing tiers",
    "Luxury restaurant with online reservations and menu showcase",
    "Creative photography portfolio with client galleries",
    "Healthcare clinic with appointment booking and services",
    "E-commerce fashion store with product catalog and shopping cart",
    "Real estate agency with property listings and virtual tours",
    "Technology consulting firm with case studies and team profiles",
    "Educational institution with course catalog and events calendar",
  ]

  const industries = [
    { value: "restaurant", label: "Restaurant & Food", icon: "🍽️", features: ["Menu", "Events", "Gallery"], color: "from-orange-500 to-red-500" },
    { value: "technology", label: "Technology & Software", icon: "💻", features: ["Portfolio", "Process", "Team"], color: "from-blue-500 to-cyan-500" },
    { value: "healthcare", label: "Healthcare & Medical", icon: "🏥", features: ["Services", "Process", "Events"], color: "from-green-500 to-emerald-500" },
    { value: "fitness", label: "Fitness & Wellness", icon: "💪", features: ["Classes", "Events", "Video"], color: "from-purple-500 to-pink-500" },
    { value: "beauty", label: "Beauty & Spa", icon: "💄", features: ["Services", "Gallery", "Booking"], color: "from-pink-500 to-rose-500" },
    { value: "legal", label: "Legal & Law Firm", icon: "⚖️", features: ["Process", "Team", "Services"], color: "from-gray-600 to-gray-800" },
    { value: "realestate", label: "Real Estate", icon: "🏠", features: ["Properties", "Gallery", "Team"], color: "from-indigo-500 to-purple-500" },
    { value: "education", label: "Education & Training", icon: "🎓", features: ["Courses", "Events", "Faculty"], color: "from-yellow-500 to-orange-500" },
    { value: "photography", label: "Photography & Creative", icon: "📸", features: ["Portfolio", "Gallery", "Process"], color: "from-violet-500 to-purple-500" },
    { value: "consulting", label: "Business Consulting", icon: "📊", features: ["Process", "Services", "Team"], color: "from-teal-500 to-cyan-500" },
    { value: "ecommerce", label: "E-commerce & Retail", icon: "🛒", features: ["Products", "Cart", "Gallery"], color: "from-emerald-500 to-teal-500" },
    { value: "travel", label: "Travel & Tourism", icon: "✈️", features: ["Gallery", "Events", "Booking"], color: "from-sky-500 to-blue-500" },
    { value: "construction", label: "Construction & Architecture", icon: "🏗️", features: ["Portfolio", "Process", "Team"], color: "from-amber-500 to-orange-500" },
    { value: "automotive", label: "Automotive & Transportation", icon: "🚗", features: ["Services", "Gallery", "Process"], color: "from-red-500 to-pink-500" },
    { value: "fashion", label: "Fashion & Apparel", icon: "👗", features: ["Products", "Gallery", "Events"], color: "from-fuchsia-500 to-pink-500" },
    { value: "finance", label: "Finance & Banking", icon: "💰", features: ["Services", "Process", "Calculator"], color: "from-green-600 to-emerald-600" },
    { value: "nonprofit", label: "Non-profit & Charity", icon: "❤️", features: ["Events", "Team", "Process"], color: "from-red-500 to-rose-500" },
    { value: "events", label: "Event Planning", icon: "🎉", features: ["Events", "Gallery", "Process"], color: "from-purple-500 to-violet-500" },
    { value: "interior", label: "Interior Design", icon: "🏡", features: ["Portfolio", "Gallery", "Process"], color: "from-brown-500 to-amber-500" },
    { value: "marketing", label: "Marketing & Advertising", icon: "📢", features: ["Portfolio", "Services", "Process"], color: "from-orange-500 to-red-500" },
  ]

  const styles = [
    { value: "modern", label: "Modern & Clean", description: "Sleek, contemporary design with clean lines", preview: "🎨" },
    { value: "professional", label: "Professional & Corporate", description: "Business-focused with trust-building elements", preview: "💼" },
    { value: "creative", label: "Creative & Artistic", description: "Bold, expressive design with unique layouts", preview: "🎭" },
    { value: "minimal", label: "Minimal & Simple", description: "Clean, uncluttered design focusing on content", preview: "⚪" },
    { value: "luxury", label: "Luxury & Elegant", description: "Premium feel with sophisticated styling", preview: "💎" },
    { value: "playful", label: "Playful & Fun", description: "Vibrant colors and engaging interactions", preview: "🎈" },
    { value: "dark", label: "Dark & Sophisticated", description: "Dark theme with premium aesthetics", preview: "🌙" },
    { value: "vintage", label: "Vintage & Classic", description: "Timeless design with classic elements", preview: "📜" },
  ]

  const selectedIndustryData = industries.find((ind) => ind.value === selectedIndustry)

    function handlePresetClick(preset: string) {
    setInput(preset)
  }
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setError(null);
  setSuccess(null);

  if (!input.trim() || !websiteName.trim() || !selectedIndustry || !selectedStyle) {
    setError("Please fill in all required fields (Business Name, Industry, and Design Style)");
    return;
  }

  setIsGenerating(true);
  setGenerationStage("Sending your data to the AI backend...");

  try {
    const res = await fetch(`${API_URL}/api/generate-website`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        business_name: websiteName,
        description: input,
        industry: selectedIndustry,
        style: selectedStyle,
        images: includeImages,
        target_audience: targetAudience || undefined,
        business_goals: businessGoals || undefined,
        unique_selling_points: uniqueSellingPoints || undefined,
      }),
    });

    let data: any = null;
    try { data = await res.json(); } catch { /* swallow */ }

    if (!res.ok || !data?.success) {
      throw new Error(data?.error || `Generation failed (${res.status})`);
    }

    // Save for preview page and navigate
    localStorage.setItem("generatedWebsite", JSON.stringify(data));
    router.push("/preview");
  } catch (err: any) {
    console.error(err);
    setError(err?.message || "Something went wrong contacting the backend.");
  } finally {
    setIsGenerating(false);
    setGenerationStage("");
  }
}
  return (
    <div className="flex min-h-screen flex-col bg-black overflow-hidden">
      {/* Simple inline navbar to avoid external component deps */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-black/60 backdrop-blur-lg">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-gradient-to-br from-purple-500 to-indigo-500" />
            <span className="text-white font-semibold">WebGenAI</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-300">
            <a href="#" className="hover:text-white">Backend</a>
            <a href="#" className="hover:text-white">Features</a>
            <a href="#" className="hover:text-white">Examples</a>
            <a href="#" className="hover:text-white">AI Tools</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="text-white/80 hover:text-white">Log in</Button>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white">Sign up</Button>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-16">
        {/* Hero */}
        <section className="relative w-full py-24 md:py-32 overflow-hidden">
          {/* Background blobs */}
          <div className="absolute inset-0 w-full h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-indigo-900/20" />
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-purple-600/20 blur-[120px] transition-all duration-[3000ms] ${isVisible ? "scale-100 opacity-100" : "scale-50 opacity-0"}`} />
            <div className={`absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-indigo-600/15 blur-[100px] transition-all duration-[2000ms] delay-500 ${isVisible ? "scale-100 opacity-100" : "scale-50 opacity-0"}`} />
            <div className={`absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-pink-600/10 blur-[110px] transition-all duration-[2500ms] delay-1000 ${isVisible ? "scale-100 opacity-100" : "scale-50 opacity-0"}`} />
          </div>

          <div className="container relative z-10 mx-auto px-4 text-center">
            <div className={`flex items-center justify-center mb-8 transition-all duration-1000 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>
              <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 backdrop-blur-sm p-3 rounded-2xl border border-purple-500/20">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Sparkles className="h-7 w-7 text-purple-300 animate-pulse" />
                    <div className="absolute inset-0 h-7 w-7 bg-purple-400/20 rounded-full animate-ping" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">AI Website Generator</h2>
                </div>
              </div>
            </div>

            <div className={`flex flex-wrap items-center justify-center gap-3 mb-8 transition-all duration-1000 delay-200 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>
              <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0 px-4 py-2 text-sm font-medium"><Star className="h-4 w-4 mr-2" />20+ Industries</Badge>
              <Badge className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-0 px-4 py-2 text-sm font-medium"><ImageIcon className="h-4 w-4 mr-2" />Real Images</Badge>
              <Badge className="bg-gradient-to-r from-purple-600 to-violet-600 text-white border-0 px-4 py-2 text-sm font-medium"><Zap className="h-4 w-4 mr-2" />AI-Powered</Badge>
              <Badge className="bg-gradient-to-r from-orange-600 to-red-600 text-white border-0 px-4 py-2 text-sm font-medium"><Clock className="h-4 w-4 mr-2" />60 Seconds</Badge>
            </div>

            <h1 className={`text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-8 max-w-5xl mx-auto leading-tight transition-all duration-1000 delay-300 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>
              Create <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent animate-pulse">Professional Websites</span> with AI in Minutes
            </h1>

            <p className={`text-lg md:text-xl text-purple-100 mb-12 max-w-4xl mx-auto leading-relaxed transition-all duration-1000 delay-500 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>
              Generate complete, professional websites using advanced AI. Choose from 20+ industries with real images, comprehensive content, interactive features, and modern design. No coding required.
            </p>

            {/* Feature strip */}
            <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-16 transition-all duration-1000 delay-700 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>
              {[
                { icon: Globe, text: "20+ Industries", color: "text-blue-400" },
                { icon: Zap, text: "AI Content", color: "text-yellow-400" },
                { icon: Wand2, text: "Real Images", color: "text-purple-400" },
                { icon: Briefcase, text: "Portfolios", color: "text-green-400" },
                { icon: Calendar, text: "Events", color: "text-orange-400" },
                { icon: Video, text: "Videos", color: "text-pink-400" },
              ].map((feature, i) => (
                <div key={i} className="flex flex-col items-center space-y-2 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105">
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  <span className="text-sm text-white font-medium">{feature.text}</span>
                </div>
              ))}
            </div>

            {error && (
              <Alert variant="destructive" className="mb-8 max-w-2xl mx-auto bg-red-900/50 border-red-800 text-white">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="mb-8 max-w-2xl mx-auto bg-emerald-900/40 border-emerald-800 text-emerald-100">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {/* Form */}
            <div className={`max-w-6xl mx-auto transition-all duration-1000 delay-900 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>
              <form onSubmit={handleSubmit} className="space-y-8 text-left bg-gradient-to-br from-black/60 via-purple-900/20 to-black/60 backdrop-blur-xl p-10 rounded-3xl border border-purple-500/20 shadow-2xl">
                <div className="grid gap-8 md:grid-cols-2">
                  <div className="space-y-3">
                    <Label htmlFor="website-name" className="text-white text-base font-semibold flex items-center">
                      <Briefcase className="h-4 w-4 mr-2 text-purple-400" />
                      Business Name *
                    </Label>
                    <Input
                      id="website-name"
                      value={websiteName}
                      onChange={(e) => setWebsiteName(e.target.value)}
                      placeholder="e.g., Bella's Italian Restaurant"
                      className="bg-black/40 border-purple-500/30 text-white placeholder:text-purple-300 h-14 text-lg rounded-xl focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                      required
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="industry" className="text-white text-base font-semibold flex items-center">
                      <Target className="h-4 w-4 mr-2 text-purple-400" />
                      Industry *
                    </Label>
                    <Select value={selectedIndustry} onValueChange={setSelectedIndustry} required>
                      <SelectTrigger className="bg-black/40 border-purple-500/30 text-white h-14 text-lg rounded-xl focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20">
                        <SelectValue placeholder="Select your industry" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-purple-500/30 max-h-80 rounded-xl">
                        {industries.map((industry) => (
                          <SelectItem key={industry.value} value={industry.value} className="text-white hover:bg-purple-800/50 rounded-lg m-1 p-3">
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center space-x-3">
                                <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${industry.color} flex items-center justify-center text-white text-sm`}>
                                  {industry.icon}
                                </div>
                                <span className="font-medium">{industry.label}</span>
                              </div>
                              <div className="flex space-x-1 ml-4">
                                {industry.features.slice(0, 2).map((feature, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs bg-purple-800/50 text-purple-200 border-0">
                                    {feature}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedIndustryData && (
                      <div className="mt-3 p-3 bg-purple-900/20 rounded-lg border border-purple-500/20">
                        <div className="flex flex-wrap gap-2">
                          <span className="text-sm text-purple-300 font-medium">Includes:</span>
                          {selectedIndustryData.features.map((feature, idx) => (
                            <Badge key={idx} className="bg-purple-800/30 text-purple-200 border-0 hover:bg-purple-700/40">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid gap-8 md:grid-cols-2">
                  <div className="space-y-3">
                    <Label htmlFor="style" className="text-white text-base font-semibold flex items-center">
                      <Palette className="h-4 w-4 mr-2 text-purple-400" />
                      Design Style *
                    </Label>
                    <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                      <SelectTrigger className="bg-black/40 border-purple-500/30 text-white h-14 text-lg rounded-xl focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-purple-500/30 rounded-xl">
                        {styles.map((style) => (
                          <SelectItem key={style.value} value={style.value} className="text-white hover:bg-purple-800/50 rounded-lg m-1 p-3">
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl">{style.preview}</span>
                              <div>
                                <div className="font-semibold">{style.label}</div>
                                <div className="text-sm text-gray-400">{style.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="ai-provider" className="text-white text-base font-semibold flex items-center">
                      <Sparkles className="h-4 w-4 mr-2 text-purple-400" />
                      AI Model
                    </Label>
                    <Select value={aiProvider} onValueChange={setAiProvider}>
                      <SelectTrigger className="bg-black/40 border-purple-500/30 text-white h-14 text-lg rounded-xl focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-purple-500/30 rounded-xl">
                        <SelectItem value="gemini-rag" className="text-white hover:bg-purple-800/50 rounded-lg m-1 p-3">
                          <div className="flex items-center space-x-2">
                            <Sparkles className="h-4 w-4 text-emerald-400" />
                            <span>Gemini RAG (Recommended)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="enhanced" className="text-white hover:bg-purple-800/50 rounded-lg m-1 p-3">
                          <div className="flex items-center space-x-2">
                            <Award className="h-4 w-4 text-yellow-400" />
                            <span>Enhanced Template</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="openai" className="text-white hover:bg-purple-800/50 rounded-lg m-1 p-3">
                          <div className="flex items-center space-x-2">
                            <Search className="h-4 w-4 text-blue-400" />
                            <span>OpenAI GPT-4</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="description" className="text-white text-base font-semibold flex items-center">
                    <Wand2 className="h-4 w-4 mr-2 text-purple-400" />
                    Business Description *
                  </Label>
                  <Textarea
                    id="description"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Describe your business, services, and what makes you special..."
                    className="w-full min-h-[140px] bg-black/40 border-purple-500/30 text-white placeholder:text-purple-300 resize-none text-lg rounded-xl focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                    required
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-3">
                    <Label htmlFor="target-audience" className="text-white text-sm font-medium flex items-center">
                      <Users className="h-4 w-4 mr-2 text-purple-400" />
                      Target Audience
                    </Label>
                    <Input
                      id="target-audience"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      placeholder="e.g., Young professionals, families"
                      className="bg-black/40 border-purple-500/30 text-white placeholder:text-purple-300 h-12 rounded-xl focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="business-goals" className="text-white text-sm font-medium flex items-center">
                      <Target className="h-4 w-4 mr-2 text-purple-400" />
                      Business Goals
                    </Label>
                    <Input
                      id="business-goals"
                      value={businessGoals}
                      onChange={(e) => setBusinessGoals(e.target.value)}
                      placeholder="e.g., increase sales, build brand"
                      className="bg-black/40 border-purple-500/30 text-white placeholder:text-purple-300 h-12 rounded-xl focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="unique-selling-points" className="text-white text-sm font-medium flex items-center">
                      <Star className="h-4 w-4 mr-2 text-purple-400" />
                      Unique Selling Points
                    </Label>
                    <Input
                      id="unique-selling-points"
                      value={uniqueSellingPoints}
                      onChange={(e) => setUniqueSellingPoints(e.target.value)}
                      placeholder="e.g., 24/7 support, organic ingredients"
                      className="bg-black/40 border-purple-500/30 text-white placeholder:text-purple-300 h-12 rounded-xl focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 rounded-2xl border border-purple-500/20 backdrop-blur-sm">
                  <div className="space-y-2">
                    <Label htmlFor="include-images" className="text-white text-lg font-semibold flex items-center">
                      <ImageIcon className="h-5 w-5 mr-3 text-purple-400" />
                      Generate Professional Images
                    </Label>
                    <p className="text-sm text-purple-300 ml-8">Use real photos instead of placeholders</p>
                  </div>
                  <Switch id="include-images" checked={includeImages} onCheckedChange={setIncludeImages} className="scale-125" />
                </div>

                <Button
                  type="submit"
                  disabled={isGenerating || !input.trim() || !websiteName.trim() || !selectedIndustry}
                  className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-700 hover:via-pink-700 hover:to-indigo-700 text-white py-8 text-xl font-bold rounded-2xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                      Generating Your Website...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-3 h-6 w-6" />
                      Generate Professional Website
                      <ArrowRight className="ml-3 h-6 w-6" />
                    </>
                  )}
                </Button>
              </form>

              {/* Quick starts */}
              <div className="mt-12">
                <p className="text-purple-300 text-center mb-6 text-lg">Or try one of these popular options:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {websiteTypes.slice(0, 4).map((type, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="bg-gradient-to-br from-purple-800/50 to-indigo-800/50 text-white border-purple-700/30 hover:from-purple-700/60 hover:to-indigo-700/60 hover:border-purple-500 rounded-2xl p-6 h-auto text-left transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20"
                      onClick={() => handlePresetClick(type)}
                      disabled={isGenerating}
                    >
                      <div className="space-y-2">
                        <div className="text-sm font-semibold">{type.split(" with")[0]}</div>
                        <div className="text-xs text-purple-300">{type.split(" with")[1] ? "with " + type.split(" with")[1] : ""}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="mt-8 text-center">
                <p className="text-sm text-purple-300">{"🚀 Start for free. No credit card required. Local demo with no API calls."}</p>
              </div>
            </div>
          </div>

          {/* Floating dots */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[
              { left: "10%", top: "20%", delay: "0s", duration: "3s" },
              { left: "80%", top: "10%", delay: "1s", duration: "4s" },
              { left: "20%", top: "80%", delay: "2s", duration: "3.5s" },
              { left: "70%", top: "70%", delay: "0.5s", duration: "2.5s" },
              { left: "50%", top: "30%", delay: "1.5s", duration: "4.5s" },
              { left: "30%", top: "60%", delay: "2.5s", duration: "3s" },
              { left: "90%", top: "40%", delay: "0.8s", duration: "3.8s" },
              { left: "15%", top: "50%", delay: "1.8s", duration: "2.8s" },
              { left: "60%", top: "15%", delay: "2.2s", duration: "4.2s" },
              { left: "40%", top: "85%", delay: "0.3s", duration: "3.3s" },
            ].map((dot, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-purple-400/20 rounded-full animate-pulse"
                style={{ left: dot.left, top: dot.top, animationDelay: dot.delay as React.CSSProperties["animationDelay"], animationDuration: dot.duration as React.CSSProperties["animationDuration"] }}
              />
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="py-24 bg-gradient-to-br from-gray-900 via-black to-gray-900">
          <div className="container mx-auto px-4">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">AI-Powered Website Creation</h2>
              <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
                Our advanced AI creates professional websites with custom content, layouts, interactive features, and even generates images tailored to your business.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3 mt-8 mb-16">
              {[
                { text: "20+ Industries", color: "from-green-600 to-emerald-600" },
                { text: "Real Images", color: "from-blue-600 to-cyan-600" },
                { text: "Enhanced RAG", color: "from-purple-600 to-violet-600" },
                { text: "Interactive Features", color: "from-orange-600 to-red-600" },
                { text: "Booking Systems", color: "from-pink-600 to-rose-600" },
                { text: "Portfolio Sections", color: "from-cyan-600 to-blue-600" },
                { text: "Events Calendar", color: "from-yellow-600 to-orange-600" },
                { text: "Video Showcases", color: "from-red-600 to-pink-600" },
              ].map((badge, index) => (
                <Badge key={index} className={`bg-gradient-to-r ${badge.color} text-white border-0 px-4 py-2 text-sm font-medium cursor-default`}>
                  {badge.text}
                </Badge>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: Sparkles, title: "Enhanced AI with RAG", description: "Advanced business analysis and industry-specific content generation." , color: "from-purple-500 to-violet-500" },
                { icon: ImageIcon, title: "Real Professional Images", description: "Automatically suggest relevant images for your website content." , color: "from-blue-500 to-cyan-500" },
                { icon: Search, title: "Interactive Components", description: "Search, filtering, booking systems, and more." , color: "from-green-500 to-emerald-500" },
                { icon: Palette, title: "Professional Design System", description: "Industry-specific color palettes, typography, and spacing." , color: "from-pink-500 to-rose-500" },
                { icon: Briefcase, title: "Portfolio & Process", description: "Showcase your work with interactive portfolios and timelines." , color: "from-orange-500 to-red-500" },
                { icon: Calendar, title: "Events & Booking", description: "Calendar and booking-ready layouts." , color: "from-indigo-500 to-purple-500" },
                { icon: Video, title: "Video Showcases", description: "Professional media galleries for engaging content." , color: "from-yellow-500 to-orange-500" },
                { icon: Globe, title: "Industry Templates", description: "Specialized sections for many industries." , color: "from-teal-500 to-cyan-500" },
              ].map((feature, i) => (
                <FeatureCard
                  key={i}
                  icon={<feature.icon className={`h-10 w-10 bg-gradient-to-r ${feature.color} bg-clip-text text-transparent`} />}
                  title={feature.title}
                  description={feature.description}
                  gradient={feature.color}
                />
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-24 bg-black relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">How It Works</h2>
              <p className="text-xl text-gray-300 max-w-4xl mx-auto">Four simple steps to create your professional website with AI</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { number: "01", title: "Describe Your Vision", description: "Tell us about your business, goals, and audience.", icon: Wand2, color: "from-purple-500 to-violet-500" },
                { number: "02", title: "AI Analyzes & Plans", description: "We propose a structure and the right sections.", icon: Search, color: "from-blue-500 to-cyan-500" },
                { number: "03", title: "Generate Content & Images", description: "Create professional copy and select matching visuals.", icon: Sparkles, color: "from-green-500 to-emerald-500" },
                { number: "04", title: "Review & Deploy", description: "Preview, tweak, and ship in minutes.", icon: Rocket, color: "from-orange-500 to-red-500" },
              ].map((step, i) => (
                <StepCard
                  key={i}
                  number={step.number}
                  title={step.title}
                  description={step.description}
                  icon={step.icon}
                  gradient={step.color}
                  isActive={activeStep === i}
                />
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-900 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-purple-600/20 to-indigo-600/20" />
            <div className="absolute inset-0 pointer-events-none">
              {[
                { left: "5%", top: "10%", delay: "0s" },
                { left: "15%", top: "30%", delay: "1s" },
                { left: "25%", top: "60%", delay: "2s" },
                { left: "35%", top: "20%", delay: "0.5s" },
                { left: "45%", top: "80%", delay: "1.5s" },
                { left: "55%", top: "40%", delay: "2.5s" },
                { left: "65%", top: "70%", delay: "0.8s" },
                { left: "75%", top: "25%", delay: "1.8s" },
                { left: "85%", top: "55%", delay: "2.2s" },
                { left: "95%", top: "35%", delay: "0.3s" },
              ].map((dot, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
                  style={{ left: dot.left, top: dot.top, animationDelay: dot.delay as React.CSSProperties["animationDelay"], animationDuration: "3s" }}
                />
              ))}
            </div>
          </div>
          <div className="container mx-auto px-4 text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">Ready to Create Your Website?</h2>
            <p className="text-xl text-purple-200 max-w-4xl mx-auto mb-12 leading-relaxed">
              Join thousands of businesses using AI to create stunning websites with advanced features in minutes.
            </p>
            <Button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="bg-white text-purple-900 hover:bg-gray-100 text-xl px-12 py-6 rounded-2xl font-bold shadow-2xl hover:shadow-white/25 transition-all duration-300 hover:scale-105"
            >
              <Rocket className="mr-3 h-6 w-6" />
              Start Building Now
              <ArrowRight className="ml-3 h-6 w-6" />
            </Button>
          </div>
        </section>
      </main>

      {/* Simple inline footer to avoid external component deps */}
      <footer className="border-t border-white/10 bg-black/70">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-6 text-sm text-gray-400">
          <p>© {new Date().getFullYear()} WebGenAI. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white">Terms</a>
            <a href="#" className="hover:text-white">Privacy</a>
          </div>
        </div>
      </footer>

      {/* Generating overlay (purely local simulation) */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4">
          <Card className="w-full max-w-md bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 relative">
                <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                <Brain className="w-8 h-8 text-purple-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <CardTitle className="text-white">Generating Your Website</CardTitle>
              <p className="text-gray-400 text-sm">
                Creating a comprehensive {selectedIndustry || "site"} for {websiteName || "your business"}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">{generationStage}</span>
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-1000"
                    style={{
                      width: generationStage.includes("Initializing")
                        ? "20%"
                        : generationStage.includes("Analyzing")
                        ? "40%"
                        : generationStage.includes("Preparing")
                        ? "70%"
                        : generationStage.includes("Finalizing")
                        ? "95%"
                        : "15%",
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
  gradient,
}: {
  icon: React.ReactNode
  title: string
  description: string
  gradient: string
}) {
  return (
    <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/10 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="mb-4 p-3 rounded-2xl bg-gradient-to-r from-purple-900/30 to-indigo-900/30 w-fit">{icon}</div>
        <CardTitle className="text-white text-xl font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-300 leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  )
}

function StepCard({
  number,
  title,
  description,
  icon: Icon,
  gradient,
  isActive,
}: {
  number: string
  title: string
  description: string
  icon: any
  gradient: string
  isActive: boolean
}) {
  return (
    <div
      className={`relative p-8 rounded-3xl bg-gradient-to-br from-gray-900/50 to-gray-800/50 border transition-all duration-500 hover:scale-105 ${
        isActive
          ? "border-purple-500 shadow-xl shadow-purple-500/20 bg-gradient-to-br from-purple-900/20 to-indigo-900/20"
          : "border-gray-800 hover:border-purple-500/50"
      }`}
    >
      <div
        className={`absolute -top-6 -left-6 w-16 h-16 rounded-2xl bg-gradient-to-r ${gradient} flex items-center justify-center text-white font-bold text-xl shadow-xl transition-all duration-500 ${
          isActive ? "scale-110" : ""
        }`}
      >
        {number}
      </div>
      <div className={`mb-4 p-3 rounded-xl bg-gradient-to-r ${gradient} bg-opacity-20 w-fit transition-all duration-500 ${isActive ? "scale-110" : ""}`}>
        <Icon className={`h-6 w-6 bg-gradient-to-r ${gradient} bg-clip-text text-transparent`} />
      </div>
      <h3 className="text-white text-xl font-bold mt-6 mb-4">{title}</h3>
      <p className="text-gray-300 leading-relaxed">{description}</p>
    </div>
  )
}
