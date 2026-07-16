/**
 * ============================================================================
 * VERTICAL CONFIG — the single source of truth for everything that changes
 * when this app is forked to a new home-service vertical (kitchen remodel,
 * bathroom, patio/hardscaping, roofing, etc).
 *
 * Landing page, submit wizard, emails, contractor dashboard, and PWA
 * manifest all pull their copy, service list, and question schema from
 * this file. There should be zero vertical-specific strings (like "tree")
 * hardcoded anywhere else in the app.
 *
 * See FORKING.md for the step-by-step guide to forking this to a new
 * vertical.
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// Details-step question schema — typed field definitions
// ---------------------------------------------------------------------------

export interface FieldOption {
  value: string;
  label: string;
}

interface DetailFieldBase {
  /** Key this field is stored under in the lead's `details` object */
  key: string;
  label: string;
  helpText?: string;
  required?: boolean;
  /** Only render this field if another field currently has a given value */
  showIf?: { key: string; equals: string };
}

export interface SelectDetailField extends DetailFieldBase {
  kind: "select";
  options: FieldOption[];
  columns?: 2 | 3 | 4;
}

export interface MultiSelectDetailField extends DetailFieldBase {
  kind: "multiselect";
  options: FieldOption[];
}

export interface CheckboxGroupDetailField extends DetailFieldBase {
  /** Group of independent boolean checkboxes, e.g. site conditions */
  kind: "checkbox-group";
  options: FieldOption[];
}

export interface CheckboxDetailField extends DetailFieldBase {
  /** A single boolean toggle */
  kind: "checkbox";
}

export interface TextDetailField extends DetailFieldBase {
  kind: "text" | "textarea";
  placeholder?: string;
}

export interface NumberDetailField extends DetailFieldBase {
  kind: "number";
  min?: number;
  max?: number;
  placeholder?: string;
}

export type DetailField =
  | SelectDetailField
  | MultiSelectDetailField
  | CheckboxGroupDetailField
  | CheckboxDetailField
  | TextDetailField
  | NumberDetailField;

// ---------------------------------------------------------------------------
// Service types
// ---------------------------------------------------------------------------

export interface ServiceTypeConfig {
  id: string;
  label: string;
  description: string;
  /** Emoji used as a lightweight icon — no icon library dependency needed */
  icon: string;
  /** Lead price contractors pay to unlock a lead requesting this service */
  leadPriceCents: number;
}

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

export interface ThemeConfig {
  /** Primary brand color (hex) — drives buttons, links, active states */
  primary: string;
  primaryDark: string;
  primaryLight: string;
  /** Secondary accent color — used for contractor-facing CTAs & highlights */
  accent: string;
  accentDark: string;
  accentLight: string;
}

// ---------------------------------------------------------------------------
// Full site config
// ---------------------------------------------------------------------------

export interface SiteConfig {
  brand: {
    name: string;
    shortName: string;
    emoji: string;
    tagline: string;
    domain: string;
    supportEmail: string;
    /** City/region shown in social proof copy — edit per market */
    region: string;
  };

  theme: ThemeConfig;

  hero: {
    badgeText: string;
    titleLines: string[];
    highlightLine: string;
    subtitle: string;
    ctaLabel: string;
    secondaryCtaLabel: string;
    heroImageUrl: string;
    heroImageCaption: string;
  };

  howItWorksCustomer: { icon: string; title: string; desc: string }[];

  trustSignals: { label: string; desc: string }[];

  customerBanner: {
    title: string;
    subtitle: string;
    ctaLabel: string;
  };

  /** Emotional-benefit cards shown on the landing page — the "why this matters" hooks. */
  emotionalBenefits: { icon: string; title: string; desc: string }[];

  /** Small reassurance/urgency copy woven into the submit wizard. */
  wizardMicrocopy: {
    reviewReassurance: string;
    /** Shown at the very top of the wizard (Photos step) — sets expectations up front. */
    momentumLine: string;
    /** Shown on the Contact step — reassures before asking for personal info. */
    contactTrustLine: string;
  };

