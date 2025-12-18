import {
  LucideIcon,
  Home,
  Target,
  UserPlus,
  ShieldUser,
  Building,
  FileText,
  Package,
  Calendar,
  CheckSquare,
  Users,
  Settings,
  Activity,
  Dices,
  Cog,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: number | string;
  description?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const navigationSections: NavSection[] = [
  {
    title: "Core Views",
    items: [
      {
        title: "Dashboard",
        href: "/",
        icon: Home,
        description: "Overview & insights",
      },
      {
        title: "Pipeline",
        href: "/pipeline",
        icon: Target,
        description: "Sales pipeline & deals",
      },
      {
        title: "Leads",
        href: "/leads",
        icon: UserPlus,
        description: "Prospect management",
      },
      {
        title: "Companies",
        href: "/companies",
        icon: Building,
        description: "Companies & organizations",
      },
    ],
  },
  {
    title: "Sales & Revenue",
    items: [
      {
        title: "Quotes",
        href: "/quotes",
        icon: FileText,
        description: "Proposal generation",
      },
      {
        title: "Invoices",
        href: "/invoices",
        icon: FileText,
        description: "Billing & payments",
      },
      {
        title: "Products",
        href: "/products",
        icon: Package,
        description: "Catalog management",
      },
    ],
  },
  {
    title: "Activity Management",
    items: [
      {
        title: "Tasks",
        href: "/tasks",
        icon: CheckSquare,
        description: "Task management",
      },
      {
        title: "Activities",
        href: "/activities",
        icon: Activity,
        description: "Timeline & history",
      },
      {
        title: "Raffles",
        href: "/raffles",
        icon: Dices,
        description: "Raffle management",
      },
    ],
  },
  {
    title: "User Management",
    items: [
      {
        title: "Users",
        href: "/users",
        icon: Users,
        description: "User management",
      },
      {
        title: "Roles",
        href: "/roles",
        icon: ShieldUser,
        description: "Role management",
      },
    ],
  },
  // {
  //   title: "Communication",
  //   items: [
  //     {
  //       title: "Email",
  //       href: "/email",
  //       icon: Mail,
  //       description: "Email integration",
  //     },
  //     {
  //       title: "Messages",
  //       href: "/messages",
  //       icon: MessageSquare,
  //       description: "Internal chat",
  //     },
  //     {
  //       title: "Calls",
  //       href: "/calls",
  //       icon: Phone,
  //       description: "Call logging",
  //     },
  //     {
  //       title: "Campaigns",
  //       href: "/campaigns",
  //       icon: Megaphone,
  //       description: "Marketing campaigns",
  //     },
  //   ],
  // },
  // {
  //   title: "Analytics & Reports",
  //   items: [
  //     {
  //       title: "Insights",
  //       href: "/insights",
  //       icon: Zap,
  //       description: "Business intelligence",
  //     },
  //     {
  //       title: "Goals",
  //       href: "/goals",
  //       icon: Target,
  //       description: "KPI tracking",
  //     },
  //     {
  //       title: "Reports",
  //       href: "/reports",
  //       icon: BarChart3,
  //       description: "Custom reports",
  //     },
  //     {
  //       title: "Forecast",
  //       href: "/pipeline/forecast",
  //       icon: PieChart,
  //       description: "Revenue prediction",
  //     },
  //   ],
  // },
  {
    title: "System Management",
    items: [
      // {
      //   title: "Segments",
      //   href: "/segments",
      //   icon: UserCheck,
      //   description: "Customer groups",
      // },
      // {
      //   title: "Subscriptions",
      //   href: "/subscriptions",
      //   icon: CreditCard,
      //   description: "Recurring billing",
      // },
      // {
      //   title: "Import",
      //   href: "/import",
      //   icon: Upload,
      //   description: "Data import",
      // },
      // {
      //   title: "Export",
      //   href: "/export",
      //   icon: Download,
      //   description: "Data export",
      // },
      // {
      //   title: "Integrations",
      //   href: "/integrations",
      //   icon: Puzzle,
      //   description: "Third-party apps",
      // },
      {
        title: "Settings",
        href: "/settings",
        icon: Settings,
        description: "System config",
      },
      {
        title: "Payment Terms",
        href: "/settings/payment-terms",
        icon: Cog,
        description: "payment terms config",
      },
    ],
  },
];
