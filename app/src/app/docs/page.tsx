"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Book, 
  ChevronRight, 
  Zap, 
  Shield, 
  TrendingUp, 
  Users, 
  Coins, 
  ArrowRightLeft,
  Target,
  Clock,
  AlertTriangle,
  CheckCircle,
  Info,
  ExternalLink,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Flame,
  Diamond,
  Wallet,
  BarChart3,
  Lock,
  Rocket,
  Settings,
  HelpCircle,
  Star,
  Eye,
  Share2,
  Bell,
  Award,
  Trophy,
  Gift,
  Percent,
  Globe,
  Terminal,
  FileText,
  MessageCircle,
  Twitter,
  Github,
  LineChart,
  Smartphone,
  Download,
  Search,
  Filter,
  RefreshCw,
  Hash,
  Layers,
  Database,
  Key,
  UserCheck,
  Activity,
  PieChart,
  DollarSign,
  CircleDollarSign,
  Sparkles,
  Crown,
  Medal,
  BadgeCheck,
  Image,
  Type,
  FileCode,
  Link2,
  MousePointer,
  Maximize2,
  Monitor,
  Cpu,
  Server,
  Code,
  BookOpen,
  Lightbulb,
  AlertCircle,
  ShieldCheck,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Timer,
  History,
  Repeat,
  Shuffle,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Bookmark,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Menu,
  X
} from "lucide-react";

// Sidebar menu structure
const MENU_SECTIONS = [
  {
    title: "GETTING STARTED",
    items: [
      { id: "introduction", label: "Introduction", icon: Book },
      { id: "what-is-phbt", label: "What is PHBT?", icon: HelpCircle },
      { id: "why-phbt", label: "Why PHBT Exists", icon: Lightbulb },
      { id: "quick-start", label: "Quick Start Guide", icon: Zap },
      { id: "how-it-works", label: "How It Works", icon: Settings },
      { id: "connect-wallet", label: "Connect Wallet", icon: Wallet },
      { id: "supported-wallets", label: "Supported Wallets", icon: Key },
      { id: "network", label: "Network & RPC", icon: Globe },
    ]
  },
  {
    title: "USER INTERFACE",
    items: [
      { id: "ui-overview", label: "UI Overview", icon: Monitor },
      { id: "header-nav", label: "Header & Navigation", icon: LayoutGrid },
      { id: "token-ticker", label: "Token Ticker Banner", icon: Activity },
      { id: "home-page", label: "Home Page", icon: Book },
      { id: "token-page", label: "Token Detail Page", icon: FileText },
      { id: "mobile-ui", label: "Mobile Experience", icon: Smartphone },
      { id: "pwa-install", label: "PWA Installation", icon: Download },
    ]
  },
  {
    title: "EXPLORE & DISCOVER",
    items: [
      { id: "explore", label: "Explore Tokens", icon: Eye },
      { id: "search-tokens", label: "Search Tokens", icon: Search },
      { id: "filter-sort", label: "Filter & Sort", icon: Filter },
      { id: "categories", label: "Token Categories", icon: Layers },
      { id: "watchlist", label: "Watchlist", icon: Star },
      { id: "token-cards", label: "Token Cards", icon: LayoutGrid },
    ]
  },
  {
    title: "CREATE & LAUNCH",
    items: [
      { id: "launch-coin", label: "Launch Coin", icon: Rocket },
      { id: "token-details", label: "Token Details", icon: FileCode },
      { id: "token-image", label: "Token Image", icon: Image },
      { id: "token-metadata", label: "Token Metadata", icon: Database },
      { id: "creation-fees", label: "Creation Fees", icon: CircleDollarSign },
      { id: "authority-revocation", label: "Authority Revocation", icon: Lock },
    ]
  },
  {
    title: "TRADING",
    items: [
      { id: "trading", label: "Trading Overview", icon: ArrowRightLeft },
      { id: "buying", label: "Buying Tokens", icon: ArrowUpRight },
      { id: "selling", label: "Selling Tokens", icon: ArrowDownRight },
      { id: "slippage", label: "Slippage Settings", icon: SlidersHorizontal },
      { id: "position-tracking", label: "Position Tracking", icon: Target },
      { id: "trade-history", label: "Trade History", icon: History },
      { id: "price-charts", label: "Price Charts", icon: LineChart },
    ]
  },
  {
    title: "PAPER HAND TAX",
    items: [
      { id: "tax-overview", label: "Tax Overview", icon: Flame },
      { id: "tax-calculation", label: "Tax Calculation", icon: Percent },
      { id: "cost-basis", label: "Cost Basis Tracking", icon: Target },
      { id: "profit-loss", label: "Profit & Loss", icon: TrendingUp },
      { id: "tax-enforcement", label: "Tax Enforcement", icon: ShieldCheck },
      { id: "external-dex", label: "External DEX Trading", icon: Shuffle },
      { id: "phbi", label: "Paper Hand Index", icon: Trophy },
      { id: "treasury", label: "Treasury", icon: Coins },
      { id: "treasury-usage", label: "Treasury Usage", icon: PieChart },
    ]
  },
  {
    title: "TOKENOMICS",
    items: [
      { id: "tokenomics-overview", label: "Tokenomics Overview", icon: PieChart },
      { id: "bonding-curve", label: "Bonding Curve", icon: TrendingUp },
      { id: "price-discovery", label: "Price Discovery", icon: LineChart },
      { id: "amm-pool", label: "AMM Pool", icon: BarChart3 },
      { id: "migration", label: "Migration", icon: Rocket },
      { id: "graduation", label: "Graduation Threshold", icon: Award },
      { id: "liquidity", label: "Liquidity", icon: Coins },
      { id: "lp-tokens", label: "LP Tokens", icon: Layers },
    ]
  },
  {
    title: "PROFILE & REWARDS",
    items: [
      { id: "profile", label: "Your Profile", icon: Users },
      { id: "profile-stats", label: "Profile Statistics", icon: BarChart3 },
      { id: "wallet-balance", label: "Wallet Balance", icon: Wallet },
      { id: "achievements", label: "Achievements", icon: Award },
      { id: "achievement-categories", label: "Achievement Categories", icon: Medal },
      { id: "secret-achievements", label: "Secret Achievements", icon: Sparkles },
      { id: "leaderboard", label: "Leaderboard", icon: Trophy },
      { id: "scan-wallet", label: "Scan Wallet Activity", icon: RefreshCw },
    ]
  },
  {
    title: "SOCIAL FEATURES",
    items: [
      { id: "share", label: "Share & Social", icon: Share2 },
      { id: "share-twitter", label: "Share on X", icon: Twitter },
      { id: "share-telegram", label: "Share on Telegram", icon: MessageCircle },
      { id: "copy-link", label: "Copy Link", icon: Link2 },
      { id: "notifications", label: "Notifications", icon: Bell },
    ]
  },
  {
    title: "TECHNICAL DETAILS",
    items: [
      { id: "smart-contracts", label: "Smart Contracts", icon: Code },
      { id: "program-accounts", label: "Program Accounts", icon: Database },
      { id: "pda-structure", label: "PDA Structure", icon: Key },
      { id: "transaction-flow", label: "Transaction Flow", icon: Repeat },
      { id: "on-chain-data", label: "On-Chain Data", icon: Server },
    ]
  },
  {
    title: "SECURITY",
    items: [
      { id: "security", label: "Security Overview", icon: Shield },
      { id: "anchor-framework", label: "Anchor Framework", icon: Code },
      { id: "token-safety", label: "Token Safety", icon: Lock },
      { id: "account-validation", label: "Account Validation", icon: BadgeCheck },
      { id: "risks", label: "Risks & Disclaimers", icon: AlertTriangle },
      { id: "scam-protection", label: "Scam Protection", icon: ShieldCheck },
    ]
  },
  {
    title: "RESOURCES",
    items: [
      { id: "faq", label: "FAQ", icon: HelpCircle },
      { id: "glossary", label: "Glossary", icon: FileText },
      { id: "troubleshooting", label: "Troubleshooting", icon: AlertCircle },
      { id: "support", label: "Support", icon: MessageCircle },
      { id: "community", label: "Community", icon: Users },
      { id: "links", label: "Useful Links", icon: Link2 },
    ]
  },
];