  contractorPitch: {
    badgeText: string;
    title: string;
    subtitle: string;
    steps: { icon: string; title: string; desc: string }[];
    benefits: { icon: string; title: string; desc: string }[];
    pricingHeadline: string;
    pricingSubtitle: string;
    pricingFeatures: string[];
    ctaLabel: string;
    foundingCalloutTitle: string;
    foundingCalloutDesc: string;
  };

  socialProof: {
    headline: string;
    statLine: string;
  };

  footer: {
    copyrightName: string;
    links: { label: string; href: string }[];
  };

  /** Item type submitted by the customer (used in copy like "Upload photos of the ___") */
  itemNounSingular: string;
  itemNounPlural: string;

  serviceTypes: ServiceTypeConfig[];

  /** Config-driven schema for the "Details" step of the submit wizard */
  detailFields: DetailField[];

  /** Default lead price if a service type doesn't specify its own */
  defaultLeadPriceCents: number;

  /** Max number of contractors who can unlock (pay for) a single lead */
  maxContractorsPerLead: number;

  emailCopy: {
    fromName: string;
    fromEmail: string;
    alertsFromEmail: string;
    replyToEmail: string;
    contractorApplicationSubject: string;
    contractorApprovedSubject: string;
    customerConfirmationSubject: string;
    leadAlertSubjectPrefix: string;
    customerAccountCtaLabel: string;
    customerAccountCtaSubtitle: string;
    quoteReceivedSubject: string;
    quoteAcceptedSubject: string;
    adminNewLeadSubjectPrefix: string;
    /** Shown on /submitted when the customer gave an email and the app has a real backend configured. */
    submittedEmailConfirmationLine: string;
    /** Shown on /submitted otherwise (no email given, or zero-env-keys demo mode where no email can actually be sent). */
    submittedNoEmailLine: string;
  };

  features: {
    /** GPT-4o photo analysis. Off by default for the MVP lead-gen flow. */
    aiAnalysis: boolean;
    /** AI-generated customer price estimate — depends on aiAnalysis. */
    priceEstimate: boolean;
  };

  pwa: {
    name: string;
    shortName: string;
    description: string;
    themeColor: string;
    backgroundColor: string;
  };
}

// ---------------------------------------------------------------------------
// THE CONFIG — tree service vertical (default)
// ---------------------------------------------------------------------------

export const siteConfig: SiteConfig = {
  brand: {
    name: "TreeQuote",
    shortName: "TreeQuote",
    emoji: "🌳",
    tagline: "Get quotes from local tree pros in minutes.",
    domain: "treequote.app",
    supportEmail: "mike@mtkinnovations.com",
    region: "Georgia",
  },

  theme: {
    primary: "#16A34A",
    primaryDark: "#15803D",
    primaryLight: "#DCFCE7",
    accent: "#F59E0B",
    accentDark: "#D97706",
    accentLight: "#FEF3C7",
  },

  hero: {
    badgeText: "trees serviced — Quotes in 24h or less",
    titleLines: ["Trees need work?"],
    highlightLine: "Get quotes from local pros",
    subtitle:
      "Tell us about your tree project and a few photos. Local contractors compete for your job. No obligation. No cost to you.",
    ctaLabel: "Get My Free Quote",
    secondaryCtaLabel: "See How It Works",
    heroImageUrl: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1200&q=80",
    heroImageCaption: "Healthy Oak, ~40ft",
  },

  howItWorksCustomer: [
    { icon: "📸", title: "Tell Us About Your Tree", desc: "Snap a photo and answer a few quick questions about the job." },
    { icon: "📬", title: "We Notify Local Pros", desc: "Contractors in your area who match your job get notified instantly." },
    { icon: "💰", title: "Get Quotes", desc: "Local contractors review your request and submit competitive quotes. You pick the best." },
  ],

  trustSignals: [
    { label: "No Obligation", desc: "You're never locked in" },
    { label: "Quotes in 24h", desc: "Fast contractor response" },
    { label: "Local Pros", desc: "Contractors in your area" },
  ],

  customerBanner: {
    title: "How much does tree work cost?",
    subtitle: "Tell us about your job and compare quotes from local contractors — no obligation.",
    ctaLabel: "Get My Free Quote",
  },

  emotionalBenefits: [
    {
      icon: "🌙",
      title: "Sleep through the next storm",
      desc: "A weak limb or leaning trunk is a 2am phone call waiting to happen. Get it handled before the weather does it for you.",
    },
    {
      icon: "☀️",
      title: "Get your yard back",
      desc: "More light, more space, a better view — a yard you actually want to spend time in again.",
    },
    {
      icon: "🏡",
      title: "Protect your biggest investment",
      desc: "Overgrown or damaged trees can hurt your home's value and your liability. A little upkeep now avoids a much bigger bill later.",
    },
  ],

  wizardMicrocopy: {
    reviewReassurance: "You're one click from real quotes — local pros usually respond the same day.",
    momentumLine: "Takes about 2 minutes. Most of it's multiple choice.",
    contactTrustLine: "Your info only goes to pros you choose to hear from — never sold, never spammed.",
  },

  contractorPitch: {
    badgeText: "For Contractors",
    title: "Get qualified leads delivered straight to your dashboard",
    subtitle:
      "Stop chasing inbound marketing. We send you customers who already have jobs that need doing — with the details you need to quote confidently.",
    steps: [
      { icon: "📸", title: "Customer Submits Request", desc: "Homeowner tells us about their job — service type, details, location, contact info." },
      { icon: "📬", title: "You Get Notified", desc: "Matching leads in your service area hit your inbox and dashboard the moment they come in." },
      { icon: "🏢", title: "Unlock & Quote", desc: "Pay a small fee (or use a free credit) to unlock contact info and submit your quote." },
    ],
    benefits: [
      { icon: "💵", title: "Pay Per Lead", desc: "No monthly fees. Only pay when you get real business opportunities." },
      { icon: "🎯", title: "Qualified Leads", desc: "Every lead includes structured job details so you know what you're quoting before you pay." },
      { icon: "📍", title: "Local Leads Only", desc: "Set your service area. You'll only get leads from zip codes you serve." },
      { icon: "⭐", title: "Stand Out to Customers", desc: "Your quote is shown alongside competitors. Win jobs on price, approach, or availability." },
    ],
    pricingHeadline: "Simple, transparent pricing",
    pricingSubtitle: "Pay only for leads you want. No monthly commitment.",
    pricingFeatures: [
      "Structured job details included",
      "Customer contact info unlocked",
      "Up to 5 contractors compete per lead",
      "No long-term contracts",
    ],
    ctaLabel: "Apply to Join — It's Free",
    foundingCalloutTitle: "Founding contractors get free leads",
    foundingCalloutDesc:
      "The first contractors in each area get free lead credits while we grow the network. Apply now to lock in founding status.",
  },

  socialProof: {
    headline: "Trusted by homeowners across Georgia",
    statLine: "847 jobs serviced · 4.9/5 average rating",
  },

  footer: {
    copyrightName: "TreeQuote",
    links: [
      { label: "Get a Quote", href: "/submit" },
      { label: "For Contractors", href: "/contractors" },
      { label: "Contractor Login", href: "/contractor/login" },
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
    ],
  },

  itemNounSingular: "tree",
  itemNounPlural: "trees",

  serviceTypes: [
    { id: "removal", label: "Tree Removal", description: "Full removal of a tree, trunk and all.", icon: "🪓", leadPriceCents: 1500 },
    { id: "trimming", label: "Trimming / Pruning", description: "Shaping, deadwooding, or canopy thinning.", icon: "✂️", leadPriceCents: 500 },
    { id: "stump", label: "Stump Grinding", description: "Grinding down a stump left behind after removal.", icon: "⚙️", leadPriceCents: 800 },
    { id: "palm", label: "Palm Cleaning", description: "Trimming dead fronds and fruit from palms.", icon: "🌴", leadPriceCents: 700 },
    { id: "other", label: "Other", description: "Something else tree-related.", icon: "❓", leadPriceCents: 1000 },
  ],

  detailFields: [
    {
      key: "height",
      label: "Approximate tree height",
      kind: "select",
      required: true,
      columns: 2,
      options: [
        { value: "under_20", label: "Under 20 ft" },
        { value: "20_40", label: "20–40 ft" },
        { value: "40_60", label: "40–60 ft" },
        { value: "over_60", label: "Over 60 ft" },
        { value: "not_sure", label: "Not sure" },
      ],
    },
    {
      key: "treeType",
      label: "Tree type",
      kind: "select",
      required: true,
      columns: 2,
      options: [
        { value: "oak", label: "Oak" },
        { value: "pine", label: "Pine" },
        { value: "maple", label: "Maple" },
        { value: "birch", label: "Birch" },
        { value: "willow", label: "Willow" },
        { value: "palm", label: "Palm" },
        { value: "other", label: "Other / Not sure" },
      ],
    },
    {
      key: "stumpSituation",
      label: "Stump situation",
      kind: "select",
      columns: 3,
      options: [
        { value: "no_stump", label: "No stump" },
        { value: "has_stump", label: "Has stump" },
        { value: "already_removed", label: "Already removed" },
      ],
    },
    {
      key: "stumpDiameter",
      label: "Stump diameter (if known)",
      kind: "select",
      columns: 4,
      showIf: { key: "stumpSituation", equals: "has_stump" },
      options: [
        { value: "under_12", label: "Under 12 in" },
        { value: "12_24", label: "12–24 in" },
        { value: "24_36", label: "24–36 in" },
        { value: "over_36", label: "Over 36 in" },
      ],
    },
    {
      key: "equipmentAccess",
      label: "Equipment access",
      kind: "select",
      columns: 2,
      options: [
        { value: "wide_open", label: "Wide open yard" },
        { value: "narrow", label: "Narrow passage" },
        { value: "behind_fence", label: "Behind fence" },
        { value: "crane_required", label: "Crane required" },
        { value: "not_sure", label: "Not sure" },
      ],
    },
    {
      key: "siteConditions",
      label: "Site conditions",
      kind: "checkbox-group",
      options: [
        { value: "near_fence", label: "Near fence or gate" },
        { value: "near_structure", label: "Near house or structure" },
        { value: "near_power_lines", label: "Near power lines" },
      ],
    },
    {
      key: "debris",
      label: "What to do with debris?",
      kind: "select",
      columns: 3,
      options: [
        { value: "haul_away", label: "Haul away" },
        { value: "leave_chips", label: "Leave as mulch" },
        { value: "keep_logs", label: "Keep logs" },
      ],
    },
    {
      key: "urgency",
      label: "How soon do you need this done?",
      kind: "select",
      columns: 2,
      required: true,
      options: [
        { value: "asap", label: "ASAP / Emergency" },
        { value: "this_week", label: "This week" },
        { value: "this_month", label: "This month" },
        { value: "just_researching", label: "Just researching" },
      ],
    },
    {
      key: "motivation",
      label: "What's prompting this?",
      helpText: "Optional — helps contractors understand your priorities when they quote.",
      kind: "multiselect",
      options: [
        { value: "safety", label: "Safety concern" },
        { value: "storm_damage", label: "Storm damage" },
        { value: "selling", label: "Selling the property" },
        { value: "view", label: "Improving the view" },
        { value: "neighbor", label: "Neighbor issue" },
        { value: "just_time", label: "It's just time" },
      ],
    },
    {
      key: "benefitGoal",
      label: "What will it feel like when this job's done?",
      helpText: "Optional — pick whatever fits. Helps pros understand what matters most to you.",
      kind: "multiselect",
      options: [
        { value: "stop_worrying", label: "🧘 Finally stop worrying about it" },
        { value: "family_safety", label: "🛡️ Peace of mind for my family's safety" },
        { value: "proud_space", label: "🏡 A space I'm actually proud to show off" },
        { value: "protect_value", label: "💰 Protect (or boost) my home's value" },
        { value: "todo_list", label: "✅ One less thing on my to-do list" },
        { value: "enjoy_again", label: "😌 Get to actually enjoy my yard again" },
      ],
    },
    {
      key: "notes",
      label: "Additional notes",
      kind: "textarea",
      placeholder: "Anything else contractors should know...",
    },
  ],

  defaultLeadPriceCents: 1000,
  maxContractorsPerLead: 5,

  emailCopy: {
    fromName: "TreeQuote",
    // Default fallback until a domain is verified in Resend: onboarding@resend.dev
    // is the only from-address it accepts, and it delivers ONLY to the Resend
    // account owner. To go live, verify mtkinnovations.com at resend.com/domains,
    // then set RESEND_FROM_EMAIL=quotes@mtkinnovations.com in the environment —
    // lib/email.ts and lib/notifications.ts prefer that env var over these.
    fromEmail: "onboarding@resend.dev",
    alertsFromEmail: "onboarding@resend.dev",
    replyToEmail: "miketkapp@gmail.com",
    contractorApplicationSubject: "Your TreeQuote Contractor Application — Under Review",
    contractorApprovedSubject: "You're approved! Start receiving leads today",
    customerConfirmationSubject: "We got your request! Quotes incoming within 24 hours",
    leadAlertSubjectPrefix: "New Lead",
    customerAccountCtaLabel: "Create your account to track quotes",
    customerAccountCtaSubtitle: "Save your request and check back anytime for new quotes — no need to dig up this email.",
    quoteReceivedSubject: "You got a new quote!",
    quoteAcceptedSubject: "A customer accepted your quote!",
    adminNewLeadSubjectPrefix: "New lead:",
    submittedEmailConfirmationLine:
      "📧 Confirmation email sent — check your inbox for your confirmation link and your quotes as they arrive.",
    submittedNoEmailLine: "Your request is in — track quotes at the link below.",
  },

  features: {
    aiAnalysis: false,
    priceEstimate: false,
  },

  pwa: {
    name: "TreeQuote",
    shortName: "TreeQuote",
    description: "Get quotes from local tree service pros in minutes",
    themeColor: "#16A34A",
    backgroundColor: "#F9FAFB",
  },
};