// Copyable code block - sleeker design
function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="relative group my-4">
      <div className="absolute inset-0 bg-gradient-to-r from-[#8C3A32]/20 to-transparent rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <pre className="relative bg-[#0A0E10] border border-[#1E2529] rounded-xl p-5 overflow-x-auto text-sm backdrop-blur-sm">
        <code className="text-[#A8B5B2] font-mono leading-relaxed">{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 p-2 bg-[#1A2428]/80 hover:bg-[#252E33] rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm border border-[#2A3338]/50"
      >
        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-[#6B7680]" />}
      </button>
    </div>
  );
}

// Info box - modern glassmorphism style
function InfoBox({ type, title, children }: { type: "info" | "warning" | "success" | "tip"; title: string; children: React.ReactNode }) {
  const styles = {
    info: { 
      bg: "bg-gradient-to-r from-blue-500/5 to-blue-500/10", 
      border: "border-blue-500/20", 
      icon: Info, 
      iconColor: "text-blue-400",
      glow: "shadow-blue-500/5"
    },
    warning: { 
      bg: "bg-gradient-to-r from-amber-500/5 to-amber-500/10", 
      border: "border-amber-500/20", 
      icon: AlertTriangle, 
      iconColor: "text-amber-400",
      glow: "shadow-amber-500/5"
    },
    success: { 
      bg: "bg-gradient-to-r from-emerald-500/5 to-emerald-500/10", 
      border: "border-emerald-500/20", 
      icon: CheckCircle, 
      iconColor: "text-emerald-400",
      glow: "shadow-emerald-500/5"
    },
    tip: { 
      bg: "bg-gradient-to-r from-violet-500/5 to-violet-500/10", 
      border: "border-violet-500/20", 
      icon: Zap, 
      iconColor: "text-violet-400",
      glow: "shadow-violet-500/5"
    },
  };
  
  const style = styles[type];
  const Icon = style.icon;
  
  return (
    <div className={`${style.bg} ${style.border} border rounded-xl p-4 my-5 backdrop-blur-sm shadow-lg ${style.glow} transition-all duration-300 hover:shadow-xl`}>
      <div className="flex items-start gap-3">
        <div className={`p-1.5 rounded-lg ${style.bg}`}>
          <Icon className={`w-4 h-4 ${style.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-[#E9E1D8] text-sm mb-1">{title}</h4>
          <div className="text-[#9FA6A3] text-sm leading-relaxed">{children}</div>
        </div>
      </div>
    </div>
  );
}

// Censored content placeholder - sleeker design
function CensoredContent() {
  return (
    <div className="relative my-5 group">
      <div className="absolute inset-0 bg-gradient-to-r from-[#8C3A32]/10 via-transparent to-[#8C3A32]/10 rounded-xl blur-xl opacity-50" />
      <div className="relative bg-gradient-to-br from-[#12181B] to-[#0D1214] border border-[#1E2529] rounded-xl p-6 backdrop-blur-sm">
        <div className="text-center font-mono">
          <div className="text-[#3A4449] text-sm tracking-widest">
            ●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●<br/>
            ●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●<br/>
            ●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●
          </div>
          <p className="text-[#5F6A6E] text-xs mt-3 font-sans">Technical details coming soon</p>
        </div>
      </div>
    </div>
  );
}

// Collapsible sidebar section
function SidebarSection({ 
  section, 
  activeSection, 
  scrollToSection,
  isExpanded,
  onToggle
}: { 
  section: typeof MENU_SECTIONS[0]; 
  activeSection: string;
  scrollToSection: (id: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const isActive = section.items.some(item => item.id === activeSection);
  
  return (
    <div className="mb-1">
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors rounded-lg ${
          isActive ? 'text-[#E9E1D8] bg-[#1A2428]/50' : 'text-[#5F6A6E] hover:text-[#9FA6A3]'
        }`}
      >
        <span>{section.title}</span>
        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <nav className="mt-1 space-y-0.5 pl-1">
          {section.items.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-200 text-left group ${
                activeSection === item.id
                  ? "bg-gradient-to-r from-[#8C3A32] to-[#A04438] text-white shadow-lg shadow-[#8C3A32]/20"
                  : "text-[#8A9299] hover:text-[#E9E1D8] hover:bg-[#1A2428]/70"
              }`}
            >
              <item.icon className={`w-3.5 h-3.5 transition-transform duration-200 ${activeSection === item.id ? '' : 'group-hover:scale-110'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("introduction");
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    // Start with first few sections expanded
    const initial: Record<string, boolean> = {};
    MENU_SECTIONS.forEach((section, i) => {
      initial[section.title] = i < 3;
    });
    return initial;
  });

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setScrollProgress(progress);

      // Update active section based on scroll position
      const sections = MENU_SECTIONS.flatMap(s => s.items.map(i => i.id));
      for (const id of sections.reverse()) {
        const element = document.getElementById(id);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 150) {
            setActiveSection(id);
            // Auto-expand the section containing active item
            const parentSection = MENU_SECTIONS.find(s => s.items.some(i => i.id === id));
            if (parentSection && !expandedSections[parentSection.title]) {
              setExpandedSections(prev => ({ ...prev, [parentSection.title]: true }));
            }
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [expandedSections]);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const toggleSection = (title: string) => {
    setExpandedSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <div className="min-h-screen bg-[#0B0F12]">
      {/* Scroll Progress Bar */}
      <div className="fixed top-16 left-0 right-0 h-0.5 bg-[#1A2428] z-50">
        <div 
          className="h-full bg-gradient-to-r from-[#8C3A32] via-[#A04438] to-[#8C3A32] transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Sub-header */}
      <div className="sticky top-16 z-40 border-b border-[#1E2529] bg-[#0B0F12]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-[#8C3A32] to-[#6B2D28]">
                <Book className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-[#E9E1D8]">Documentation</span>
              <span className="hidden sm:inline-block text-xs text-[#5F6A6E] bg-[#1A2428] px-2 py-0.5 rounded-full">v1.0</span>
            </div>
            <div className="flex items-center gap-3">
              <a href="https://x.com/PHBTax" target="_blank" rel="noopener noreferrer" className="p-2 text-[#5F6A6E] hover:text-[#E9E1D8] hover:bg-[#1A2428] rounded-lg transition-all">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="https://github.com/phbt" target="_blank" rel="noopener noreferrer" className="p-2 text-[#5F6A6E] hover:text-[#E9E1D8] hover:bg-[#1A2428] rounded-lg transition-all">
                <Github className="w-4 h-4" />
              </a>
              {/* Mobile menu button */}
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-[#5F6A6E] hover:text-[#E9E1D8] hover:bg-[#1A2428] rounded-lg transition-all"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-[#0B0F12] border-r border-[#1E2529] overflow-y-auto">
            <div className="p-4 border-b border-[#1E2529] flex items-center justify-between">
              <span className="font-semibold text-[#E9E1D8]">Navigation</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 hover:bg-[#1A2428] rounded-lg">
                <X className="w-5 h-5 text-[#5F6A6E]" />
              </button>
            </div>
            <div className="p-3 space-y-1">
              {MENU_SECTIONS.map((section) => (
                <SidebarSection
                  key={section.title}
                  section={section}
                  activeSection={activeSection}
                  scrollToSection={scrollToSection}
                  isExpanded={expandedSections[section.title] ?? false}
                  onToggle={() => toggleSection(section.title)}
                />
              ))}
            </div>
          </aside>
        </div>
      )}

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 flex-shrink-0 border-r border-[#1E2529]/50 bg-gradient-to-b from-[#090C0E] to-[#0B0F12]">
          <div className="sticky top-32 p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)] scrollbar-thin scrollbar-thumb-[#2A3338] scrollbar-track-transparent">
            {MENU_SECTIONS.map((section) => (
              <SidebarSection
                key={section.title}
                section={section}
                activeSection={activeSection}
                scrollToSection={scrollToSection}
                isExpanded={expandedSections[section.title] ?? false}
                onToggle={() => toggleSection(section.title)}
              />
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 px-5 py-8 sm:px-8 lg:px-12 xl:px-16 max-w-4xl">
          
          {/* GETTING STARTED */}
          <section id="introduction" className="mb-20 scroll-mt-24">
            <div className="mb-8">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8C3A32] bg-[#8C3A32]/10 px-2.5 py-1 rounded-full mb-4">
                <Book className="w-3 h-3" /> Getting Started
              </span>
              <h1 className="text-4xl sm:text-5xl font-bold text-[#E9E1D8] mb-4 tracking-tight">
                Introduction to <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8C3A32] to-[#D4574A]">PHBT</span>
              </h1>
              <p className="text-lg text-[#8A9299] leading-relaxed">
                Welcome to the official documentation for PHBT (Paper Hand Bitch Tax). PHBT is a revolutionary token launchpad built on the Solana blockchain that introduces an innovative mechanism called the Paper Hand Tax.
              </p>
            </div>

            <p className="text-[#9FA6A3] mb-8 leading-relaxed">
              The core concept is simple: when you sell any token at a loss on phbt.fun, 50% of your sale proceeds are automatically sent to the treasury. This creates a powerful incentive to avoid selling during dips and rewards patient holders. The collected taxes are then used to grow the ecosystem through buybacks, liquidity support, and development incentives.
            </p>
            
            <div className="grid md:grid-cols-3 gap-4 mb-10">
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#8C3A32]/20 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-gradient-to-br from-[#12181B] to-[#0D1214] rounded-2xl p-5 border border-[#1E2529] hover:border-[#8C3A32]/30 transition-all duration-300">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8C3A32] to-[#6B2D28] flex items-center justify-center mb-4 shadow-lg shadow-[#8C3A32]/20">
                    <Flame className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-[#E9E1D8] mb-2">Paper Hand Tax</h3>
                  <p className="text-sm text-[#6B7680] leading-relaxed">50% tax on loss sells. The ultimate penalty for weak hands who panic sell.</p>
                </div>
              </div>
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-gradient-to-br from-[#12181B] to-[#0D1214] rounded-2xl p-5 border border-[#1E2529] hover:border-cyan-500/30 transition-all duration-300">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/20">
                    <Diamond className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-[#E9E1D8] mb-2">Diamond Hands</h3>
                  <p className="text-sm text-[#6B7680] leading-relaxed">No tax on profit sells. Strong hands are rewarded for their conviction.</p>
                </div>
              </div>
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-gradient-to-br from-[#12181B] to-[#0D1214] rounded-2xl p-5 border border-[#1E2529] hover:border-amber-500/30 transition-all duration-300">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/20">
                    <Coins className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-[#E9E1D8] mb-2">Treasury</h3>
                  <p className="text-sm text-[#6B7680] leading-relaxed">Tax funds ecosystem growth, buybacks, and liquidity.</p>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-4">Key Features at a Glance</h3>
            <div className="grid sm:grid-cols-2 gap-3 mb-8">
              {[
                "Fair token launches with bonding curves",
                "Automatic migration to AMM pools",
                "On-chain cost basis tracking",
                "Revoked mint and freeze authorities",
                "Real-time price charts",
                "Achievement system and badges",
                "Mobile PWA support",
                "Token watchlist and social sharing"
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 text-[#9FA6A3] bg-[#0F1417] rounded-xl px-4 py-3 border border-[#1E2529]/50">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>

            <InfoBox type="info" title="Important: Tax Enforcement">
              The Paper Hand Tax is enforced on all trades made through phbt.fun. When you trade on external DEXs like Raydium or Jupiter after migration, the tax cannot be enforced because those platforms use their own swap logic.
            </InfoBox>
          </section>

          <section id="what-is-phbt" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">What is PHBT?</h2>
            <p className="text-[#9FA6A3] mb-4">
              PHBT (Paper Hand Bitch Tax) is a decentralized token launchpad and trading platform built on Solana. It allows anyone to create and trade tokens with a unique twist: a 50% tax on all loss-selling transactions.
            </p>
            <p className="text-[#9FA6A3] mb-4">
              The platform consists of several key components working together:
            </p>
            
            <div className="space-y-4 mb-6">
              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-2 flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-[#8C3A32]" /> Token Launchpad
                </h4>
                <p className="text-sm text-[#5F6A6E]">
                  Create new SPL tokens with customizable metadata, images, and categories. Each token launches with a bonding curve for fair price discovery. Creation costs 0.02 SOL and automatically revokes mint/freeze authorities.
                </p>
              </div>
              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-2 flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5 text-blue-400" /> Trading Engine
                </h4>
                <p className="text-sm text-[#5F6A6E]">
                  Buy and sell tokens directly through the platform. The smart contract tracks your cost basis and applies the Paper Hand Tax when selling at a loss. Real-time slippage protection ensures fair execution.
                </p>
              </div>
              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-2 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-400" /> Tax System
                </h4>
                <p className="text-sm text-[#5F6A6E]">
                  The core innovation. When you sell tokens below your average purchase price, 50% of the SOL output goes to the treasury. This punishes panic selling and rewards patient holders.
                </p>
              </div>
              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-2 flex items-center gap-2">
                  <Coins className="w-5 h-5 text-yellow-400" /> Treasury
                </h4>
                <p className="text-sm text-[#5F6A6E]">
                  A program-controlled vault that collects all Paper Hand Tax revenue. These funds are used for token buybacks, liquidity provision, ecosystem incentives, and platform development.
                </p>
              </div>
            </div>
          </section>

          <section id="why-phbt" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Why PHBT Exists</h2>
            <p className="text-[#9FA6A3] mb-4">
              The crypto space is plagued by weak hands who panic sell at the first sign of a dip. This behavior creates cascading sell-offs, hurts long-term holders, and enables market manipulation. PHBT was created to address these problems.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">The Problem</h3>
            <ul className="space-y-2 text-[#9FA6A3] mb-6">
              <li className="flex items-start gap-2">
                <TrendingDown className="w-4 h-4 text-red-400 mt-1 flex-shrink-0" />
                <span><strong className="text-[#E9E1D8]">Panic Selling Cascades:</strong> One person sells at a loss, triggering more sell orders, creating a death spiral.</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400 mt-1 flex-shrink-0" />
                <span><strong className="text-[#E9E1D8]">Weak Hand Culture:</strong> Short-term thinking dominates crypto trading, hurting legitimate projects.</span>
              </li>
              <li className="flex items-start gap-2">
                <TrendingDown className="w-4 h-4 text-red-400 mt-1 flex-shrink-0" />
                <span><strong className="text-[#E9E1D8]">Market Manipulation:</strong> Whales exploit paper hands by triggering panic sells to accumulate at lower prices.</span>
              </li>
            </ul>

            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">The Solution</h3>
            <ul className="space-y-2 text-[#9FA6A3] mb-6">
              <li className="flex items-start gap-2">
                <Diamond className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
                <span><strong className="text-[#E9E1D8]">Financial Incentive to Hold:</strong> The 50% tax makes panic selling extremely costly.</span>
              </li>
              <li className="flex items-start gap-2">
                <Coins className="w-4 h-4 text-yellow-400 mt-1 flex-shrink-0" />
                <span><strong className="text-[#E9E1D8]">Ecosystem Growth:</strong> Collected taxes fund buybacks and development, benefiting holders.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                <span><strong className="text-[#E9E1D8]">Natural Selection:</strong> Paper hands pay the tax, diamond hands reap the rewards.</span>
              </li>
            </ul>

            <InfoBox type="tip" title="Philosophy">
              PHBT is not trying to control every trade everywhere. Instead, it creates a strong incentive to trade on phbt.fun and makes panic selling economically painful. Paper hands feed the trenches.
            </InfoBox>
          </section>

          <section id="quick-start" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Quick Start Guide</h2>
            <p className="text-[#9FA6A3] mb-6">
              Get started with PHBT in just a few minutes. Follow these steps to connect your wallet, explore tokens, and make your first trade.
            </p>
            
            <div className="space-y-6">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 bg-[#8C3A32] rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-lg">1</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[#E9E1D8] text-lg mb-2">Connect Your Wallet</h3>
                  <p className="text-sm text-[#5F6A6E] mb-2">
                    Click the "Connect Wallet" button in the top right corner of the page. A modal will appear showing all supported wallets. Select your preferred wallet (Phantom, Solflare, Backpack, etc.) and approve the connection request in your wallet extension or app.
                  </p>
                  <p className="text-sm text-[#5F6A6E]">
                    Make sure you have some SOL in your wallet for transaction fees and trading. We recommend at least 0.1 SOL to get started.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 bg-[#8C3A32] rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-lg">2</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[#E9E1D8] text-lg mb-2">Explore Tokens</h3>
                  <p className="text-sm text-[#5F6A6E] mb-2">
                    Scroll down on the home page to see all tokens launched on the platform. Use the search bar to find tokens by name, symbol, or contract address. Filter by category (Meme, DeFi, Gaming, etc.) or sort by liquidity, newest, or your watchlist.
                  </p>
                  <p className="text-sm text-[#5F6A6E]">
                    Click on any token card to view its detail page with price chart, trading interface, and token information.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 bg-[#8C3A32] rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-lg">3</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[#E9E1D8] text-lg mb-2">Buy Your First Token</h3>
                  <p className="text-sm text-[#5F6A6E] mb-2">
                    On the token detail page, enter the amount of SOL you want to spend in the trade panel. The interface will show you the estimated tokens you will receive and the current slippage settings. Click "Buy" and confirm the transaction in your wallet.
                  </p>
                  <p className="text-sm text-[#5F6A6E]">
                    Your position will appear below the trade panel, showing your holdings, cost basis, and current profit/loss.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 bg-[#8C3A32] rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-lg">4</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[#E9E1D8] text-lg mb-2">Sell (Carefully!)</h3>
                  <p className="text-sm text-[#5F6A6E] mb-2">
                    When you want to sell, switch to the "Sell" tab. Enter the token amount or use the percentage buttons (25%, 50%, 75%, MAX). The interface will show your expected SOL output and whether the Paper Hand Tax applies.
                  </p>
                  <p className="text-sm text-[#5F6A6E]">
                    <strong className="text-[#8C3A32]">Remember:</strong> If you sell below your cost basis, 50% of the SOL output goes to the treasury!
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 bg-[#8C3A32] rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-lg">5</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[#E9E1D8] text-lg mb-2">Launch Your Own Token (Optional)</h3>
                  <p className="text-sm text-[#5F6A6E] mb-2">
                    Click "Create Coin" in the navigation to launch your own token. Fill in the details (name, symbol, description), upload an image, select a category, and pay the 0.02 SOL creation fee. Your token will be live immediately with a bonding curve.
                  </p>
                </div>
              </div>
            </div>

            <InfoBox type="tip" title="Pro Tip">
              Add tokens to your watchlist by clicking the star icon on token cards. This makes it easy to track your favorite projects and quickly access them from the explore page.
            </InfoBox>
          </section>

          <section id="how-it-works" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">How It Works</h2>
            <p className="text-[#9FA6A3] mb-6">
              PHBT operates through a three-phase lifecycle for each token. Understanding this lifecycle is crucial for trading effectively on the platform.
            </p>
            
            <div className="bg-[#1A2428] rounded-lg p-6 border border-[#2A3338] mb-6">
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div className="border-r border-[#2A3338] pr-6 last:border-0">
                  <div className="w-12 h-12 bg-[#8C3A32]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Rocket className="w-6 h-6 text-[#8C3A32]" />
                  </div>
                  <h4 className="font-semibold text-[#E9E1D8] mb-2">Phase 1: Launch</h4>
                  <p className="text-sm text-[#5F6A6E]">Token is created with bonding curve. Price increases as people buy. Initial liquidity is provided by the curve.</p>
                </div>
                <div className="border-r border-[#2A3338] pr-6 last:border-0">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ArrowRightLeft className="w-6 h-6 text-blue-400" />
                  </div>
                  <h4 className="font-semibold text-[#E9E1D8] mb-2">Phase 2: Trade</h4>
                  <p className="text-sm text-[#5F6A6E]">Users buy and sell on the bonding curve. Paper Hand Tax applies to loss sells. Cost basis tracked per user.</p>
                </div>
                <div>
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Award className="w-6 h-6 text-green-400" />
                  </div>
                  <h4 className="font-semibold text-[#E9E1D8] mb-2">Phase 3: Graduate</h4>
                  <p className="text-sm text-[#5F6A6E]">At graduation threshold, token migrates to AMM pool. Continues trading with full liquidity.</p>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Tax Flow Visualization</h3>
            <p className="text-[#9FA6A3] mb-4">
              When you sell tokens at a loss, here is exactly how your transaction is processed:
            </p>
            <div className="flex items-center gap-2 text-sm flex-wrap mb-6">
              <span className="px-3 py-1.5 rounded-lg bg-[#0E1518] text-[#E9E1D8] border border-[#2A3338]">User Sells at Loss</span>
              <ChevronRight className="w-4 h-4 text-[#5F6A6E]" />
              <span className="px-3 py-1.5 rounded-lg bg-[#8C3A32]/30 text-[#8C3A32] border border-[#8C3A32]/50">50% Tax Deducted</span>
              <ChevronRight className="w-4 h-4 text-[#5F6A6E]" />
              <span className="px-3 py-1.5 rounded-lg bg-yellow-900/30 text-yellow-400 border border-yellow-500/30">Treasury Receives Tax</span>
              <ChevronRight className="w-4 h-4 text-[#5F6A6E]" />
              <span className="px-3 py-1.5 rounded-lg bg-green-900/30 text-green-400 border border-green-500/30">User Gets 50%</span>
            </div>

            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Profit Sell Flow</h3>
            <p className="text-[#9FA6A3] mb-4">
              When you sell at a profit, you keep everything:
            </p>
            <div className="flex items-center gap-2 text-sm flex-wrap mb-4">
              <span className="px-3 py-1.5 rounded-lg bg-[#0E1518] text-[#E9E1D8] border border-[#2A3338]">User Sells at Profit</span>
              <ChevronRight className="w-4 h-4 text-[#5F6A6E]" />
              <span className="px-3 py-1.5 rounded-lg bg-green-900/30 text-green-400 border border-green-500/30">No Tax (Diamond Hands!)</span>
              <ChevronRight className="w-4 h-4 text-[#5F6A6E]" />
              <span className="px-3 py-1.5 rounded-lg bg-cyan-900/30 text-cyan-400 border border-cyan-500/30">User Gets 100%</span>
            </div>
          </section>

          <section id="connect-wallet" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Connect Wallet</h2>
            <p className="text-[#9FA6A3] mb-4">
              To interact with PHBT, you need a Solana wallet. The connection process is straightforward and secure. Your wallet never shares private keys with the website.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Connection Steps</h3>
            <ol className="space-y-3 text-[#9FA6A3] list-decimal list-inside mb-6">
              <li>Click the "Connect Wallet" button in the header</li>
              <li>A modal will appear showing all available wallet options</li>
              <li>Select your preferred wallet from the list</li>
              <li>Your wallet extension will prompt you to approve the connection</li>
              <li>Click "Connect" or "Approve" in your wallet</li>
              <li>Your wallet address will appear in the header, confirming the connection</li>
            </ol>

            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Connection Security</h3>
            <ul className="space-y-2 text-[#9FA6A3] mb-6">
              <li className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                <span>PHBT never asks for or has access to your private keys</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                <span>All transactions require explicit approval in your wallet</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                <span>You can disconnect at any time by clicking your wallet address</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                <span>Connection only grants read access to your public address and balance</span>
              </li>
            </ul>

            <InfoBox type="warning" title="Wallet Security">
              Never share your seed phrase or private keys with anyone. PHBT staff will never ask for these. Always verify you are on phbt.fun before connecting.
            </InfoBox>
          </section>

          <section id="supported-wallets" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Supported Wallets</h2>
            <p className="text-[#9FA6A3] mb-4">
              PHBT supports all major Solana wallets through the Solana Wallet Adapter. Here are the recommended options:
            </p>
            
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-2 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-purple-400" /> Phantom
                </h4>
                <p className="text-sm text-[#5F6A6E]">
                  The most popular Solana wallet. Available as browser extension and mobile app. Excellent for beginners and power users alike.
                </p>
              </div>
              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-2 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-orange-400" /> Solflare
                </h4>
                <p className="text-sm text-[#5F6A6E]">
                  Feature-rich wallet with staking support. Browser extension, web, and mobile versions available. Great hardware wallet integration.
                </p>
              </div>
              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-2 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-red-400" /> Backpack
                </h4>
                <p className="text-sm text-[#5F6A6E]">
                  Multi-chain wallet from the Coral team. Supports Solana, Ethereum, and more. Built-in xNFT support.
                </p>
              </div>
              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-2 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-400" /> Coinbase Wallet
                </h4>
                <p className="text-sm text-[#5F6A6E]">
                  From the Coinbase exchange. Self-custody wallet with multi-chain support. Easy onboarding for Coinbase users.
                </p>
              </div>
              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-2 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-cyan-400" /> Ledger (via Phantom)
                </h4>
                <p className="text-sm text-[#5F6A6E]">
                  Hardware wallet support through Phantom. Maximum security for your assets. Requires Ledger device connected via USB.
                </p>
              </div>
              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-2 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" /> Other Wallets
                </h4>
                <p className="text-sm text-[#5F6A6E]">
                  Any wallet implementing the Solana Wallet Standard is compatible. This includes Slope, Exodus, Trust Wallet, and more.
                </p>
              </div>
            </div>
          </section>

          <section id="network" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Network & RPC</h2>
            <p className="text-[#9FA6A3] mb-4">
              PHBT operates on Solana Mainnet Beta. Understanding network configuration helps you troubleshoot connection issues.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Network Details</h3>
            <div className="bg-[#0D1214] border border-[#2A3338] rounded-lg p-4 mb-6">
              <ul className="space-y-2 text-[#9FA6A3] text-sm font-mono">
                <li><span className="text-[#5F6A6E]">Network:</span> Solana Mainnet Beta</li>
                <li><span className="text-[#5F6A6E]">Chain ID:</span> mainnet-beta</li>
                <li><span className="text-[#5F6A6E]">Default RPC:</span> Provided by wallet</li>
                <li><span className="text-[#5F6A6E]">Block Time:</span> ~400ms</li>
                <li><span className="text-[#5F6A6E]">Transaction Fee:</span> ~0.000005 SOL</li>
              </ul>
            </div>

            <InfoBox type="info" title="RPC Endpoints">
              For best performance, ensure your wallet is configured with a reliable RPC endpoint. Many wallets allow you to set custom RPCs for faster transaction submission.
            </InfoBox>
          </section>

          {/* USER INTERFACE */}
          <section id="ui-overview" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">UI Overview</h2>
            <p className="text-[#9FA6A3] mb-4">
              The PHBT user interface is designed for simplicity and efficiency. Here is a breakdown of the main components you will encounter:
            </p>
            
            <div className="space-y-4 mb-6">
              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-2">Header</h4>
                <p className="text-sm text-[#5F6A6E]">
                  Fixed at the top. Contains logo, navigation links (Explore, Create Coin, PHBI, Profile, Docs), How It Works modal, and wallet connection button.
                </p>
              </div>
              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-2">Token Ticker</h4>
                <p className="text-sm text-[#5F6A6E]">
                  Scrolling banner below the header showing live tokens. Displays token names, symbols, and prices. Pauses on hover.
                </p>
              </div>
              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-2">Main Content Area</h4>
                <p className="text-sm text-[#5F6A6E]">
                  The primary content zone. On home page, shows hero section and token grid. On token pages, shows chart and trading interface.
                </p>
              </div>
              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-2">Trading Sidebar</h4>
                <p className="text-sm text-[#5F6A6E]">
                  On token detail pages, a sticky sidebar on the right contains the trade panel, position info, treasury card, and creator fees card.
                </p>
              </div>
            </div>
          </section>

          <section id="header-nav" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Header & Navigation</h2>
            <p className="text-[#9FA6A3] mb-4">
              The header provides access to all major sections of the platform. It is fixed at the top of every page for easy navigation.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Navigation Items</h3>
            <ul className="space-y-3 text-[#9FA6A3]">
              <li className="flex items-start gap-2">
                <Eye className="w-4 h-4 text-[#8C3A32] mt-1 flex-shrink-0" />
                <span><strong className="text-[#E9E1D8]">Explore:</strong> Browse all tokens launched on the platform</span>
              </li>
              <li className="flex items-start gap-2">
                <Rocket className="w-4 h-4 text-[#8C3A32] mt-1 flex-shrink-0" />
                <span><strong className="text-[#E9E1D8]">Create Coin:</strong> Launch your own token with Paper Hand Tax</span>
              </li>
              <li className="flex items-start gap-2">
                <Trophy className="w-4 h-4 text-[#8C3A32] mt-1 flex-shrink-0" />
                <span><strong className="text-[#E9E1D8]">PHBI:</strong> Paper Hand Bitch Index leaderboard</span>
              </li>
              <li className="flex items-start gap-2">
                <Users className="w-4 h-4 text-[#8C3A32] mt-1 flex-shrink-0" />
                <span><strong className="text-[#E9E1D8]">Profile:</strong> View your stats, achievements, and trading history</span>
              </li>
              <li className="flex items-start gap-2">
                <Book className="w-4 h-4 text-[#8C3A32] mt-1 flex-shrink-0" />
                <span><strong className="text-[#E9E1D8]">Docs:</strong> This documentation page</span>
              </li>
              <li className="flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-[#8C3A32] mt-1 flex-shrink-0" />
                <span><strong className="text-[#E9E1D8]">How It Works:</strong> Modal explaining the Paper Hand Tax mechanism</span>
              </li>
            </ul>
          </section>

          <section id="token-ticker" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Token Ticker Banner</h2>
            <p className="text-[#9FA6A3] mb-4">
              The scrolling token ticker appears below the header on all pages. It provides a real-time view of active tokens on the platform.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Features</h3>
            <ul className="space-y-2 text-[#9FA6A3]">
              <li className="flex items-center gap-2"><Activity className="w-4 h-4 text-green-400" /> Real-time token data fetched from blockchain</li>
              <li className="flex items-center gap-2"><Activity className="w-4 h-4 text-green-400" /> Shows token symbol, name, and price/liquidity</li>
              <li className="flex items-center gap-2"><Activity className="w-4 h-4 text-green-400" /> Featured tokens highlighted with special styling</li>
              <li className="flex items-center gap-2"><Activity className="w-4 h-4 text-green-400" /> Infinite horizontal scroll animation</li>
              <li className="flex items-center gap-2"><Activity className="w-4 h-4 text-green-400" /> Pauses on hover for easy reading</li>
              <li className="flex items-center gap-2"><Activity className="w-4 h-4 text-green-400" /> Click any token to go to its detail page</li>
            </ul>
          </section>

          <section id="home-page" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Home Page</h2>
            <p className="text-[#9FA6A3] mb-4">
              The home page is your starting point for exploring and trading on PHBT. It consists of two main sections:
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Hero Section</h3>
            <p className="text-[#9FA6A3] mb-4">
              The hero section at the top introduces the platform with the PHBT branding and a brief tagline. Quick action buttons let you jump straight to creating a token or exploring the marketplace.
            </p>

            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Explore Section</h3>
            <p className="text-[#9FA6A3] mb-4">
              Below the hero is the explore section showing all launched tokens. Features include:
            </p>
            <ul className="space-y-2 text-[#9FA6A3]">
              <li className="flex items-center gap-2"><Search className="w-4 h-4 text-blue-400" /> Search bar for finding tokens</li>
              <li className="flex items-center gap-2"><Filter className="w-4 h-4 text-blue-400" /> Category filter buttons</li>
              <li className="flex items-center gap-2"><SlidersHorizontal className="w-4 h-4 text-blue-400" /> Sort dropdown (liquidity, newest, watchlist)</li>
              <li className="flex items-center gap-2"><LayoutGrid className="w-4 h-4 text-blue-400" /> Grid of token cards</li>
            </ul>
          </section>

          <section id="token-page" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Token Detail Page</h2>
            <p className="text-[#9FA6A3] mb-4">
              Each token has a dedicated detail page with comprehensive trading tools and information.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Page Layout</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-2">Top Bar</h4>
                <p className="text-sm text-[#5F6A6E]">
                  Token name, symbol, image, and key stats (market cap, 24h volume, liquidity). Share buttons for social media.
                </p>
              </div>
              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-2">Price Chart</h4>
                <p className="text-sm text-[#5F6A6E]">
                  Interactive area chart showing token price history. Market cap displayed in header. Responsive and auto-updating.
                </p>
              </div>
              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-2">Trade Panel (Sidebar)</h4>
                <p className="text-sm text-[#5F6A6E]">
                  Buy and sell interface with amount inputs, slippage settings, and transaction preview. Shows tax amount if applicable.
                </p>
              </div>
              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-2">Position Card (Sidebar)</h4>
                <p className="text-sm text-[#5F6A6E]">
                  Your current holdings, cost basis, unrealized P&L, and token balance. Only visible if you hold the token.
                </p>
              </div>
              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-2">Treasury Card</h4>
                <p className="text-sm text-[#5F6A6E]">
                  Shows treasury balance and total tax collected for this token. Transparency into where taxes go.
                </p>
              </div>
              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-2">Trade History</h4>
                <p className="text-sm text-[#5F6A6E]">
                  Recent trades for the token showing buyer/seller, amount, price, and time. Updates in real-time.
                </p>
              </div>
            </div>
          </section>

          <section id="mobile-ui" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Mobile Experience</h2>
            <p className="text-[#9FA6A3] mb-4">
              PHBT is fully responsive and optimized for mobile devices. The interface adapts to smaller screens while maintaining full functionality.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Mobile Optimizations</h3>
            <ul className="space-y-2 text-[#9FA6A3]">
              <li className="flex items-center gap-2"><Smartphone className="w-4 h-4 text-blue-400" /> Responsive header with condensed navigation</li>
              <li className="flex items-center gap-2"><Smartphone className="w-4 h-4 text-blue-400" /> Logo text changes to "PHBT" on small screens</li>
              <li className="flex items-center gap-2"><Smartphone className="w-4 h-4 text-blue-400" /> Stacked layout for token detail pages</li>
              <li className="flex items-center gap-2"><Smartphone className="w-4 h-4 text-blue-400" /> Touch-friendly buttons and inputs</li>
              <li className="flex items-center gap-2"><Smartphone className="w-4 h-4 text-blue-400" /> Optimized chart rendering for performance</li>
              <li className="flex items-center gap-2"><Smartphone className="w-4 h-4 text-blue-400" /> Full trading functionality on mobile</li>
            </ul>
          </section>

          <section id="pwa-install" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">PWA Installation</h2>
            <p className="text-[#9FA6A3] mb-4">
              PHBT can be installed as a Progressive Web App (PWA) on your phone or computer for a native app-like experience.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">How to Install</h3>
            <ol className="space-y-2 text-[#9FA6A3] list-decimal list-inside mb-6">
              <li>Visit phbt.fun in your browser</li>
              <li>Look for the "Install App" button in the header</li>
              <li>Click the button to trigger the installation prompt</li>
              <li>Confirm the installation in your browser</li>
              <li>The app will be added to your home screen or app launcher</li>
            </ol>

            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">PWA Benefits</h3>
            <ul className="space-y-2 text-[#9FA6A3]">
              <li className="flex items-center gap-2"><Download className="w-4 h-4 text-green-400" /> Launch from home screen like a native app</li>
              <li className="flex items-center gap-2"><Download className="w-4 h-4 text-green-400" /> Full screen experience without browser chrome</li>
              <li className="flex items-center gap-2"><Download className="w-4 h-4 text-green-400" /> Faster load times with cached resources</li>
              <li className="flex items-center gap-2"><Download className="w-4 h-4 text-green-400" /> Works on iOS, Android, Windows, and macOS</li>
            </ul>

            <InfoBox type="info" title="Install Button Visibility">
              The Install button only appears if your browser supports PWA installation and you have not already installed the app. On iOS, you may need to use the Share menu and tap Add to Home Screen.
            </InfoBox>
          </section>

          {/* EXPLORE & DISCOVER */}
          <section id="explore" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Explore Tokens</h2>
            <p className="text-[#9FA6A3] mb-4">
              The Explore section is your gateway to discovering all tokens launched on PHBT. It provides powerful tools for searching, filtering, and sorting to help you find exactly what you are looking for.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Features Overview</h3>
            <ul className="space-y-2 text-[#9FA6A3] mb-6">
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Search by token name, symbol, or contract address</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Filter by category (Meme, DeFi, Gaming, AI, NFT, Social, Utility, Other)</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Sort by liquidity (highest first), newest, alphabetically, or watchlist</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Real-time liquidity and price data from blockchain</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Token images and metadata fetched from Metaplex</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> One-click access to token detail pages</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Watchlist integration with star icons</li>
            </ul>

            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">How Data is Fetched</h3>
            <p className="text-[#9FA6A3] mb-4">
              Token data is fetched directly from the Solana blockchain using getProgramAccounts to find all tokens created by the PHBT program. Token metadata (name, symbol, image, description) is fetched from the Metaplex Token Metadata program. Liquidity is calculated from the pool reserves.
            </p>
          </section>

          <section id="search-tokens" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Search Tokens</h2>
            <p className="text-[#9FA6A3] mb-4">
              The search bar allows you to quickly find specific tokens by multiple criteria.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Search Methods</h3>
            <ul className="space-y-3 text-[#9FA6A3]">
              <li className="flex items-start gap-2">
                <Search className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                <span><strong className="text-[#E9E1D8]">By Name:</strong> Type the token name (e.g., "Dogecoin", "ShibaSolana")</span>
              </li>
              <li className="flex items-start gap-2">
                <Search className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                <span><strong className="text-[#E9E1D8]">By Symbol:</strong> Type the ticker symbol (e.g., "DOGE", "SHIB")</span>
              </li>
              <li className="flex items-start gap-2">
                <Search className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                <span><strong className="text-[#E9E1D8]">By Address:</strong> Paste the full mint address for exact match</span>
              </li>
            </ul>

            <InfoBox type="tip" title="Search Tips">
              Search is case-insensitive and matches partial strings. Typing "sol" will match "Solana", "SolPunk", "MySolToken", etc.
            </InfoBox>
          </section>

          <section id="filter-sort" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Filter & Sort</h2>
            <p className="text-[#9FA6A3] mb-4">
              Combine filters and sorting to narrow down the token list to exactly what interests you.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Sort Options</h3>
            <ul className="space-y-2 text-[#9FA6A3] mb-6">
              <li><strong className="text-[#E9E1D8]">Liquidity:</strong> Highest liquidity first. Best for finding established tokens.</li>
              <li><strong className="text-[#E9E1D8]">Newest:</strong> Most recently created first. Best for finding new opportunities.</li>
              <li><strong className="text-[#E9E1D8]">Name (A-Z):</strong> Alphabetical sorting. Best for browsing systematically.</li>
              <li><strong className="text-[#E9E1D8]">Watchlist:</strong> Your starred tokens first. Best for quick access to favorites.</li>
            </ul>
          </section>

          <section id="categories" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Token Categories</h2>
            <p className="text-[#9FA6A3] mb-4">
              Tokens are organized into categories for easy discovery. Category is set by the token creator at launch time.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-[#1A2428] rounded-lg p-3 border border-[#2A3338] text-center">
                <span className="text-2xl">🐕</span>
                <p className="text-sm text-[#E9E1D8] mt-1">Meme</p>
              </div>
              <div className="bg-[#1A2428] rounded-lg p-3 border border-[#2A3338] text-center">
                <span className="text-2xl">💰</span>
                <p className="text-sm text-[#E9E1D8] mt-1">DeFi</p>
              </div>
              <div className="bg-[#1A2428] rounded-lg p-3 border border-[#2A3338] text-center">
                <span className="text-2xl">🎮</span>
                <p className="text-sm text-[#E9E1D8] mt-1">Gaming</p>
              </div>
              <div className="bg-[#1A2428] rounded-lg p-3 border border-[#2A3338] text-center">
                <span className="text-2xl">🤖</span>
                <p className="text-sm text-[#E9E1D8] mt-1">AI</p>
              </div>
              <div className="bg-[#1A2428] rounded-lg p-3 border border-[#2A3338] text-center">
                <span className="text-2xl">🖼️</span>
                <p className="text-sm text-[#E9E1D8] mt-1">NFT</p>
              </div>
              <div className="bg-[#1A2428] rounded-lg p-3 border border-[#2A3338] text-center">
                <span className="text-2xl">👥</span>
                <p className="text-sm text-[#E9E1D8] mt-1">Social</p>
              </div>
              <div className="bg-[#1A2428] rounded-lg p-3 border border-[#2A3338] text-center">
                <span className="text-2xl">⚙️</span>
                <p className="text-sm text-[#E9E1D8] mt-1">Utility</p>
              </div>
              <div className="bg-[#1A2428] rounded-lg p-3 border border-[#2A3338] text-center">
                <span className="text-2xl">📦</span>
                <p className="text-sm text-[#E9E1D8] mt-1">Other</p>
              </div>
            </div>
          </section>

          <section id="watchlist" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Watchlist</h2>
            <p className="text-[#9FA6A3] mb-4">
              The watchlist feature lets you save your favorite tokens for quick access. It persists across browser sessions using local storage.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">How to Use</h3>
            <ol className="space-y-2 text-[#9FA6A3] list-decimal list-inside mb-6">
              <li>Find a token you want to track</li>
              <li>Click the star icon on the token card</li>
              <li>The star turns yellow indicating it is watchlisted</li>
              <li>Use the "Watchlist" sort option to see starred tokens first</li>
              <li>Click the star again to remove from watchlist</li>
            </ol>

            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Features</h3>
            <ul className="space-y-2 text-[#9FA6A3]">
              <li className="flex items-center gap-2"><Star className="w-4 h-4 text-yellow-400" /> Stored locally in your browser (no account needed)</li>
              <li className="flex items-center gap-2"><Star className="w-4 h-4 text-yellow-400" /> Persists across sessions and page refreshes</li>
              <li className="flex items-center gap-2"><Star className="w-4 h-4 text-yellow-400" /> Unlimited tokens can be watchlisted</li>
              <li className="flex items-center gap-2"><Star className="w-4 h-4 text-yellow-400" /> Works with the sort dropdown for easy access</li>
              <li className="flex items-center gap-2"><Star className="w-4 h-4 text-yellow-400" /> Contributes to "Watcher" achievement badge</li>
            </ul>
          </section>

          <section id="token-cards" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Token Cards</h2>
            <p className="text-[#9FA6A3] mb-4">
              Each token in the explore grid is displayed as a card with key information at a glance.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Card Elements</h3>
            <ul className="space-y-2 text-[#9FA6A3]">
              <li><strong className="text-[#E9E1D8]">Token Image:</strong> Square image from metadata, with fallback placeholder</li>
              <li><strong className="text-[#E9E1D8]">Name & Symbol:</strong> Full name and ticker symbol</li>
              <li><strong className="text-[#E9E1D8]">Category Badge:</strong> Colored badge showing token category</li>
              <li><strong className="text-[#E9E1D8]">Liquidity:</strong> Current SOL liquidity in the pool</li>
              <li><strong className="text-[#E9E1D8]">Star Icon:</strong> Click to add/remove from watchlist</li>
              <li><strong className="text-[#E9E1D8]">Share Buttons:</strong> Quick share to X, Telegram, or copy link</li>
            </ul>
          </section>

          {/* CREATE & LAUNCH */}
          <section id="launch-coin" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Launch Your Own Coin</h2>
            <p className="text-[#9FA6A3] mb-4">
              PHBT makes it easy to launch your own SPL token with Paper Hand Tax built in. No coding required. The entire process takes less than a minute.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Launch Process</h3>
            <ol className="space-y-3 text-[#9FA6A3] list-decimal list-inside mb-6">
              <li><strong className="text-[#E9E1D8]">Navigate:</strong> Click "Create Coin" in the header navigation</li>
              <li><strong className="text-[#E9E1D8]">Connect Wallet:</strong> If not already connected, connect your Solana wallet</li>
              <li><strong className="text-[#E9E1D8]">Fill Details:</strong> Enter token name, symbol (ticker), and description</li>
              <li><strong className="text-[#E9E1D8]">Upload Image:</strong> Provide a square image for your token (PNG, JPG, GIF)</li>
              <li><strong className="text-[#E9E1D8]">Select Category:</strong> Choose the most appropriate category</li>
              <li><strong className="text-[#E9E1D8]">Review:</strong> Double-check all information (cannot be changed after launch)</li>
              <li><strong className="text-[#E9E1D8]">Pay Fee:</strong> Pay the 0.02 SOL creation fee</li>
              <li><strong className="text-[#E9E1D8]">Confirm:</strong> Approve the transaction in your wallet</li>
              <li><strong className="text-[#E9E1D8]">Live!</strong> Your token is immediately tradable on PHBT</li>
            </ol>

            <InfoBox type="success" title="Automatic Safety">
              All tokens have mint and freeze authority revoked automatically at creation. No one (including you) can mint more tokens or freeze accounts. This protects buyers from rug pulls.
            </InfoBox>
          </section>

          <section id="token-details" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Token Details</h2>
            <p className="text-[#9FA6A3] mb-4">
              When creating a token, you need to provide several details. Choose carefully as these cannot be changed after launch.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Required Fields</h3>
            <ul className="space-y-3 text-[#9FA6A3]">
              <li className="flex items-start gap-2">
                <Type className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                <span><strong className="text-[#E9E1D8]">Name:</strong> The full name of your token (e.g., "Super Doge Coin"). Max 32 characters.</span>
              </li>
              <li className="flex items-start gap-2">
                <Hash className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                <span><strong className="text-[#E9E1D8]">Symbol:</strong> The ticker symbol (e.g., "SDOGE"). 2-10 characters, letters only. Must be unique.</span>
              </li>
              <li className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                <span><strong className="text-[#E9E1D8]">Description:</strong> Describe your token and its purpose. Max 500 characters.</span>
              </li>
            </ul>

            <InfoBox type="warning" title="Symbol Uniqueness">
              The symbol must be unique across all PHBT tokens. The interface will check availability in real-time as you type.
            </InfoBox>
          </section>

          <section id="token-image" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Token Image</h2>
            <p className="text-[#9FA6A3] mb-4">
              Your token image is displayed throughout the platform and is a key part of your token branding.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Image Requirements</h3>
            <ul className="space-y-2 text-[#9FA6A3]">
              <li className="flex items-center gap-2"><Image className="w-4 h-4 text-blue-400" /> Format: PNG, JPG, JPEG, GIF, or WebP</li>
              <li className="flex items-center gap-2"><Image className="w-4 h-4 text-blue-400" /> Aspect ratio: Square (1:1) recommended</li>
              <li className="flex items-center gap-2"><Image className="w-4 h-4 text-blue-400" /> Size: Minimum 200x200px, maximum 2MB</li>
              <li className="flex items-center gap-2"><Image className="w-4 h-4 text-blue-400" /> Content: No explicit or illegal content</li>
            </ul>

            <InfoBox type="tip" title="Image Tips">
              Use a clear, recognizable image that works well at small sizes. The image will be displayed as a circle in many places, so keep important content centered.
            </InfoBox>
          </section>

          <section id="token-metadata" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Token Metadata</h2>
            <p className="text-[#9FA6A3] mb-4">
              Token metadata is stored on-chain using the Metaplex Token Metadata program. This includes the name, symbol, description, and image URI.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Metadata Storage</h3>
            <p className="text-[#9FA6A3] mb-4">
              The metadata account is created at the same time as the token mint. It contains a URI pointing to a JSON file with extended metadata including the image URL. This data is immutable after creation.
            </p>
          </section>

          <section id="creation-fees" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Creation Fees</h2>
            <p className="text-[#9FA6A3] mb-4">
              Launching a token on PHBT requires a small fee to cover network costs and prevent spam.
            </p>
            
            <div className="bg-[#1A2428] rounded-lg p-6 border border-[#2A3338] mb-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-[#E9E1D8] mb-2">0.02 SOL</p>
                <p className="text-[#5F6A6E]">Token Creation Fee</p>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">What the Fee Covers</h3>
            <ul className="space-y-2 text-[#9FA6A3]">
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Token mint account rent</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Metadata account rent</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Pool account initialization</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Bonding curve setup</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Transaction fees</li>
            </ul>
          </section>

          <section id="authority-revocation" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Authority Revocation</h2>
            <p className="text-[#9FA6A3] mb-4">
              All PHBT tokens have their mint and freeze authorities automatically revoked at creation time. This is a critical safety feature.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">What This Means</h3>
            <ul className="space-y-3 text-[#9FA6A3]">
              <li className="flex items-start gap-2">
                <Lock className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                <span><strong className="text-[#E9E1D8]">No More Minting:</strong> The total supply is fixed forever. No one can create additional tokens.</span>
              </li>
              <li className="flex items-start gap-2">
                <Lock className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                <span><strong className="text-[#E9E1D8]">No Freezing:</strong> Token accounts cannot be frozen. Your tokens are always transferable.</span>
              </li>
              <li className="flex items-start gap-2">
                <Lock className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                <span><strong className="text-[#E9E1D8]">Irreversible:</strong> Authority revocation cannot be undone. It is permanent.</span>
              </li>
            </ul>

            <InfoBox type="success" title="Trust Minimization">
              With authorities revoked, you do not need to trust the token creator. The token is truly decentralized and cannot be manipulated post-launch.
            </InfoBox>
          </section>

          {/* TRADING */}
          <section id="trading" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Trading Overview</h2>
            <p className="text-[#9FA6A3] mb-4">
              Trading on PHBT is straightforward but comes with the unique Paper Hand Tax mechanic. Understanding how it works is essential before making trades.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Key Concepts</h3>
            <ul className="space-y-3 text-[#9FA6A3]">
              <li className="flex items-start gap-2">
                <Target className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                <span><strong className="text-[#E9E1D8]">Cost Basis:</strong> Your average purchase price, tracked on-chain per token per wallet</span>
              </li>
              <li className="flex items-start gap-2">
                <Percent className="w-4 h-4 text-yellow-400 mt-1 flex-shrink-0" />
                <span><strong className="text-[#E9E1D8]">Slippage:</strong> Maximum acceptable price movement during transaction (default 1%)</span>
              </li>
              <li className="flex items-start gap-2">
                <Flame className="w-4 h-4 text-[#8C3A32] mt-1 flex-shrink-0" />
                <span><strong className="text-[#E9E1D8]">Paper Hand Tax:</strong> 50% of SOL output if selling below cost basis</span>
              </li>
            </ul>
          </section>

          <section id="buying" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Buying Tokens</h2>
            <p className="text-[#9FA6A3] mb-4">
              Buying tokens on PHBT is tax-free. You only pay the standard Solana transaction fee plus any slippage.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Step-by-Step</h3>
            <ol className="space-y-3 text-[#9FA6A3] list-decimal list-inside mb-6">
              <li>Navigate to the token detail page</li>
              <li>Ensure you are on the "Buy" tab in the trade panel</li>
              <li>Enter the amount of SOL you want to spend</li>
              <li>The interface shows estimated tokens you will receive</li>
              <li>Review slippage settings (gear icon) if needed</li>
              <li>Click the "Buy" button</li>
              <li>Confirm the transaction in your wallet</li>
              <li>Wait for confirmation (usually 1-3 seconds)</li>
              <li>Your new tokens appear in your position</li>
            </ol>

            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">What Happens On-Chain</h3>
            <ul className="space-y-2 text-[#9FA6A3]">
              <li>SOL is transferred from your wallet to the pool</li>
              <li>Tokens are transferred from the pool to your wallet</li>
              <li>Your cost basis is updated (weighted average)</li>
              <li>Pool reserves and price are updated</li>
            </ul>
          </section>

          <section id="selling" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Selling Tokens</h2>
            <p className="text-[#9FA6A3] mb-4">
              Selling tokens is where the Paper Hand Tax comes into play. If you sell below your cost basis, 50% of your SOL output goes to the treasury.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Step-by-Step</h3>
            <ol className="space-y-3 text-[#9FA6A3] list-decimal list-inside mb-6">
              <li>Navigate to the token detail page</li>
              <li>Click the "Sell" tab in the trade panel</li>
              <li>Enter the token amount or use percentage buttons (25%, 50%, 75%, MAX)</li>
              <li>Review the expected SOL output</li>
              <li>Check if Paper Hand Tax applies (shown in red if applicable)</li>
              <li>Click the "Sell" button</li>
              <li>Confirm the transaction in your wallet</li>
              <li>SOL is deposited to your wallet (minus tax if applicable)</li>
            </ol>

            <InfoBox type="warning" title="Tax Warning">
              If selling at a loss, the interface will clearly show the tax amount in red. Double-check before confirming. The tax is automatically deducted and sent to treasury.
            </InfoBox>
          </section>

          <section id="slippage" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Slippage Settings</h2>
            <p className="text-[#9FA6A3] mb-4">
              Slippage tolerance determines the maximum price movement you will accept during your trade. This protects you from front-running and large price swings.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Default Settings</h3>
            <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338] mb-6">
              <ul className="space-y-2 text-[#9FA6A3]">
                <li><strong className="text-[#E9E1D8]">Default Slippage:</strong> 1%</li>
                <li><strong className="text-[#E9E1D8]">Minimum:</strong> 0.1%</li>
                <li><strong className="text-[#E9E1D8]">Maximum:</strong> 50%</li>
              </ul>
            </div>

            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">When to Adjust</h3>
            <ul className="space-y-2 text-[#9FA6A3]">
              <li><strong className="text-[#E9E1D8]">Lower (0.1-0.5%):</strong> For large trades where you want minimal price impact</li>
              <li><strong className="text-[#E9E1D8]">Default (1%):</strong> Good for most normal trades</li>
              <li><strong className="text-[#E9E1D8]">Higher (2-5%):</strong> For volatile tokens or during high activity</li>
              <li><strong className="text-[#E9E1D8]">Very High (10%+):</strong> Only if trades keep failing due to price movement</li>
            </ul>
          </section>

          <section id="position-tracking" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Position Tracking</h2>
            <p className="text-[#9FA6A3] mb-4">
              When you hold tokens, the Position Card shows your current position details.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Position Information</h3>
            <ul className="space-y-2 text-[#9FA6A3]">
              <li><strong className="text-[#E9E1D8]">Holdings:</strong> Number of tokens you own</li>
              <li><strong className="text-[#E9E1D8]">Value:</strong> Current SOL value of your holdings</li>
              <li><strong className="text-[#E9E1D8]">Cost Basis:</strong> Your average purchase price per token</li>
              <li><strong className="text-[#E9E1D8]">Unrealized P&L:</strong> Profit or loss if you sold now</li>
              <li><strong className="text-[#E9E1D8]">P&L %:</strong> Percentage gain or loss</li>
            </ul>
          </section>

          <section id="trade-history" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Trade History</h2>
            <p className="text-[#9FA6A3] mb-4">
              Each token page shows recent trades for that token. This helps you understand market activity and momentum.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Trade Information</h3>
            <ul className="space-y-2 text-[#9FA6A3]">
              <li><strong className="text-[#E9E1D8]">Type:</strong> Buy (green) or Sell (red)</li>
              <li><strong className="text-[#E9E1D8]">Amount:</strong> Token quantity traded</li>
              <li><strong className="text-[#E9E1D8]">Price:</strong> SOL price per token</li>
              <li><strong className="text-[#E9E1D8]">Maker:</strong> Wallet address (truncated)</li>
              <li><strong className="text-[#E9E1D8]">Time:</strong> How long ago the trade occurred</li>
            </ul>
          </section>

          <section id="price-charts" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Price Charts</h2>
            <p className="text-[#9FA6A3] mb-4">
              Each token detail page includes an interactive price chart showing historical price movement.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Chart Features</h3>
            <ul className="space-y-2 text-[#9FA6A3]">
              <li className="flex items-center gap-2"><LineChart className="w-4 h-4 text-blue-400" /> Area chart showing price over time</li>
              <li className="flex items-center gap-2"><LineChart className="w-4 h-4 text-blue-400" /> Market cap displayed in header</li>
              <li className="flex items-center gap-2"><LineChart className="w-4 h-4 text-blue-400" /> Auto-updating as new trades occur</li>
              <li className="flex items-center gap-2"><LineChart className="w-4 h-4 text-blue-400" /> Responsive sizing for all screen sizes</li>
              <li className="flex items-center gap-2"><LineChart className="w-4 h-4 text-blue-400" /> Powered by Lightweight Charts library</li>
            </ul>
          </section>

          {/* SOCIAL */}
          <section id="share" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Share & Social</h2>
            <p className="text-[#9FA6A3] mb-4">
              PHBT includes social sharing features to help you spread the word about tokens you discover or create.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Sharing Options</h3>
            <ul className="space-y-3 text-[#9FA6A3]">
              <li className="flex items-center gap-2"><Twitter className="w-4 h-4 text-blue-400" /> Share on X (formerly Twitter) with pre-filled text</li>
              <li className="flex items-center gap-2"><MessageCircle className="w-4 h-4 text-blue-400" /> Share on Telegram</li>
              <li className="flex items-center gap-2"><Copy className="w-4 h-4 text-[#5F6A6E]" /> Copy direct link to clipboard</li>
            </ul>
          </section>

          <section id="share-twitter" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Share on X</h2>
            <p className="text-[#9FA6A3] mb-4">
              Click the X icon on any token card or detail page to share on X (formerly Twitter). The tweet is pre-filled with token information.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Pre-filled Content</h3>
            <ul className="space-y-2 text-[#9FA6A3]">
              <li>Token name and symbol</li>
              <li>Current market cap</li>
              <li>Direct link to token page</li>
              <li>PHBT hashtag</li>
            </ul>
          </section>

          <section id="share-telegram" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Share on Telegram</h2>
            <p className="text-[#9FA6A3] mb-4">
              Click the Telegram icon to share the token in Telegram. Opens the Telegram share dialog with the token link.
            </p>
          </section>

          <section id="copy-link" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Copy Link</h2>
            <p className="text-[#9FA6A3] mb-4">
              Click the copy icon to copy the direct link to the token page. A toast notification confirms the copy. Paste anywhere to share.
            </p>
          </section>

          <section id="notifications" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Notifications</h2>
            <p className="text-[#9FA6A3] mb-4">
              Stay updated on your trades and watchlist tokens.
            </p>
            <CensoredContent />
          </section>

          {/* PAPER HAND TAX */}
          <section id="tax-overview" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Tax Overview</h2>
            <p className="text-[#9FA6A3] mb-4">
              The Paper Hand Tax is the core mechanism that defines PHBT. It is a 50% tax applied to all sell transactions that occur at a loss relative to your cost basis.
            </p>
            
            <div className="bg-[#8C3A32]/10 border border-[#8C3A32]/30 rounded-lg p-6 mb-6 text-center">
              <p className="text-2xl text-[#E9E1D8] font-bold mb-2">
                50% Paper Hand Tax
              </p>
              <p className="text-[#9FA6A3]">
                Applied when you sell tokens below your average purchase price
              </p>
            </div>

            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Core Rule</h3>
            <p className="text-[#9FA6A3] mb-4">
              If you sell PHBT tokens at a loss, a 50% tax is applied to your SOL output. That tax is not burned or wasted. It is redirected to the treasury to strengthen the ecosystem.
            </p>

            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">The Goal</h3>
            <p className="text-[#9FA6A3] mb-4">
              The goal is simple: punish panic selling, reward conviction. Paper hands feed the treasury. Diamond hands keep everything.
            </p>
          </section>

          <section id="tax-calculation" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Tax Calculation</h2>
            <p className="text-[#9FA6A3] mb-4">
              The tax calculation is straightforward and happens automatically on-chain during every sell transaction.
            </p>

            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Calculation Formula</h3>
            <CodeBlock code={`Cost Basis = Total SOL Spent / Total Tokens Bought

Current Price = Pool SOL Reserve / Pool Token Reserve

If Current Price < Cost Basis:
  Tax = SOL Output × 50%
  You Receive = SOL Output - Tax
  Treasury Receives = Tax
  
If Current Price >= Cost Basis:
  Tax = 0 (Diamond Hands!)
  You Receive = Full SOL Output`} />

            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3 mt-6">Example Scenario</h3>
            <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338] mb-4">
              <p className="text-[#9FA6A3] mb-2"><strong className="text-[#E9E1D8]">Scenario:</strong> You bought 1000 tokens for 1 SOL (cost basis = 0.001 SOL per token)</p>
              <p className="text-[#9FA6A3] mb-2"><strong className="text-[#E9E1D8]">Current Price:</strong> 0.0005 SOL per token (50% down)</p>
              <p className="text-[#9FA6A3] mb-2"><strong className="text-[#E9E1D8]">Sell Output:</strong> 0.5 SOL (before tax)</p>
              <p className="text-[#9FA6A3] mb-2"><strong className="text-[#8C3A32]">Tax (50%):</strong> 0.25 SOL to treasury</p>
              <p className="text-[#9FA6A3]"><strong className="text-green-400">You Receive:</strong> 0.25 SOL</p>
            </div>
          </section>

          <section id="cost-basis" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Cost Basis Tracking</h2>
            <p className="text-[#9FA6A3] mb-4">
              Your cost basis is tracked on-chain for each token you hold. This data is stored in a Program Derived Address (PDA) unique to your wallet and the token mint.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">What is Tracked</h3>
            <ul className="space-y-3 text-[#9FA6A3]">
              <li className="flex items-start gap-2">
                <Target className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                <span><strong className="text-[#E9E1D8]">Total SOL Spent:</strong> Cumulative SOL spent on buying this token</span>
              </li>
              <li className="flex items-start gap-2">
                <Target className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                <span><strong className="text-[#E9E1D8]">Total Tokens Acquired:</strong> Cumulative tokens bought (not transferred)</span>
              </li>
              <li className="flex items-start gap-2">
                <Target className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                <span><strong className="text-[#E9E1D8]">Average Purchase Price:</strong> SOL Spent / Tokens Acquired = Cost Basis</span>
              </li>
              <li className="flex items-start gap-2">
                <Target className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                <span><strong className="text-[#E9E1D8]">Total Tax Paid:</strong> Cumulative Paper Hand Tax paid on this token</span>
              </li>
            </ul>

            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3 mt-6">How Cost Basis Updates</h3>
            <ul className="space-y-2 text-[#9FA6A3]">
              <li><strong className="text-[#E9E1D8]">On Buy:</strong> Cost basis is recalculated as weighted average of old and new purchases</li>
              <li><strong className="text-[#E9E1D8]">On Sell:</strong> Cost basis remains unchanged (you are reducing position at same average)</li>
              <li><strong className="text-[#E9E1D8]">On Transfer In:</strong> No change (transferred tokens have no cost basis)</li>
              <li><strong className="text-[#E9E1D8]">On Transfer Out:</strong> No change (cost basis is wallet-specific)</li>
            </ul>

            <InfoBox type="info" title="Important: Transfers">
              Tokens received via transfer (not purchase) do not affect your cost basis. Only actual purchases through the PHBT smart contract count toward your cost basis.
            </InfoBox>
          </section>

          <section id="profit-loss" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Profit & Loss</h2>
            <p className="text-[#9FA6A3] mb-4">
              Your profit or loss is calculated by comparing the current token price to your cost basis.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">P&L Calculation</h3>
            <CodeBlock code={`Unrealized P&L = (Current Price - Cost Basis) × Token Balance

P&L % = ((Current Price - Cost Basis) / Cost Basis) × 100

If P&L > 0: You're in profit (Diamond Hands territory)
If P&L < 0: You're at a loss (Paper Hand Tax applies on sell)`} />

            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3 mt-6">Display in UI</h3>
            <ul className="space-y-2 text-[#9FA6A3]">
              <li><strong className="text-green-400">Green:</strong> Positive P&L, selling is tax-free</li>
              <li><strong className="text-[#8C3A32]">Red:</strong> Negative P&L, 50% tax will apply on sell</li>
            </ul>
          </section>

          <section id="tax-enforcement" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Tax Enforcement</h2>
            <p className="text-[#9FA6A3] mb-4">
              Understanding where the tax is and is not enforced is crucial for trading on PHBT.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Where Tax IS Enforced</h3>
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-green-400 mb-2">On phbt.fun (Native Platform)</h4>
              <p className="text-[#9FA6A3] text-sm mb-2">
                All trades on phbt.fun are executed through a custom smart-contract swap instruction.
              </p>
              <ul className="text-sm text-[#9FA6A3] space-y-1">
                <li>• Contract calculates your P&L on every sell</li>
                <li>• If selling at loss, 50% tax is automatically applied</li>
                <li>• Tax is sent directly to treasury</li>
                <li>• No manual intervention, no trust required</li>
              </ul>
            </div>

            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Where Tax is NOT Enforced</h3>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-red-400 mb-2">External DEXs (Raydium, Jupiter, etc.)</h4>
              <p className="text-[#9FA6A3] text-sm mb-2">
                External DEXs use their own swap logic. After migration:
              </p>
              <ul className="text-sm text-[#9FA6A3] space-y-1">
                <li>• PHBT smart contract is not called</li>
                <li>• No P&L check can be performed</li>
                <li>• No Paper Hand Tax can be applied</li>
                <li>• Users can bypass the system</li>
              </ul>
            </div>

            <InfoBox type="warning" title="Design Philosophy">
              PHBT is not trying to control every trade everywhere. Instead, it creates a strong incentive to trade on phbt.fun and makes panic selling economically painful within its ecosystem.
            </InfoBox>
          </section>

          <section id="external-dex" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">External DEX Trading</h2>
            <p className="text-[#9FA6A3] mb-4">
              After a token graduates and migrates to an AMM pool, it becomes tradable on external DEXs like Raydium and Jupiter.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Why Tax Cannot Be Enforced</h3>
            <p className="text-[#9FA6A3] mb-4">
              PHBT tokens are standard SPL tokens. Once they exist on-chain, any DEX can facilitate trades. External DEXs use their own swap programs, not the PHBT program, so they cannot check cost basis or apply the tax.
            </p>

            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Implications</h3>
            <ul className="space-y-2 text-[#9FA6A3]">
              <li><strong className="text-[#E9E1D8]">Before Migration:</strong> All trades must go through PHBT, tax is enforced</li>
              <li><strong className="text-[#E9E1D8]">After Migration:</strong> Trades on PHBT still have tax, external DEX trades do not</li>
              <li><strong className="text-[#E9E1D8]">User Choice:</strong> Users can choose where to trade based on their preference</li>
            </ul>
          </section>

          <section id="phbi" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Paper Hand Index (PHBI)</h2>
            <p className="text-[#9FA6A3] mb-4">
              The PHBI leaderboard is a hall of shame for paper hands. It ranks addresses by total Paper Hand Tax paid across all tokens.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Leaderboard Features</h3>
            <ul className="space-y-2 text-[#9FA6A3]">
              <li className="flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-400" /> Ranks wallets by total tax paid (highest first)</li>
              <li className="flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-400" /> Shows wallet address (truncated) and tax amount</li>
              <li className="flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-400" /> Updated in real-time as trades occur</li>
              <li className="flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-400" /> Top paper hands get special recognition</li>
            </ul>
            
            <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338] mt-4">
              <p className="text-[#5F6A6E] text-sm">
                View the leaderboard at <Link href="/phbi" className="text-[#8C3A32] hover:underline">/phbi</Link>
              </p>
            </div>

            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3 mt-6">Diamond Hands Leaderboard</h3>
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
              <p className="text-cyan-400 font-medium mb-2">Coming Soon</p>
              <p className="text-[#9FA6A3] text-sm">
                The opposite of PHBI. Will show addresses with the biggest profits from selling in profit.
              </p>
            </div>
          </section>

          <section id="treasury" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Treasury</h2>
            <p className="text-[#9FA6A3] mb-4">
              The treasury is a program-controlled vault that collects all Paper Hand Tax revenue. It is fully transparent and verifiable on-chain.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Treasury Purpose</h3>
            <p className="text-[#9FA6A3] mb-4">
              All tax revenue is automatically deposited to the treasury. These funds are used to strengthen the PHBT ecosystem and benefit holders.
            </p>
          </section>

          <section id="treasury-usage" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Treasury Usage</h2>
            <p className="text-[#9FA6A3] mb-4">
              Treasury funds are allocated to several ecosystem-building activities:
            </p>
            
            <div className="space-y-4">
              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-2 flex items-center gap-2">
                  <Coins className="w-5 h-5 text-yellow-400" /> Token Buybacks
                </h4>
                <p className="text-sm text-[#5F6A6E]">
                  Treasury funds are used to buy back tokens from the market, reducing supply and supporting price.
                </p>
              </div>
              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-2 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-400" /> Liquidity Support
                </h4>
                <p className="text-sm text-[#5F6A6E]">
                  Adding liquidity to pools to ensure healthy trading conditions and reduce slippage for users.
                </p>
              </div>
              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-2 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-purple-400" /> Ecosystem Incentives
                </h4>
                <p className="text-sm text-[#5F6A6E]">
                  Rewards, airdrops, and incentives for active traders and community members.
                </p>
              </div>
              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-2 flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-green-400" /> Development
                </h4>
                <p className="text-sm text-[#5F6A6E]">
                  Funding continued development, audits, and improvements to the platform.
                </p>
              </div>
            </div>
          </section>

          {/* TOKENOMICS */}
          <section id="tokenomics-overview" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Tokenomics Overview</h2>
            <p className="text-[#9FA6A3] mb-4">
              PHBT uses a two-phase tokenomics model: bonding curve for launch and price discovery, followed by AMM pool for sustained trading.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Token Lifecycle</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-2">Phase 1: Bonding Curve</h4>
                <ul className="text-sm text-[#5F6A6E] space-y-1">
                  <li>• Token launches at initial price</li>
                  <li>• Price increases as supply is bought</li>
                  <li>• Provides initial liquidity</li>
                  <li>• Fair launch mechanism</li>
                </ul>
              </div>
              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-2">Phase 2: AMM Pool</h4>
                <ul className="text-sm text-[#5F6A6E] space-y-1">
                  <li>• Token graduates at threshold</li>
                  <li>• Migrates to constant product AMM</li>
                  <li>• Full liquidity unlocked</li>
                  <li>• External DEX compatible</li>
                </ul>
              </div>
            </div>
          </section>

          <section id="bonding-curve" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Bonding Curve</h2>
            <p className="text-[#9FA6A3] mb-4">
              Every token launches with a bonding curve. This mathematical formula determines the token price based on the current supply, ensuring fair price discovery during the initial launch phase.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">How It Works</h3>
            <p className="text-[#9FA6A3] mb-4">
              When you buy tokens, the price increases along the curve. When you sell, the price decreases. This creates natural price discovery without the need for market makers.
            </p>

            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Formula</h3>
            <CensoredContent />

            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3 mt-6">Parameters</h3>
            <CensoredContent />

            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3 mt-6">Benefits</h3>
            <ul className="space-y-2 text-[#9FA6A3]">
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Fair launch with no presale or insiders</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Automatic price discovery</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Always liquid (can always buy or sell)</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Transparent pricing formula</li>
            </ul>
          </section>

          <section id="price-discovery" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Price Discovery</h2>
            <p className="text-[#9FA6A3] mb-4">
              Price discovery on PHBT happens organically through supply and demand interacting with the bonding curve.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Price Movement</h3>
            <ul className="space-y-2 text-[#9FA6A3]">
              <li><strong className="text-green-400">Buying:</strong> Increases price along the curve</li>
              <li><strong className="text-[#8C3A32]">Selling:</strong> Decreases price along the curve</li>
              <li><strong className="text-[#E9E1D8]">Large Buys:</strong> Cause larger price increases (slippage)</li>
              <li><strong className="text-[#E9E1D8]">Large Sells:</strong> Cause larger price decreases (slippage)</li>
            </ul>
          </section>

          <section id="amm-pool" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">AMM Pool</h2>
            <p className="text-[#9FA6A3] mb-4">
              After graduation, tokens migrate to a constant product Automated Market Maker (AMM) pool. This is the standard x*y=k formula used by most DEXs.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">How AMM Works</h3>
            <p className="text-[#9FA6A3] mb-4">
              The AMM maintains two reserves: SOL and tokens. The product of these reserves (k) stays constant during trades. When you buy tokens, you add SOL and remove tokens, changing the ratio and thus the price.
            </p>

            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">AMM Formula</h3>
            <CensoredContent />

            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3 mt-6">LP Tokens</h3>
            <CensoredContent />
          </section>

          <section id="migration" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Migration</h2>
            <p className="text-[#9FA6A3] mb-4">
              Migration is the process of moving from bonding curve to AMM pool. It happens automatically when the graduation threshold is reached.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Migration Process</h3>
            <CensoredContent />

            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3 mt-6">What Happens During Migration</h3>
            <ul className="space-y-2 text-[#9FA6A3]">
              <li className="flex items-center gap-2"><ArrowRightLeft className="w-4 h-4 text-blue-400" /> Bonding curve reserves are transferred to AMM pool</li>
              <li className="flex items-center gap-2"><ArrowRightLeft className="w-4 h-4 text-blue-400" /> Token trading continues uninterrupted</li>
              <li className="flex items-center gap-2"><ArrowRightLeft className="w-4 h-4 text-blue-400" /> Paper Hand Tax still applies on phbt.fun</li>
              <li className="flex items-center gap-2"><ArrowRightLeft className="w-4 h-4 text-blue-400" /> Token becomes tradable on external DEXs</li>
            </ul>
          </section>

          <section id="graduation" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Graduation Threshold</h2>
            <p className="text-[#9FA6A3] mb-4">
              The graduation threshold is the market cap or liquidity level at which a token automatically migrates from bonding curve to AMM.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Threshold Details</h3>
            <CensoredContent />

            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3 mt-6">Why Graduation Matters</h3>
            <ul className="space-y-2 text-[#9FA6A3]">
              <li><strong className="text-[#E9E1D8]">Proves Demand:</strong> Reaching threshold shows real market interest</li>
              <li><strong className="text-[#E9E1D8]">Unlocks Liquidity:</strong> Full liquidity becomes available</li>
              <li><strong className="text-[#E9E1D8]">External Trading:</strong> Token can be traded on other platforms</li>
              <li><strong className="text-[#E9E1D8]">Milestone:</strong> Significant achievement for the token community</li>
            </ul>
          </section>

          <section id="liquidity" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Liquidity</h2>
            <p className="text-[#9FA6A3] mb-4">
              Liquidity refers to the SOL and tokens available in the pool for trading. Higher liquidity means lower slippage and better trading conditions.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Liquidity Sources</h3>
            <ul className="space-y-2 text-[#9FA6A3]">
              <li><strong className="text-[#E9E1D8]">Initial:</strong> Provided by bonding curve mechanism</li>
              <li><strong className="text-[#E9E1D8]">Trading:</strong> Grows as more people buy</li>
              <li><strong className="text-[#E9E1D8]">Treasury:</strong> May add liquidity from tax revenue</li>
            </ul>

            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3 mt-6">Liquidity Management</h3>
            <CensoredContent />
          </section>

          <section id="lp-tokens" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">LP Tokens</h2>
            <p className="text-[#9FA6A3] mb-4">
              LP (Liquidity Provider) tokens represent ownership of liquidity in the AMM pool.
            </p>
            
            <CensoredContent />
          </section>

          {/* PROFILE & REWARDS */}
          <section id="profile" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Your Profile</h2>
            <p className="text-[#9FA6A3] mb-4">
              Your profile page provides a comprehensive view of your trading activity, statistics, and achievements on PHBT. Access it at <Link href="/profile" className="text-[#8C3A32] hover:underline">/profile</Link>.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Profile Contents</h3>
            <ul className="space-y-2 text-[#9FA6A3]">
              <li className="flex items-center gap-2"><Wallet className="w-4 h-4 text-blue-400" /> Connected wallet address and balance</li>
              <li className="flex items-center gap-2"><BarChart3 className="w-4 h-4 text-blue-400" /> Trading statistics summary</li>
              <li className="flex items-center gap-2"><Award className="w-4 h-4 text-blue-400" /> Achievement badges (visible and secret)</li>
              <li className="flex items-center gap-2"><RefreshCw className="w-4 h-4 text-blue-400" /> Scan wallet button to update stats</li>
            </ul>
          </section>

          <section id="profile-stats" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Profile Statistics</h2>
            <p className="text-[#9FA6A3] mb-4">
              Your profile tracks comprehensive statistics about your activity on PHBT.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Tracked Metrics</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-1">Total Trades</h4>
                <p className="text-sm text-[#5F6A6E]">Number of buy and sell transactions across all tokens</p>
              </div>
              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-1">Volume (SOL)</h4>
                <p className="text-sm text-[#5F6A6E]">Total SOL value of all your trades</p>
              </div>
              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-1">Tokens Created</h4>
                <p className="text-sm text-[#5F6A6E]">Number of tokens you have launched</p>
              </div>
              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-1">Tax Paid (SOL)</h4>
                <p className="text-sm text-[#5F6A6E]">Total Paper Hand Tax you have paid</p>
              </div>
            </div>
          </section>

          <section id="wallet-balance" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Wallet Balance</h2>
            <p className="text-[#9FA6A3] mb-4">
              Your current SOL balance is displayed prominently on your profile. This is fetched in real-time from the blockchain.
            </p>
            
            <InfoBox type="info" title="Balance Display">
              The balance shown is your native SOL balance. Token holdings are not displayed on the profile page but can be seen on individual token pages.
            </InfoBox>
          </section>

          <section id="achievements" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Achievements</h2>
            <p className="text-[#9FA6A3] mb-4">
              Achievements are badges you unlock by completing various activities on PHBT. They showcase your trading experience and milestones.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Achievement System</h3>
            <ul className="space-y-2 text-[#9FA6A3]">
              <li className="flex items-center gap-2"><Award className="w-4 h-4 text-yellow-400" /> 20+ visible achievements to unlock</li>
              <li className="flex items-center gap-2"><Award className="w-4 h-4 text-yellow-400" /> 24+ secret hidden achievements</li>
              <li className="flex items-center gap-2"><Award className="w-4 h-4 text-yellow-400" /> Progress tracking for each achievement</li>
              <li className="flex items-center gap-2"><Award className="w-4 h-4 text-yellow-400" /> Special badges for early adopters</li>
            </ul>
          </section>

          <section id="achievement-categories" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Achievement Categories</h2>
            <p className="text-[#9FA6A3] mb-4">
              Achievements are organized into categories based on the type of activity.
            </p>
            
            <div className="space-y-4">
              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-2 flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-400" /> Trading Milestones
                </h4>
                <p className="text-sm text-[#5F6A6E] mb-2">Unlock by completing trades:</p>
                <ul className="text-sm text-[#5F6A6E] space-y-1">
                  <li>🩸 First Blood: Make your first buy</li>
                  <li>📄 Paper or Diamond?: Make your first sell</li>
                  <li>🚀 Getting Started: Complete 10 trades</li>
                  <li>📈 Active Trader: Complete 50 trades</li>
                  <li>🤖 Trading Machine: Complete 100 trades</li>
                  <li>👑 Degen Legend: Complete 500 trades</li>
                </ul>
              </div>
              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-2 flex items-center gap-2">
                  <Coins className="w-5 h-5 text-yellow-400" /> Volume Milestones
                </h4>
                <p className="text-sm text-[#5F6A6E] mb-2">Unlock by reaching volume thresholds:</p>
                <ul className="text-sm text-[#5F6A6E] space-y-1">
                  <li>🐟 Small Fish: Trade 1 SOL total volume</li>
                  <li>🐠 Medium Fish: Trade 10 SOL total volume</li>
                  <li>🐋 Big Fish: Trade 100 SOL total volume</li>
                  <li>🐳 Whale: Trade 1000 SOL total volume</li>
                </ul>
              </div>
              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-2 flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-blue-400" /> Creator Badges
                </h4>
                <p className="text-sm text-[#5F6A6E] mb-2">Unlock by launching tokens:</p>
                <ul className="text-sm text-[#5F6A6E] space-y-1">
                  <li>✨ Creator: Launch your first token</li>
                  <li>🏭 Serial Creator: Launch 5 tokens</li>
                  <li>🏰 Token Factory: Launch 10 tokens</li>
                </ul>
              </div>
              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-2 flex items-center gap-2">
                  <Diamond className="w-5 h-5 text-cyan-400" /> Diamond Hands
                </h4>
                <p className="text-sm text-[#5F6A6E] mb-2">Unlock by holding strong:</p>
                <ul className="text-sm text-[#5F6A6E] space-y-1">
                  <li>💎 Diamond Hands: Hold through a 50% dip</li>
                  <li>🔥 Hot Streak: 3 profitable trades in a row</li>
                </ul>
              </div>
              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-2 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-[#8C3A32]" /> Paper Hand Badges
                </h4>
                <p className="text-sm text-[#5F6A6E] mb-2">Unlock by paying tax:</p>
                <ul className="text-sm text-[#5F6A6E] space-y-1">
                  <li>🧻 Paper Hands: Sell at a loss once</li>
                  <li>💸 Tax Contributor: Pay 1 SOL in paper hand tax</li>
                </ul>
              </div>
              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-2 flex items-center gap-2">
                  <Star className="w-5 h-5 text-purple-400" /> Platform Usage
                </h4>
                <p className="text-sm text-[#5F6A6E] mb-2">Unlock by using features:</p>
                <ul className="text-sm text-[#5F6A6E] space-y-1">
                  <li>👀 Watcher: Add 5 tokens to watchlist</li>
                  <li>🌅 Early Adopter: Joined before Jan 2, 2026</li>
                  <li>🏆 OG Trader: One of the first 100 traders</li>
                </ul>
              </div>
            </div>
          </section>

          <section id="secret-achievements" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Secret Achievements</h2>
            <p className="text-[#9FA6A3] mb-4">
              Some achievements are hidden until you unlock them. They are marked with a lock icon and the description is hidden. Can you find them all?
            </p>
            
            <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
              <p className="text-[#5F6A6E] text-sm flex items-center gap-2">
                <Lock className="w-4 h-4 text-purple-400" />
                There are 24+ secret achievements waiting to be discovered...
              </p>
            </div>

            <InfoBox type="tip" title="Hint">
              Secret achievements are often tied to unusual activities or extreme milestones. Try different things and you might stumble upon one!
            </InfoBox>
          </section>

          <section id="leaderboard" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Leaderboard</h2>
            <p className="text-[#9FA6A3] mb-4">
              Compete with other traders on the leaderboards. See where you rank among the community.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Available Leaderboards</h3>
            <div className="space-y-3">
              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#8C3A32] mb-1">Paper Hand Index (PHBI)</h4>
                <p className="text-sm text-[#5F6A6E]">Ranks wallets by total Paper Hand Tax paid. The hall of shame.</p>
              </div>
              <div className="bg-[#1A2428] rounded-lg p-4 border border-cyan-500/30">
                <h4 className="font-semibold text-cyan-400 mb-1">Diamond Hands Leaderboard</h4>
                <p className="text-sm text-[#5F6A6E]">Coming Soon. Will rank wallets by total profits from selling in profit.</p>
              </div>
            </div>
          </section>

          <section id="scan-wallet" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Scan Wallet Activity</h2>
            <p className="text-[#9FA6A3] mb-4">
              If your profile shows zero stats but you have been trading, use the "Scan Wallet" button to analyze your on-chain activity and update your profile.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">What Scanning Does</h3>
            <ul className="space-y-2 text-[#9FA6A3]">
              <li className="flex items-center gap-2"><RefreshCw className="w-4 h-4 text-blue-400" /> Fetches your transaction history from blockchain</li>
              <li className="flex items-center gap-2"><RefreshCw className="w-4 h-4 text-blue-400" /> Calculates trades, volume, and tokens created</li>
              <li className="flex items-center gap-2"><RefreshCw className="w-4 h-4 text-blue-400" /> Updates your profile in the database</li>
              <li className="flex items-center gap-2"><RefreshCw className="w-4 h-4 text-blue-400" /> Recalculates achievement progress</li>
            </ul>

            <InfoBox type="info" title="When to Scan">
              Scan your wallet when you first visit your profile or if your stats seem outdated. The scan processes recent activity and may take a few seconds.
            </InfoBox>
          </section>

          {/* TECHNICAL DETAILS */}
          <section id="smart-contracts" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Smart Contracts</h2>
            <p className="text-[#9FA6A3] mb-4">
              PHBT is powered by Solana smart contracts (programs) written using the Anchor framework. These programs handle all on-chain logic.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Program Modules</h3>
            <ul className="space-y-2 text-[#9FA6A3]">
              <li><strong className="text-[#E9E1D8]">Token Creation:</strong> Creates SPL tokens with metadata</li>
              <li><strong className="text-[#E9E1D8]">Trading:</strong> Handles buy/sell with tax enforcement</li>
              <li><strong className="text-[#E9E1D8]">Cost Basis:</strong> Tracks per-user cost basis</li>
              <li><strong className="text-[#E9E1D8]">Treasury:</strong> Collects and manages tax revenue</li>
              <li><strong className="text-[#E9E1D8]">Migration:</strong> Handles bonding curve to AMM transition</li>
            </ul>
          </section>

          <section id="program-accounts" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Program Accounts</h2>
            <p className="text-[#9FA6A3] mb-4">
              The PHBT program uses various account types to store on-chain data.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Account Types</h3>
            <ul className="space-y-2 text-[#9FA6A3]">
              <li><strong className="text-[#E9E1D8]">Global Config:</strong> Platform-wide settings</li>
              <li><strong className="text-[#E9E1D8]">Token Pool:</strong> Reserves for each token</li>
              <li><strong className="text-[#E9E1D8]">User Position:</strong> Cost basis per user per token</li>
              <li><strong className="text-[#E9E1D8]">Treasury:</strong> Collected tax funds</li>
              <li><strong className="text-[#E9E1D8]">Curve Config:</strong> Bonding curve parameters</li>
            </ul>
          </section>

          <section id="pda-structure" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">PDA Structure</h2>
            <p className="text-[#9FA6A3] mb-4">
              Program Derived Addresses (PDAs) are used to deterministically derive account addresses from seeds. This enables trustless account lookups.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Common PDAs</h3>
            <ul className="space-y-2 text-[#9FA6A3]">
              <li><strong className="text-[#E9E1D8]">Mint:</strong> ["mint", symbol, creator]</li>
              <li><strong className="text-[#E9E1D8]">Pool:</strong> ["pool", mint]</li>
              <li><strong className="text-[#E9E1D8]">Position:</strong> ["position", user, mint]</li>
              <li><strong className="text-[#E9E1D8]">Treasury:</strong> ["treasury"]</li>
            </ul>
          </section>

          <section id="transaction-flow" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Transaction Flow</h2>
            <p className="text-[#9FA6A3] mb-4">
              Understanding how transactions flow through the system helps you understand what happens when you trade.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Buy Transaction Flow</h3>
            <ol className="space-y-2 text-[#9FA6A3] list-decimal list-inside mb-6">
              <li>User initiates buy with SOL amount</li>
              <li>Frontend builds transaction with program instruction</li>
              <li>User signs transaction in wallet</li>
              <li>Transaction submitted to Solana network</li>
              <li>Program validates inputs and accounts</li>
              <li>SOL transferred from user to pool</li>
              <li>Tokens transferred from pool to user</li>
              <li>Cost basis account updated</li>
              <li>Pool reserves updated</li>
              <li>Transaction confirmed</li>
            </ol>

            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Sell Transaction Flow</h3>
            <ol className="space-y-2 text-[#9FA6A3] list-decimal list-inside">
              <li>User initiates sell with token amount</li>
              <li>Program calculates SOL output from curve/AMM</li>
              <li>Program checks current price vs cost basis</li>
              <li>If loss: 50% tax calculated</li>
              <li>Tokens transferred from user to pool</li>
              <li>SOL (minus tax) transferred to user</li>
              <li>Tax (if any) transferred to treasury</li>
              <li>Cost basis account updated</li>
              <li>Pool reserves updated</li>
            </ol>
          </section>

          <section id="on-chain-data" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">On-Chain Data</h2>
            <p className="text-[#9FA6A3] mb-4">
              All critical data is stored on the Solana blockchain for transparency and immutability.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">What is On-Chain</h3>
            <ul className="space-y-2 text-[#9FA6A3]">
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Token mints and metadata</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Pool reserves and prices</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> User cost basis and positions</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Treasury balance</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Trade history (in transactions)</li>
            </ul>
          </section>

          {/* SECURITY */}
          <section id="security" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Security Overview</h2>
            <p className="text-[#9FA6A3] mb-4">
              Security is a top priority for PHBT. The smart contracts are built using industry best practices and battle-tested frameworks.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Security Measures</h3>
            <ul className="space-y-3 text-[#9FA6A3]">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span><strong className="text-[#E9E1D8]">Anchor Framework:</strong> Type-safe smart contracts with automatic serialization and account validation</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span><strong className="text-[#E9E1D8]">Checked Math:</strong> All arithmetic operations use checked math to prevent integer overflow/underflow</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span><strong className="text-[#E9E1D8]">PDA Validation:</strong> All Program Derived Addresses are validated to ensure correct account derivation</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span><strong className="text-[#E9E1D8]">Reentrancy Protection:</strong> State changes occur before external calls to prevent reentrancy attacks</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span><strong className="text-[#E9E1D8]">Owner Checks:</strong> All account ownership is validated before operations</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span><strong className="text-[#E9E1D8]">Signer Checks:</strong> All required signatures are verified</span>
              </li>
            </ul>
          </section>

          <section id="anchor-framework" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Anchor Framework</h2>
            <p className="text-[#9FA6A3] mb-4">
              PHBT smart contracts are built using the Anchor framework, the industry standard for Solana program development.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Why Anchor?</h3>
            <ul className="space-y-2 text-[#9FA6A3]">
              <li className="flex items-center gap-2"><Code className="w-4 h-4 text-blue-400" /> Type-safe account structures</li>
              <li className="flex items-center gap-2"><Code className="w-4 h-4 text-blue-400" /> Automatic account validation</li>
              <li className="flex items-center gap-2"><Code className="w-4 h-4 text-blue-400" /> Built-in security checks</li>
              <li className="flex items-center gap-2"><Code className="w-4 h-4 text-blue-400" /> Standardized error handling</li>
              <li className="flex items-center gap-2"><Code className="w-4 h-4 text-blue-400" /> Automatic serialization/deserialization</li>
              <li className="flex items-center gap-2"><Code className="w-4 h-4 text-blue-400" /> IDL generation for frontend integration</li>
            </ul>
          </section>

          <section id="token-safety" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Token Safety</h2>
            <p className="text-[#9FA6A3] mb-4">
              All tokens created on PHBT have several safety features built in to protect buyers from common scams.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Safety Features</h3>
            <ul className="space-y-3 text-[#9FA6A3]">
              <li className="flex items-start gap-2">
                <Lock className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span><strong className="text-[#E9E1D8]">Mint Authority Revoked:</strong> No more tokens can ever be minted. The supply is fixed forever at creation.</span>
              </li>
              <li className="flex items-start gap-2">
                <Lock className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span><strong className="text-[#E9E1D8]">Freeze Authority Revoked:</strong> No one can freeze token accounts. Your tokens are always transferable.</span>
              </li>
              <li className="flex items-start gap-2">
                <Lock className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span><strong className="text-[#E9E1D8]">Immutable Metadata:</strong> Token name, symbol, and image cannot be changed after creation.</span>
              </li>
              <li className="flex items-start gap-2">
                <Lock className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span><strong className="text-[#E9E1D8]">No Hidden Fees:</strong> The only fee is the Paper Hand Tax, which is transparent and predictable.</span>
              </li>
            </ul>
          </section>

          <section id="account-validation" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Account Validation</h2>
            <p className="text-[#9FA6A3] mb-4">
              Every transaction validates all accounts to ensure the correct accounts are being used and the caller has appropriate permissions.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Validation Checks</h3>
            <ul className="space-y-2 text-[#9FA6A3]">
              <li className="flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-green-400" /> PDA derivation validation</li>
              <li className="flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-green-400" /> Account owner verification</li>
              <li className="flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-green-400" /> Signer authority checks</li>
              <li className="flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-green-400" /> Token account mint matching</li>
              <li className="flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-green-400" /> Balance sufficiency checks</li>
            </ul>
          </section>

          <section id="risks" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Risks & Disclaimers</h2>
            <p className="text-[#9FA6A3] mb-4">
              While we strive to build a secure platform, there are inherent risks in crypto trading and DeFi. Please read carefully.
            </p>
            
            <InfoBox type="warning" title="External DEX Trading">
              Trades on external DEXs (Raydium, Jupiter, etc.) are NOT subject to Paper Hand Tax. After migration, users can trade elsewhere without tax enforcement.
            </InfoBox>
            
            <InfoBox type="warning" title="Scam Tokens">
              Anyone can create tokens on PHBT. We do not verify token legitimacy, team credentials, or project fundamentals. Always Do Your Own Research (DYOR) before investing.
            </InfoBox>

            <InfoBox type="warning" title="Smart Contract Risk">
              While our contracts are built with security best practices, no code is 100% bug-free. Use at your own risk.
            </InfoBox>

            <InfoBox type="warning" title="Price Volatility">
              Cryptocurrency prices are extremely volatile. Prices can drop to zero. Never invest more than you can afford to lose completely.
            </InfoBox>

            <InfoBox type="warning" title="Not Financial Advice">
              Nothing on this platform constitutes financial advice. We are not licensed financial advisors. Consult a professional before making investment decisions.
            </InfoBox>

            <InfoBox type="warning" title="Regulatory Risk">
              Cryptocurrency regulations vary by jurisdiction and are constantly evolving. You are responsible for compliance with your local laws.
            </InfoBox>
          </section>

          <section id="scam-protection" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Scam Protection Tips</h2>
            <p className="text-[#9FA6A3] mb-4">
              Protect yourself from scams by following these guidelines.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Red Flags</h3>
            <ul className="space-y-2 text-[#9FA6A3] mb-6">
              <li className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-400" /> Promises of guaranteed returns</li>
              <li className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-400" /> Pressure to buy quickly (FOMO tactics)</li>
              <li className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-400" /> Anonymous or unverifiable teams</li>
              <li className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-400" /> Copied or AI-generated project materials</li>
              <li className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-400" /> Unusually high concentration of tokens in few wallets</li>
            </ul>

            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Best Practices</h3>
            <ul className="space-y-2 text-[#9FA6A3]">
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Research the project and team thoroughly</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Check token distribution for whale concentration</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Start with small test transactions</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Never invest more than you can lose</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Be skeptical of unsolicited recommendations</li>
            </ul>
          </section>

          {/* RESOURCES */}
          <section id="faq" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Frequently Asked Questions</h2>
            <p className="text-[#9FA6A3] mb-6">
              Find answers to the most common questions about PHBT.
            </p>
            
            <div className="space-y-4">
              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-2">Why would anyone use PHBT with a 50% tax?</h4>
                <p className="text-sm text-[#5F6A6E]">
                  The tax only applies if you sell at a loss. Profitable sells have no extra tax. The tax discourages panic selling and funds ecosystem growth. Diamond hands are rewarded, paper hands pay the price.
                </p>
              </div>
              
              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-2">Can I avoid the tax?</h4>
                <p className="text-sm text-[#5F6A6E]">
                  On phbt.fun, no. The tax is enforced by the smart contract. Trading on external DEXs after migration does not have the tax enforced, but you miss out on the PHBT ecosystem benefits.
                </p>
              </div>

              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-2">What happens to the tax?</h4>
                <p className="text-sm text-[#5F6A6E]">
                  All tax revenue goes to the treasury. These funds are used for token buybacks, liquidity support, ecosystem incentives, and platform development.
                </p>
              </div>
              
              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-2">When does migration happen?</h4>
                <p className="text-sm text-[#5F6A6E]">
                  Migration triggers automatically when the bonding curve reaches the graduation threshold. The exact threshold is configured per token and visible on the token page.
                </p>
              </div>
              
              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-2">Is PHBT a rug pull?</h4>
                <p className="text-sm text-[#5F6A6E]">
                  No. All tokens have mint/freeze authority revoked at creation. Liquidity is in program-controlled vaults. No one can mint new tokens or run away with the liquidity.
                </p>
              </div>

              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-2">How is cost basis calculated?</h4>
                <p className="text-sm text-[#5F6A6E]">
                  Cost basis is the weighted average of all your purchases. Total SOL Spent / Total Tokens Bought = Cost Basis. It updates with each buy.
                </p>
              </div>

              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-2">What if I receive tokens via transfer?</h4>
                <p className="text-sm text-[#5F6A6E]">
                  Transferred tokens do not affect your cost basis. Only actual purchases through the PHBT contract count. This means transferred tokens have a cost basis of 0 for tax purposes.
                </p>
              </div>

              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-2">What wallets are supported?</h4>
                <p className="text-sm text-[#5F6A6E]">
                  PHBT supports all Solana wallets that implement the Wallet Standard, including Phantom, Solflare, Backpack, Coinbase Wallet, and Ledger (via Phantom).
                </p>
              </div>

              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-2">How much does it cost to create a token?</h4>
                <p className="text-sm text-[#5F6A6E]">
                  Token creation costs 0.02 SOL. This covers account rent and transaction fees. The token goes live immediately after creation.
                </p>
              </div>

              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-2">Can I change my token after creation?</h4>
                <p className="text-sm text-[#5F6A6E]">
                  No. Token name, symbol, image, and description are immutable after creation. Choose carefully before launching.
                </p>
              </div>

              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-2">Why are my profile stats showing zero?</h4>
                <p className="text-sm text-[#5F6A6E]">
                  Stats need to be synced. Click the "Scan Wallet" button on your profile page to analyze your on-chain activity and update your stats.
                </p>
              </div>

              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-2">What is the PHBI leaderboard?</h4>
                <p className="text-sm text-[#5F6A6E]">
                  PHBI (Paper Hand Bitch Index) is a leaderboard ranking wallets by total Paper Hand Tax paid. It is a hall of shame for paper hands.
                </p>
              </div>

              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-2">What is slippage?</h4>
                <p className="text-sm text-[#5F6A6E]">
                  Slippage is the difference between the expected price and the executed price. Higher slippage tolerance allows trades to execute even if the price moves, but may result in worse prices.
                </p>
              </div>

              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-2">How do I install the PWA?</h4>
                <p className="text-sm text-[#5F6A6E]">
                  Click the "Install App" button in the header (if available). On iOS, use the Share menu and tap "Add to Home Screen".
                </p>
              </div>

              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-2">Are there secret achievements?</h4>
                <p className="text-sm text-[#5F6A6E]">
                  Yes! There are 24+ hidden achievements. They are shown with a lock icon until unlocked. Try different activities to discover them.
                </p>
              </div>
            </div>
          </section>

          <section id="glossary" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Glossary</h2>
            <p className="text-[#9FA6A3] mb-6">
              Common terms and definitions used throughout PHBT and DeFi in general.
            </p>
            
            <div className="space-y-3">
              <div className="border-b border-[#2A3338] pb-3">
                <h4 className="font-semibold text-[#E9E1D8]">AMM (Automated Market Maker)</h4>
                <p className="text-sm text-[#5F6A6E]">A decentralized exchange protocol that uses mathematical formulas to determine asset prices instead of order books. AMMs allow anyone to trade at any time by interacting with liquidity pools.</p>
              </div>
              <div className="border-b border-[#2A3338] pb-3">
                <h4 className="font-semibold text-[#E9E1D8]">Anchor</h4>
                <p className="text-sm text-[#5F6A6E]">A framework for Solana program (smart contract) development. Provides type safety, automatic account validation, and other security features.</p>
              </div>
              <div className="border-b border-[#2A3338] pb-3">
                <h4 className="font-semibold text-[#E9E1D8]">Bonding Curve</h4>
                <p className="text-sm text-[#5F6A6E]">A mathematical curve that defines the relationship between token price and supply. As more tokens are bought, the price increases along the curve, and vice versa.</p>
              </div>
              <div className="border-b border-[#2A3338] pb-3">
                <h4 className="font-semibold text-[#E9E1D8]">Cost Basis</h4>
                <p className="text-sm text-[#5F6A6E]">Your average purchase price per token. Calculated as Total SOL Spent / Total Tokens Bought. Used to determine if you are selling at a profit or loss.</p>
              </div>
              <div className="border-b border-[#2A3338] pb-3">
                <h4 className="font-semibold text-[#E9E1D8]">DEX (Decentralized Exchange)</h4>
                <p className="text-sm text-[#5F6A6E]">A cryptocurrency exchange that operates without a central authority. Users trade directly with each other through smart contracts.</p>
              </div>
              <div className="border-b border-[#2A3338] pb-3">
                <h4 className="font-semibold text-[#E9E1D8]">Diamond Hands</h4>
                <p className="text-sm text-[#5F6A6E]">Slang for holding an investment through volatility without selling. In PHBT, diamond hands sell at profit and pay no tax.</p>
              </div>
              <div className="border-b border-[#2A3338] pb-3">
                <h4 className="font-semibold text-[#E9E1D8]">DYOR (Do Your Own Research)</h4>
                <p className="text-sm text-[#5F6A6E]">A common phrase in crypto meaning you should investigate before investing rather than blindly following others.</p>
              </div>
              <div className="border-b border-[#2A3338] pb-3">
                <h4 className="font-semibold text-[#E9E1D8]">Freeze Authority</h4>
                <p className="text-sm text-[#5F6A6E]">SPL token permission that allows freezing token accounts. Revoked on PHBT tokens to prevent abuse.</p>
              </div>
              <div className="border-b border-[#2A3338] pb-3">
                <h4 className="font-semibold text-[#E9E1D8]">Graduation</h4>
                <p className="text-sm text-[#5F6A6E]">The process of a token migrating from bonding curve to AMM pool when it reaches the threshold. Unlocks full liquidity and external DEX trading.</p>
              </div>
              <div className="border-b border-[#2A3338] pb-3">
                <h4 className="font-semibold text-[#E9E1D8]">Liquidity</h4>
                <p className="text-sm text-[#5F6A6E]">The ease with which an asset can be bought or sold. High liquidity means low slippage and better trading conditions.</p>
              </div>
              <div className="border-b border-[#2A3338] pb-3">
                <h4 className="font-semibold text-[#E9E1D8]">LP Tokens</h4>
                <p className="text-sm text-[#5F6A6E]">Liquidity Provider tokens. Represent ownership of liquidity in an AMM pool. Can be redeemed for the underlying assets.</p>
              </div>
              <div className="border-b border-[#2A3338] pb-3">
                <h4 className="font-semibold text-[#E9E1D8]">Metaplex</h4>
                <p className="text-sm text-[#5F6A6E]">A protocol on Solana for creating and managing digital assets (NFTs and fungible tokens). PHBT uses Metaplex Token Metadata program.</p>
              </div>
              <div className="border-b border-[#2A3338] pb-3">
                <h4 className="font-semibold text-[#E9E1D8]">Mint Authority</h4>
                <p className="text-sm text-[#5F6A6E]">SPL token permission that allows creating new tokens. Revoked on PHBT tokens to fix supply permanently.</p>
              </div>
              <div className="border-b border-[#2A3338] pb-3">
                <h4 className="font-semibold text-[#E9E1D8]">Paper Hands</h4>
                <p className="text-sm text-[#5F6A6E]">Slang for selling an investment at a loss out of fear. In PHBT, paper hands pay 50% tax on their sale.</p>
              </div>
              <div className="border-b border-[#2A3338] pb-3">
                <h4 className="font-semibold text-[#E9E1D8]">PDA (Program Derived Address)</h4>
                <p className="text-sm text-[#5F6A6E]">An account address deterministically derived from seeds and a program ID. Used for storing program state.</p>
              </div>
              <div className="border-b border-[#2A3338] pb-3">
                <h4 className="font-semibold text-[#E9E1D8]">PHBI (Paper Hand Bitch Index)</h4>
                <p className="text-sm text-[#5F6A6E]">Leaderboard ranking wallets by total Paper Hand Tax paid. A hall of shame for paper hands.</p>
              </div>
              <div className="border-b border-[#2A3338] pb-3">
                <h4 className="font-semibold text-[#E9E1D8]">PWA (Progressive Web App)</h4>
                <p className="text-sm text-[#5F6A6E]">A website that can be installed like a native app. PHBT supports PWA installation on mobile and desktop.</p>
              </div>
              <div className="border-b border-[#2A3338] pb-3">
                <h4 className="font-semibold text-[#E9E1D8]">RPC (Remote Procedure Call)</h4>
                <p className="text-sm text-[#5F6A6E]">A protocol for communicating with blockchain nodes. RPC endpoints are used to read data and submit transactions.</p>
              </div>
              <div className="border-b border-[#2A3338] pb-3">
                <h4 className="font-semibold text-[#E9E1D8]">Slippage</h4>
                <p className="text-sm text-[#5F6A6E]">The difference between expected and executed price. Caused by price movement between order placement and execution.</p>
              </div>
              <div className="border-b border-[#2A3338] pb-3">
                <h4 className="font-semibold text-[#E9E1D8]">SPL Token</h4>
                <p className="text-sm text-[#5F6A6E]">Solana Program Library token standard. The standard for fungible and non-fungible tokens on Solana.</p>
              </div>
              <div className="border-b border-[#2A3338] pb-3">
                <h4 className="font-semibold text-[#E9E1D8]">Treasury</h4>
                <p className="text-sm text-[#5F6A6E]">Program-controlled vault that collects Paper Hand Tax revenue. Funds ecosystem growth through buybacks and incentives.</p>
              </div>
              <div>
                <h4 className="font-semibold text-[#E9E1D8]">Whale</h4>
                <p className="text-sm text-[#5F6A6E]">A trader or wallet holding a very large amount of tokens. Whale activity can significantly impact prices.</p>
              </div>
            </div>
          </section>

          <section id="troubleshooting" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Troubleshooting</h2>
            <p className="text-[#9FA6A3] mb-6">
              Common issues and how to resolve them.
            </p>
            
            <div className="space-y-4">
              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-2">Transaction Failed</h4>
                <p className="text-sm text-[#5F6A6E] mb-2">
                  If your transaction fails, try these steps:
                </p>
                <ul className="text-sm text-[#5F6A6E] list-disc list-inside">
                  <li>Increase slippage tolerance</li>
                  <li>Ensure you have enough SOL for fees</li>
                  <li>Wait and try again (network congestion)</li>
                  <li>Refresh the page and reconnect wallet</li>
                </ul>
              </div>

              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-2">Wallet Not Connecting</h4>
                <p className="text-sm text-[#5F6A6E] mb-2">
                  If your wallet is not connecting:
                </p>
                <ul className="text-sm text-[#5F6A6E] list-disc list-inside">
                  <li>Make sure wallet extension is installed and unlocked</li>
                  <li>Try refreshing the page</li>
                  <li>Clear browser cache and cookies</li>
                  <li>Try a different browser</li>
                  <li>Disable conflicting browser extensions</li>
                </ul>
              </div>

              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-2">Tokens Not Showing</h4>
                <p className="text-sm text-[#5F6A6E] mb-2">
                  If your tokens are not appearing:
                </p>
                <ul className="text-sm text-[#5F6A6E] list-disc list-inside">
                  <li>Wait for transaction to confirm (check Solscan)</li>
                  <li>Refresh the page</li>
                  <li>Check your wallet app for token balance</li>
                  <li>Token list may take time to update</li>
                </ul>
              </div>

              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-2">Profile Stats Wrong/Missing</h4>
                <p className="text-sm text-[#5F6A6E] mb-2">
                  If your profile stats are incorrect:
                </p>
                <ul className="text-sm text-[#5F6A6E] list-disc list-inside">
                  <li>Click the "Scan Wallet" button to resync</li>
                  <li>Wait for the scan to complete</li>
                  <li>Stats update from on-chain data</li>
                </ul>
              </div>

              <div className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338]">
                <h4 className="font-semibold text-[#E9E1D8] mb-2">Page Not Loading</h4>
                <p className="text-sm text-[#5F6A6E] mb-2">
                  If pages are not loading:
                </p>
                <ul className="text-sm text-[#5F6A6E] list-disc list-inside">
                  <li>Check your internet connection</li>
                  <li>Try hard refresh (Ctrl+Shift+R / Cmd+Shift+R)</li>
                  <li>Clear browser cache</li>
                  <li>Try incognito/private browsing mode</li>
                </ul>
              </div>
            </div>
          </section>

          <section id="support" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Support</h2>
            <p className="text-[#9FA6A3] mb-4">Need help? Reach out through these channels:</p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <a 
                href="https://x.com/PHBTax" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338] hover:border-[#8C3A32] transition-colors flex items-center gap-3"
              >
                <Twitter className="w-6 h-6 text-blue-400" />
                <div>
                  <h4 className="font-semibold text-[#E9E1D8]">X (Twitter)</h4>
                  <p className="text-sm text-[#5F6A6E]">@PHBTax</p>
                </div>
              </a>
              <a 
                href="https://github.com/phbt" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-[#1A2428] rounded-lg p-4 border border-[#2A3338] hover:border-[#8C3A32] transition-colors flex items-center gap-3"
              >
                <Github className="w-6 h-6 text-[#E9E1D8]" />
                <div>
                  <h4 className="font-semibold text-[#E9E1D8]">GitHub</h4>
                  <p className="text-sm text-[#5F6A6E]">Report issues & contribute</p>
                </div>
              </a>
            </div>
          </section>

          <section id="community" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Community</h2>
            <p className="text-[#9FA6A3] mb-4">
              Join the PHBT community to stay updated, share feedback, and connect with other traders.
            </p>
            
            <h3 className="text-lg font-semibold text-[#E9E1D8] mb-3">Where to Find Us</h3>
            <ul className="space-y-2 text-[#9FA6A3]">
              <li className="flex items-center gap-2"><Twitter className="w-4 h-4 text-blue-400" /> Follow @PHBTax on X for updates</li>
              <li className="flex items-center gap-2"><MessageCircle className="w-4 h-4 text-blue-400" /> Join community discussions</li>
              <li className="flex items-center gap-2"><Github className="w-4 h-4 text-[#E9E1D8]" /> Contribute on GitHub</li>
            </ul>
          </section>

          <section id="links" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-bold text-[#E9E1D8] mb-5">Useful Links</h2>
            <p className="text-[#9FA6A3] mb-4">
              Helpful external resources for Solana development and trading.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-[#2A3338]">
                <span className="text-[#E9E1D8]">Solana Explorer (Solscan)</span>
                <a href="https://solscan.io" target="_blank" rel="noopener noreferrer" className="text-[#8C3A32] hover:underline flex items-center gap-1">
                  solscan.io <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#2A3338]">
                <span className="text-[#E9E1D8]">Solana Status</span>
                <a href="https://status.solana.com" target="_blank" rel="noopener noreferrer" className="text-[#8C3A32] hover:underline flex items-center gap-1">
                  status.solana.com <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#2A3338]">
                <span className="text-[#E9E1D8]">Phantom Wallet</span>
                <a href="https://phantom.app" target="_blank" rel="noopener noreferrer" className="text-[#8C3A32] hover:underline flex items-center gap-1">
                  phantom.app <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#2A3338]">
                <span className="text-[#E9E1D8]">Solflare Wallet</span>
                <a href="https://solflare.com" target="_blank" rel="noopener noreferrer" className="text-[#8C3A32] hover:underline flex items-center gap-1">
                  solflare.com <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-[#E9E1D8]">PHBT on X</span>
                <a href="https://x.com/PHBTax" target="_blank" rel="noopener noreferrer" className="text-[#8C3A32] hover:underline flex items-center gap-1">
                  @PHBTax <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="border-t border-[#1E2529] pt-10 mt-16">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4 text-sm text-[#5F6A6E]">
                <span>Last updated: December 2024</span>
                <span className="hidden sm:block">•</span>
                <span className="hidden sm:block">PHBT Documentation</span>
              </div>
              <Link 
                href="/" 
                className="inline-flex items-center gap-2 text-sm text-[#8C3A32] hover:text-[#D4574A] transition-colors group"
              >
                <span>Back to App</span>
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