export default siteConfig;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getServiceType(id: string): ServiceTypeConfig | undefined {
  return siteConfig.serviceTypes.find((s) => s.id === id);
}

export function getLeadPriceCents(serviceTypes: string[]): number {
  if (serviceTypes.length === 0) return siteConfig.defaultLeadPriceCents;
  const prices = serviceTypes.map((id) => getServiceType(id)?.leadPriceCents ?? siteConfig.defaultLeadPriceCents);
  return Math.max(...prices);
}

/** URL/storage-safe slug derived from the brand name — used for localStorage keys, the photo storage bucket, etc. */
export const appSlug = siteConfig.brand.shortName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/** Supabase Storage bucket used for lead photo uploads */
export const photoStorageBucket = `${appSlug}-photos`;

/**
 * localStorage/cookie key for contractor demo mode. Shared between
 * `lib/demo.ts` (client-side flag + UI) and `proxy.ts` (the server-side
 * auth gate, which can only read the cookie mirror of this flag).
 */
export const demoModeKey = `${appSlug}_demo`;

/**
 * httpOnly cookie name used to gate `/admin` when `ADMIN_SECRET` is set.
 * See `proxy.ts` — visiting `/admin?key=<ADMIN_SECRET>` sets this cookie and
 * redirects to the clean `/admin` URL; without a valid cookie (and no key),
 * `/admin` 404s instead of showing a login page.
 */
export const adminCookieKey = `${appSlug}_admin`;

