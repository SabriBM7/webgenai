"use client";

import React, { useEffect, useMemo, useState } from "react";


// --- prop helpers ---
function pick<T>(obj: any, keys: string[], fallback: T): T {
    for (const k of keys) {
        if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
    }
    return fallback;
}
// =========================
// Coverage check registry
// =========================
const RENDERABLE_TYPES = new Set<string>([
  // Generic layout/content
  "ServiceMenu","GiftCardGrid","ProductSpotlight","SpaAmenities","SpecialPackages","SpaCTA",
  "MembershipPlans","FacilityAmenities","BeforeAfter","TrialPassCTA",
"EquipmentShowcase","SuccessMetrics",
  "Header","Hero","IntroSection","SplitFeature","ValueBadges","CTASection",
  "NewsletterSignup","Divider","Gallery","FeatureGrid","Stats","Steps","Team",
  "BlogList","FAQ","Contact","Footer","ProductGrid","CartSummary","CheckoutForm",
"UseCaseShowcase","SDKDownload","APIEndpoints","Changelog","SystemStatus",
"ArchitectureDiagram","SecurityBadges","ComplianceBadges","TutorialsList",
"InstallSteps","CustomersLogos",

  // Restaurant
  "PressLogos","AwardsBar","ChefBio","DishGrid","BookingCTA","ReservationForm",
  "RestaurantMenu","Hours","LocationMap","Testimonials","TestimonialHighlight",
  "SocialStrip","SpecialsCarousel","PrivateDining","Catering","WineListHighlight","MapList",

  // Tech
  "FeatureComparison","APIDocs","IntegrationGrid","DemoRequest","CodeSample",

  // Healthcare
  "InsuranceAccepted","PatientPortalCTA","ServiceTiers","TelehealthInfo","DoctorCard","AppointmentList",

  // Fitness
  "ClassSchedule","TrainerProfiles","ResultsTimeline","NutritionPlan",

  // Beauty
  "ServiceMenu","GiftCardGrid","ProductSpotlight",

  // Legal
  "PracticeAreas","CaseResults","AttorneyProfile",

  // Real Estate
  "PropertyList","PropertyMap","PropertySearch","NeighborhoodGuide","MortgageCalculator",

  // Education
  "CourseList","CourseSyllabus","CurriculumAccordion","InstructorHighlight","LearningPath",

  // E-commerce
  "ProductCarousel","SizeGuide","ShippingTiers",

  // Travel
  "DestinationGrid","ItineraryDay","SeasonalPromo",

  // Construction
  "ProjectTimeline","MaterialShowcase",

  // Automotive
  "ServicePackages","VehicleComparison",

  // Fashion
  "LookbookGallery","FitGuide",

  // Finance
  "RateTable","RetirementCalculator",

  // Non-profit
  "ImpactMeter","DonationTiers",

  // Events
  "VenueShowcase","EventTimeline",

  // Interior Design
  "StyleQuiz","RoomVisualizer",

  // Marketing
  "ClientPortfolio","ServiceProcess",

    "ServicesGrid","AppointmentScheduler","CertificationsBadges",
    "ConditionsTreated","TreatmentProcess","EmergencyNotice",

]);


function warnUnknownTypes(components: Comp[]) {
  const unknown = [...new Set(components.map(c => c.type).filter(t => !RENDERABLE_TYPES.has(t)))];
  if (unknown.length) console.warn("⚠️ Unknown component types (no renderer case):", unknown);
}

export function normalizeProps(type: string, props: any) {
  const p = props || {};

  // --- small helpers ---
  const asArray = (v: any) => (Array.isArray(v) ? v : v ? [v] : []);
  const priceStr = (v: any) =>
    typeof v === "number" ? `$${v.toFixed(2)}` : typeof v === "string" ? v : "";
  const imgObj = (v: any) =>
    typeof v === "string" ? { src: v, alt: "" } : v && typeof v === "object" ? v : { src: "", alt: "" };
  const text = (v: any, d = "") => (typeof v === "string" ? v : d);

  switch (type) {
    // -------------------- GENERIC --------------------
    case "Header": {
      // {links: string[]} OR {links: [{label,href}]} OR {navigation: [...]}
      const raw = Array.isArray(p.links) ? p.links : Array.isArray(p.navigation) ? p.navigation : [];
      const links = Array.isArray(p.links)
        ? p.links.map((l: any) =>
            typeof l === "string" ? { label: l, href: "#" } : l
          )
        : Array.isArray(p.navigation)
        ? p.navigation
        : [];
      const cta = p.cta || p.primaryCta || undefined;
      const logoText = p.logoText || p.title || "Brand";
      return { ...p, logoText, links, cta };
    }
case "ServiceMenu": {
  return { heading: p.heading || "Our Services", services: p.services || [] };
}
case "GiftCardGrid": {
  return { heading: p.heading || "Gift Cards", cards: p.cards || [] };
}
case "ProductSpotlight": {
  return { heading: p.heading || "Featured Products", items: p.items || [] };
}
case "SpaAmenities": {
  return { heading: p.heading || "Amenities", items: p.items || [] };
}
case "SpecialPackages": {
  return { heading: p.heading || "Special Packages", packages: p.packages || [] };
}
case "SpaCTA": {
  return { heading: p.heading || "Book Now", subheading: p.subheading || "", primary: p.primary };
}

    case "Hero": {
      // title/heading, subtitle/subheading, cta/primaryCta, image/alt
      const title = (globalThis as any).pick ? (globalThis as any).pick<string>(p, ["title", "heading"], "Your headline") : (p.title ?? p.heading ?? "Your headline");
      const subtitle = (globalThis as any).pick ? (globalThis as any).pick<string>(p, ["subtitle", "subheading"], "") : (p.subtitle ?? p.subheading ?? "");
      const primaryCta = p.primaryCta || p.cta || undefined;
      const image = p.image;
      const alt = p.alt || "";
      return { ...p, title, subtitle, primaryCta, image, alt };
    }
case "MembershipPlans": {
  const plans = Array.isArray(p.plans) ? p.plans : [];
  return { heading: p.heading || "Memberships", plans };
}
case "FacilityAmenities": {
  const items = Array.isArray(p.items) ? p.items : [];
  return { heading: p.heading || "Amenities", items };
}
case "BeforeAfter": {
  const items = Array.isArray(p.items) ? p.items : [];
  return { heading: p.heading || "Transformations", items };
}
case "TrialPassCTA": {
  return {
    heading: p.heading || "Try Us Free",
    subheading: p.subheading || "",
    primary: p.primary || { label: "Start Free", href: "#" },
    secondary: p.secondary,
    background: p.background, alt: p.alt || ""
  };
}
case "EquipmentShowcase": {
  const images = Array.isArray(p.images) ? p.images : [];
  return { heading: p.heading || "Our Facility", images };
}
case "SuccessMetrics": {
  const items = Array.isArray(p.items) ? p.items : [];
  return { heading: p.heading || "Results That Matter", items };
}

case "IntroSection": {
  const heading = p.heading ?? p.title ?? "";
  const text = p.text ?? p.description ?? p.copy ?? "";
  const image = p.image ?? p.imageUrl ?? "";
  const cta = p.cta ?? p.primaryCta ?? undefined;
  return { ...p, heading, text, image, cta };
}

case "SplitFeature": {
  // left/right blocks, each: {heading,text,image?,cta?}
  const left  = p.left  ?? {};
  const right = p.right ?? {};
  const normalize = (b:any) => ({
    heading: b.heading ?? b.title ?? "",
    text: b.text ?? b.copy ?? "",
    image: b.image ?? b.imageUrl ?? "",
    cta: b.cta ?? b.primaryCta ?? undefined,
  });
  return { ...p, left: normalize(left), right: normalize(right) };
}
case "ServicesGrid": {
  const items = Array.isArray(p.items) ? p.items : [];
  return { heading: p.heading || "Our Services", items };
}

case "AppointmentScheduler": {
  const fields = Array.isArray(p.fields) ? p.fields : ["name","email","phone","date","time","reason"];
  return { heading: p.heading || "Appointment Request", fields, submitLabel: p.submitLabel || "Request Appointment" };
}

case "CertificationsBadges": {
  const items = Array.isArray(p.items)
    ? p.items.map((it: any) => (typeof it === "string" ? { label: it } : it))
    : [];
  return { heading: p.heading || "Certifications", items };
}

case "ConditionsTreated": {
  const items = Array.isArray(p.items) ? p.items : [];
  return { heading: p.heading || "Conditions We Treat", items };
}

case "TreatmentProcess": {
  const steps = Array.isArray(p.steps) ? p.steps : [];
  return { heading: p.heading || "Your Care Journey", steps };
}

case "EmergencyNotice": {
  return { heading: p.heading || "Important", text: p.text || "", severity: p.severity || "warning" };
}

case "ValueBadges": {
  // {items:[{icon?,label?,text?}]}
  const items = Array.isArray(p.items) ? p.items.map((it:any)=>({
    icon: it.icon ?? "",
    label: it.label ?? it.title ?? "",
    text: it.text ?? it.desc ?? "",
  })) : [];
  const heading = p.heading ?? p.title ?? "";
  return { ...p, heading, items };
}

case "CTASection": {
  const heading = p.heading ?? p.title ?? "";
  const subheading = p.subheading ?? p.text ?? p.description ?? "";
  const primary = p.primary ?? p.cta ?? p.primaryCta ?? undefined;
  const secondary = p.secondary ?? p.secondaryCta ?? undefined;
  const background = p.background ?? p.image ?? p.imageUrl ?? "";
  return { ...p, heading, subheading, primary, secondary, background };
}

case "NewsletterSignup": {
  // {heading, subheading?, placeholder?, submitLabel?}
  return {
    heading: p.heading ?? "Stay in the loop",
    subheading: p.subheading ?? p.text ?? "",
    placeholder: p.placeholder ?? "you@example.com",
    submitLabel: p.submitLabel ?? "Subscribe",
  };
}
case "UseCaseShowcase": {
  const items = Array.isArray(p.items) ? p.items : [];
  return {
    heading: p.heading || "Use cases",
    items: items.map((x:any)=>({
      title: x.title || "",
      desc: x.desc || x.description || "",
      image: x.image || "",
      href: x.href || "#"
    }))
  };
}
case "SDKDownload": {
  return {
    heading: p.heading || "Download SDK",
    languages: Array.isArray(p.languages) ? p.languages : [],
    installCommands: Array.isArray(p.installCommands) ? p.installCommands : [],
    cta: p.cta || undefined
  };
}
case "APIEndpoints": {
  return {
    heading: p.heading || "API Endpoints",
    endpoints: Array.isArray(p.endpoints) ? p.endpoints : []
  };
}
case "Changelog": {
  return {
    heading: p.heading || "Changelog",
    entries: Array.isArray(p.entries) ? p.entries : []
  };
}
case "SystemStatus": {
  return {
    heading: p.heading || "System status",
    lastUpdated: p.lastUpdated || "",
    services: Array.isArray(p.services) ? p.services : []
  };
}
case "ArchitectureDiagram": {
  return {
    heading: p.heading || "Architecture",
    image: p.image || p.src || "",
    alt: p.alt || "",
    caption: p.caption || ""
  };
}
case "SecurityBadges": {
  const badges = Array.isArray(p.badges) ? p.badges : [];
  return { heading: p.heading || "Security", badges };
}
case "ComplianceBadges": {
  const items = Array.isArray(p.items) ? p.items : [];
  return { heading: p.heading || "Compliance", items };
}
case "TutorialsList": {
  const items = Array.isArray(p.items) ? p.items : [];
  return { heading: p.heading || "Tutorials", items };
}
case "InstallSteps": {
  const steps = Array.isArray(p.steps) ? p.steps : [];
  return { heading: p.heading || "Install", steps };
}
case "CustomersLogos": {
  const logos = Array.isArray(p.logos) ? p.logos : [];
  return { heading: p.heading || "Trusted by teams", logos };
}

case "Divider": {
  // simple visual break; accept {label} or {heading}
  const label = p.label ?? p.heading ?? "";
  return { label };
}

case "PressLogos": {
  // already added in your snippet but keeping for completeness
  const logos = Array.isArray(p.logos)
    ? p.logos.map((x:any)=>({ src: x.src ?? x, alt: x.alt ?? "" }))
    : Array.isArray(p.items)
    ? p.items.map((x:any)=>({ src: x.src ?? x, alt: x.alt ?? "" }))
    : [];
  const heading = p.heading || p.title || "";
  return { ...p, heading, logos };
}

case "SpecialsCarousel": {
  // {items:[{title,desc?,price?,image?}]} + optional heading
  const items = Array.isArray(p.items) ? p.items.map((it:any)=>({
    title: it.title ?? it.name ?? "",
    desc: it.desc ?? it.description ?? "",
    price: typeof it.price === "number" ? `$${it.price.toFixed(2)}` : (it.price ?? ""),
    image: it.image ?? it.imageUrl ?? "",
  })) : [];
  const heading = p.heading ?? p.title ?? "Seasonal Specials";
  return { ...p, heading, items };
}

case "PrivateDining": {
  // {heading, text, features?, image?, cta?}
  return {
    heading: p.heading ?? "Private Dining",
    text: p.text ?? p.description ?? "",
    features: Array.isArray(p.features) ? p.features : [],
    image: p.image ?? p.imageUrl ?? "",
    cta: p.cta ?? p.primaryCta ?? undefined,
  };
}

case "Catering": {
  // {heading, text, tiers?:[{name,price,features[]}] , image?, cta?}
  return {
    heading: p.heading ?? "Catering Services",
    text: p.text ?? p.description ?? "",
    tiers: Array.isArray(p.tiers) ? p.tiers : [],
    image: p.image ?? p.imageUrl ?? "",
    cta: p.cta ?? p.primaryCta ?? undefined,
  };
}

case "WineListHighlight": {
  // {heading, items:[{name,region?,year?,price?}], image?}
  const items = Array.isArray(p.items) ? p.items.map((w:any)=>({
    name: w.name ?? "",
    region: w.region ?? "",
    year: w.year ?? "",
    price: w.price ?? "",
  })) : [];
  const heading = p.heading ?? "Wine List Highlights";
  const image = p.image ?? p.imageUrl ?? "";
  return { ...p, heading, items, image };
}

case "MapList": {
  // {heading, locations:[{name,address,lat,lng}], mapCenter?}
  const locations = Array.isArray(p.locations) ? p.locations.map((loc:any)=>({
    name: loc.name ?? "",
    address: loc.address ?? "",
    lat: typeof loc.lat === "number" ? loc.lat : undefined,
    lng: typeof loc.lng === "number" ? loc.lng : undefined,
  })) : [];
  const heading = p.heading ?? "Locations";
  return { ...p, heading, locations, mapCenter: p.mapCenter ?? undefined };
}

case "FAQ": {
  const items = Array.isArray(p.items)
    ? p.items.map((it: any) => ({
        q: it.q ?? it.question ?? "",
        a: it.a ?? it.answer ?? "",
      }))
    : [];
  return { ...p, items };
}



    case "Gallery": {
      // {images:[{src,alt}]}, {images:[string]}, OR {items:[...]}
      const srcList = Array.isArray(p.images) ? p.images : p.items;
      const images = Array.isArray(srcList) ? srcList.map(imgObj) : [];
      const heading = p.heading || p.title || "";
      return { ...p, heading, images };
    }

    // -------------------- RESTAURANT CORE --------------------
    case "RestaurantMenu": {
      // supports {categories:[{name,items:[{name,desc?,price}]}]} OR {sections:[{title,items:[...]}]}
      const cats = Array.isArray(p.categories) ? p.categories : Array.isArray(p.sections) ? p.sections : [];
      const categories = cats.map((c: any) => ({
        name: c.name ?? c.title ?? "",
        items: asArray(c.items).map((it: any) => ({
          name: text(it.name),
          desc: text(it.desc ?? it.description),
          price: priceStr(it.price),
        })),
      }));
      const heading = p.heading || p.title || "Our Menu";
      return { ...p, heading, categories };
    }

    case "ReservationForm": {
      // normalize fields; allow "partySize" -> "guests"
      const raw = Array.isArray(p.fields) ? p.fields.slice() : ["name", "email", "phone", "date", "time", "guests"];
      const fields = raw.map((f: string) => (f === "partySize" ? "guests" : f));
      const heading = p.heading || "Make a Reservation";
      const submitLabel = p.submitLabel || "Book Now";
      return { ...p, heading, fields, submitLabel };
    }


      // Add to your normalizeProps function
      case "CurriculumAccordion": {
          const heading = p.heading || "Curriculum";
          const modules = Array.isArray(p.modules)
              ? p.modules.map((m: any) => ({
                  title: m.title || "",
                  lessons: Array.isArray(m.lessons) ? m.lessons : []
              }))
              : [];
          return { ...p, heading, modules };
      }

      case "InstructorHighlight": {
          return {
              name: p.name || "Instructor Name",
              credentials: Array.isArray(p.credentials) ? p.credentials : [],
              bio: p.bio || "",
              image: p.image || ""
          };
      }

      case "LearningPath": {
          const heading = p.heading || "Learning Path";
          const steps = Array.isArray(p.steps)
              ? p.steps.map((s: any) => ({
                  level: s.level || "",
                  skills: Array.isArray(s.skills) ? s.skills : []
              }))
              : [];
          return { ...p, heading, steps };
      }

// E-commerce components
      case "ProductCarousel": {
          const heading = p.heading || "Featured Products";
          const products = Array.isArray(p.products)
              ? p.products.map((prod: any) => ({
                  image: prod.image || "",
                  name: prod.name || "",
                  price: priceStr(prod.price),
                  href: prod.href || "#"
              }))
              : [];
          return { ...p, heading, products };
      }

      case "SizeGuide": {
          return {
              heading: p.heading || "Size Guide",
              table: p.table || { headers: [], rows: [] }
          };
      }

      case "ShippingTiers": {
          const heading = p.heading || "Shipping Options";
          const options = Array.isArray(p.options)
              ? p.options.map((opt: any) => ({
                  name: opt.name || "",
                  price: priceStr(opt.price),
                  delivery: opt.delivery || ""
              }))
              : [];
          return { ...p, heading, options };
      }

// Travel components
      case "DestinationGrid": {
          const heading = p.heading || "Popular Destinations";
          const destinations = Array.isArray(p.destinations)
              ? p.destinations.map((dest: any) => ({
                  name: dest.name || "",
                  image: dest.image || "",
                  highlights: Array.isArray(dest.highlights) ? dest.highlights : [],
                  price: priceStr(dest.price)
              }))
              : [];
          return { ...p, heading, destinations };
      }

      case "ItineraryDay": {
          return {
              day: p.day || "Day 1",
              activities: Array.isArray(p.activities)
                  ? p.activities.map((act: any) => ({
                      time: act.time || "",
                      description: act.description || "",
                      included: Array.isArray(act.included) ? act.included : []
                  }))
                  : []
          };
      }

      case "SeasonalPromo": {
          return {
              heading: p.heading || "Special Offer",
              validDates: p.validDates || "",
              included: Array.isArray(p.included) ? p.included : [],
              cta: p.cta || { label: "Book Now", href: "#" }
          };
      }

case "ServicePackages": {
  const heading = p.heading || "Service Packages";
  const packages = Array.isArray(p.packages) ? p.packages : [];
  return { ...p, heading, packages };
}

case "VehicleComparison": {
  const heading = p.heading || "Compare Vehicles";
  const models = Array.isArray(p.models) ? p.models : [];
  return { ...p, heading, models };
}

case "LookbookGallery": {
  const heading = p.heading || "Lookbook";
  const looks = Array.isArray(p.looks) ? p.looks.map((l:any)=>({ image:l.image, products:Array.isArray(l.products)?l.products:[] })) : [];
  return { ...p, heading, looks };
}

case "FitGuide": {
  const heading = p.heading || "Fit Guide";
  const steps = Array.isArray(p.steps) ? p.steps : [];
  return { ...p, heading, steps };
}

case "RateTable": {
  const heading = p.heading || "Rates";
  const products = Array.isArray(p.products) ? p.products : [];
  return { ...p, heading, products };
}

case "RetirementCalculator": {
  const heading = p.heading || "Retirement Calculator";
  const inputs = Array.isArray(p.inputs) ? p.inputs : ["age","income","currentSavings","contribution","targetAge"];
  const outputs = Array.isArray(p.outputs) ? p.outputs : ["projectedSavings","monthlyIncome"];
  return { ...p, heading, inputs, outputs };
}

case "ImpactMeter": {
  const goal = p.goal || "100000";
  const current = p.current || "25000";
  const description = p.description || "Help us reach our goal.";
  return { ...p, goal, current, description };
}

case "DonationTiers": {
  const heading = p.heading || "Donate";
  const tiers = Array.isArray(p.tiers) ? p.tiers : [];
  return { ...p, heading, tiers };
}

case "VenueShowcase": {
  const heading = p.heading || "Venues";
  const venues = Array.isArray(p.venues) ? p.venues : [];
  return { ...p, heading, venues };
}

case "EventTimeline": {
  const heading = p.heading || "Event Timeline";
  const milestones = Array.isArray(p.milestones) ? p.milestones : [];
  return { ...p, heading, milestones };
}

case "StyleQuiz": {
  const heading = p.heading || "Style Quiz";
  const questions = Array.isArray(p.questions) ? p.questions : [];
  const results = Array.isArray(p.results) ? p.results : [];
  return { ...p, heading, questions, results };
}

case "RoomVisualizer": {
  const heading = p.heading || "Room Visualizer";
  const projects = Array.isArray(p.projects) ? p.projects : [];
  return { ...p, heading, projects };
}

case "ClientPortfolio": {
  const heading = p.heading || "Client Work";
  const cases = Array.isArray(p.cases) ? p.cases : [];
  return { ...p, heading, cases };
}

case "ServiceProcess": {
  const heading = p.heading || "Our Process";
  const steps = Array.isArray(p.steps) ? p.steps : [];
  return { ...p, heading, steps };
}

// Construction components
      case "ProjectTimeline": {
          const heading = p.heading || "Project Timeline";
          const phases = Array.isArray(p.phases)
              ? p.phases.map((phase: any) => ({
                  name: phase.name || "",
                  duration: phase.duration || "",
                  milestones: Array.isArray(phase.milestones) ? phase.milestones : []
              }))
              : [];
          return { ...p, heading, phases };
      }

      case "MaterialShowcase": {
          const heading = p.heading || "Materials";
          const materials = Array.isArray(p.materials)
              ? p.materials.map((mat: any) => ({
                  name: mat.name || "",
                  image: mat.image || "",
                  benefits: Array.isArray(mat.benefits) ? mat.benefits : []
              }))
              : [];
          return { ...p, heading, materials };
      }

    case "AwardsBar": {
      // {items:[{label,value,icon?}]} – tolerate logos:[{src,alt}] variant
      const items =
        Array.isArray(p.items)
          ? p.items.map((it: any) => ({ label: text(it.label), value: text(it.value), icon: it.icon }))
          : Array.isArray(p.logos)
          ? p.logos.map((it: any) => ({ label: text(it.alt), value: "", icon: it.src }))
          : [];
      const heading = p.heading || "Awards & Recognition";
      return { ...p, heading, items };
    }

    case "SpecialsCarousel": {
      // {items:[{title,desc,price,image}]}; accept {items from DishGrid}
      const items = Array.isArray(p.items)
        ? p.items.map((it: any) => ({
            title: text(it.title),
            desc: text(it.desc ?? it.text ?? it.subtitle),
            price: priceStr(it.price),
            image: it.image,
          }))
        : [];
      const heading = p.heading || p.title || "Daily Specials";
      return { ...p, heading, items };
    }

    case "DishGrid": {
      const items = Array.isArray(p.items)
        ? p.items.map((it: any) => ({
            title: text(it.title ?? it.name),
            image: it.image,
            price: priceStr(it.price),
            desc: text(it.desc ?? it.description),
          }))
        : [];
      const heading = p.heading || "Featured Dishes";
      return { ...p, heading, items };
    }

    case "Hours": {
      const items = Array.isArray(p.items)
        ? p.items.map((it: any) => ({ day: text(it.day), open: text(it.open), close: text(it.close) }))
        : [];
      const heading = p.heading || "Hours of Operation";
      return { ...p, heading, items };
    }

    case "LocationMap": {
      const heading = p.heading || "Find Us";
      const addressLine1 = p.addressLine1 || "";
      const addressLine2 = p.addressLine2 || "";
      const phone = p.phone || "";
      const mapIframeSrc = p.mapIframeSrc || "";
      return { ...p, heading, addressLine1, addressLine2, phone, mapIframeSrc };
    }

    case "TestimonialHighlight": {
      const quote = text(p.quote);
      const author = text(p.author);
      const role = text(p.role);
      const avatar = p.avatar;
      return { ...p, quote, author, role, avatar };
    }

    // -------------------- NEW FILLER/CONTENT BLOCKS --------------------
    case "IntroSection": {
      const heading = p.heading || p.title || "About Us";
      const textBody = p.text || p.body || p.description || "";
      const image = p.image;
      const cta = p.cta || p.primary || p.primaryCta || undefined;
      return { ...p, heading, text: textBody, image, cta };
    }

    case "SplitFeature": {
      const heading = p.heading || p.title || "";
      const textBody = p.text || p.body || p.description || "";
      const image = p.image;
      const reverse = !!p.reverse;
      return { ...p, heading, text: textBody, image, reverse };
    }

    case "ValueBadges": {
      const heading = p.heading || p.title || "";
      const items = Array.isArray(p.items)
        ? p.items.map((it: any) => ({ label: text(it.label), sub: text(it.sub ?? it.text) }))
        : [];
      return { ...p, heading, items };
    }

    case "CTASection": {
      const heading = p.heading || p.title || "";
      const subheading = p.subheading || p.text || p.subtitle || "";
      const primary = p.primary || p.cta || p.primaryCta || undefined;
      const secondary = p.secondary || p.secondaryCta || undefined;
      const background = p.background;
      return { ...p, heading, subheading, primary, secondary, background };
    }

    case "PressLogos": {
      const logos = Array.isArray(p.logos)
        ? p.logos.map(imgObj)
        : Array.isArray(p.items)
        ? p.items.map(imgObj)
        : [];
      const heading = p.heading || p.title || "";
      return { ...p, heading, logos };
    }

    case "SocialStrip": {
      const items = Array.isArray(p.items)
        ? p.items.map((it: any) => ({ label: text(it.label), icon: it.icon, href: it.href ?? "#" }))
        : [];
      return { ...p, items };
    }


case "Hours": {
  let items: any[] = [];
  if (Array.isArray(p.items)) {
    items = p.items.map((it: any) => ({
      day: it.day || "",
      open: it.open || "",
      close: it.close || "",
    }));
  } else if (Array.isArray(p.days)) {
    // support {day, time:"6pm–10pm"} variant
    items = p.days.map((d: any) => {
      const time = (d.time || "").replace(/\s/g, "");
      const [open, close] = time.includes("-") ? time.split("-") : ["", ""];
      return { day: d.day || "", open: open || "", close: close || "" };
    });
  }
  const heading = p.heading || "Hours of Operation";
  return { ...p, heading, items };
}

      case "DoctorCard":
          return normDoctorProps(props);

      case "PropertyList":
          return normPropertyProps(props);
      case "FeatureComparison": return normFeatureComparisonProps(props);
      case "ClassSchedule": return normClassScheduleProps(props);
      case "IntegrationGrid":
          return normIntegrationGridProps(p);

      case "SizeGuide":
          return normSizeGuideProps(p);

      case "MortgageCalculator":
          return normMortgageCalculatorProps(p);

      case "DemoRequest":
          return normDemoRequestProps(p);
      case "PatientPortalCTA":
          return normPatientPortalCTAProps(props);

    // NEW: normalize Testimonials/TestimonialHighlight variants
    case "Testimonials": {
      const items = Array.isArray(p.items)
        ? p.items
        : Array.isArray(p.testimonials)
        ? p.testimonials.map((t: any) => ({
            quote: t.quote ?? t.text ?? "",
            author: t.author ?? "",
            role: t.role ?? "",
            avatar: t.avatar ?? "",
          }))
        : [];
      return { ...p, items };
    }

    default:
      return p;
  }
}


function normHeaderProps(p: any) {
  // Accept either `navigation: [{label, href}]` OR `links: string[] | [{label}]`
  let links: string[] = [];

  if (Array.isArray(p?.navigation)) {
    // Prefer labels for Header nav display
    links = p.navigation
      .map((it: any) => (typeof it === "string" ? it : it?.label))
      .filter(Boolean);
  } else if (Array.isArray(p?.links)) {
    // Could be string[] or object[]
    links = p.links
      .map((it: any) => (typeof it === "string" ? it : it?.label))
      .filter(Boolean);
  }

  // Keep CTA if present (supports either {label, href} or string)
  let cta = undefined;
  if (p?.cta && typeof p.cta === "object") cta = p.cta;
  if (typeof p?.cta === "string") cta = { label: p.cta, href: "#" };

  return {
    logoText: p?.logoText || p?.brand || "Brand",
    links,
    cta,
  };
}

function normFaqProps(p: any) {
  // Normalize items: accept {q/a} OR {question/answer}
  const items = Array.isArray(p?.items) ? p.items : [];
  const normalized = items.map((it: any) => {
    // already q/a?
    if (it?.q || it?.a) return { q: it.q || "", a: it.a || "" };
    // question/answer?
    if (it?.question || it?.answer)
      return { q: it.question || "", a: it.answer || "" };
    // fallback: try title/desc
    return { q: it?.title || "", a: it?.desc || it?.text || "" };
  });
  return { ...p, items: normalized };
}
// Add to your normalizers section
function normIntegrationGridProps(p: any) {
    return {
        heading: p?.heading || "Our Integrations",
        items: Array.isArray(p?.items) ? p.items : []
    };
}


function normSizeGuideProps(p: any) {
    return {
        heading: p?.heading || "Size Guide",
        table: p?.table || { headers: [], rows: [] }
    };
}



function normMortgageCalculatorProps(p: any) {
    return {
        heading: p?.heading || "Mortgage Calculator",
        fields: Array.isArray(p?.fields) ? p.fields : [],
        results: Array.isArray(p?.results) ? p.results : []
    };
}


function normDemoRequestProps(p: any) {
    return {
        heading: p?.heading || "Request a Demo",
        fields: Array.isArray(p?.fields) ? p.fields : ["name", "email", "company"],
        submitLabel: p?.submitLabel || "Schedule Demo"
    };
}

function normBlogListProps(p: any) {
  const items = Array.isArray(p?.items)
    ? p.items
    : Array.isArray(p?.posts)
    ? p.posts.map((x: any) => ({
        title: x.title,
        excerpt: x.excerpt || x.summary || "",
        href: x.href || "#",
      }))
    : [];
  return { heading: p?.heading || p?.title || "Blog", items };
}

function normPatientPortalCTAProps(p: any) {
    return {
        heading: p?.heading || "Patient Portal",
        description: p?.description || "Access your health records online",
        cta: p?.cta || { label: "Login to Portal", href: "#" }
    };
}


function normFeatureComparisonProps(p: any) {
    return {
        heading: p?.heading || "Feature Comparison",
        items: Array.isArray(p?.items) ? p.items : [],
        legend: Array.isArray(p?.legend) ? p.legend : []
    };
}


function normClassScheduleProps(p: any) {
    return {
        heading: p?.heading || "Class Schedule",
        days: Array.isArray(p?.days) ? p.days : []
    };
}

function normDoctorProps(p: any) {
    return {
        heading: p?.heading || "Our Team",
        doctors: Array.isArray(p?.items) ? p.items : [],
    };
}

// For Real Estate/PropertyList
function normPropertyProps(p: any) {
    return {
        heading: p?.heading || "Properties",
        properties: Array.isArray(p?.items) ? p.items : [],
    };
}




function normGalleryProps(p: any) {
  const srcItems = Array.isArray(p?.images) ? p.images : Array.isArray(p?.items) ? p.items : [];
  const images = srcItems.map((im: any) => {
    const src = im?.src || im?.image || im?.url || im?.href || "";
    const alt = im?.alt || im?.title || im?.caption || (typeof src === "string" ? (src.split("/").pop() || "") : "");
    return { src, alt };
  });
  const unique = images.filter((im, i, arr) => im.src && arr.findIndex(x => x.src === im.src) === i);
  return { ...p, heading: p.heading || p.title || "", images: unique };
}
type Comp = { id: string; type: string; tags?: string[]; props: any };

export default function Preview() {
  const [raw, setRaw] = useState<any>(null);
  const [tab, setTab] = useState<"preview" | "json">("preview");

  useEffect(() => {
    const stored = localStorage.getItem("generatedWebsite");
    if (stored) setRaw(JSON.parse(stored));
  }, []);
useEffect(() => {
  if (raw?.components) {
    warnUnknownTypes(raw.components as Comp[]);
  }
}, [raw]);


  const meta = useMemo(() => {
    const name =
      raw?.websiteName ||
      raw?.metadata?.title ||
      raw?.business_name ||
      "Generated Site";
    const domain = String(name).toLowerCase().replace(/[^a-z0-9]+/g, "") || "site";
    return { title: name, domainHint: `${domain}.com` };
  }, [raw]);

  if (!raw) {
    return (
      <main className="min-h-screen bg-black text-white p-8">
        <h1 className="text-2xl font-semibold">No generated data found</h1>
        <p className="text-white/70 mt-2">Go back and generate a website first.</p>
      </main>
    );
  }

  const content = raw.content ?? "";
  const looksLikeHTML = typeof content === "string" && /<\/?[a-z][\s\S]*>/i.test(content);

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(raw, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const base = meta.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "website";
    a.download = `${base}-data.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/60 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
          <div>
            <div className="text-sm text-white/90">{meta.title}</div>
            <div className="text-xs text-white/50">{meta.domainHint}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center rounded-lg bg-white/5 p-1 border border-white/10">
              <button
                onClick={() => setTab("preview")}
                className={`px-3 py-1.5 text-sm rounded-md ${
                  tab === "preview" ? "bg-white text-black" : "text-white/70 hover:bg-white/10"
                }`}
              >
                Preview
              </button>
              <button
                onClick={() => setTab("json")}
                className={`px-3 py-1.5 text-sm rounded-md ${
                  tab === "json" ? "bg-white text-black" : "text-white/70 hover:bg-white/10"
                }`}
              >
                Raw JSON
              </button>
            </div>
            <button
              onClick={handleDownload}
              className="rounded-lg border border-white/20 px-3 py-1.5 text-sm hover:bg-white/10"
            >
              ⬇ Download JSON
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <section className="mx-auto max-w-6xl px-4 py-6">
        {tab === "json" ? (
          <div className="rounded-2xl border border-white/10 bg-black p-4 overflow-auto">
            <pre className="text-white/80 text-sm">{JSON.stringify(raw, null, 2)}</pre>
          </div>
        ) : Array.isArray(raw.components) && raw.components.length > 0 ? (
          <div className="rounded-2xl overflow-hidden bg-white text-black">
            <FakeBrowserBar url={meta.domainHint} />
            <SiteRenderer components={raw.components as Comp[]} />
          </div>
        ) : typeof content === "string" && content.trim() ? (
          <div className="rounded-2xl overflow-hidden">
            <FakeBrowserBar url={meta.domainHint} />
            {looksLikeHTML ? (
              <div className="bg-white text-black p-6" dangerouslySetInnerHTML={{ __html: content }} />
            ) : (
              <pre className="bg-black text-white/90 p-4 rounded-lg whitespace-pre-wrap">{content}</pre>
            )}
          </div>
        ) : (
          <p className="text-white/70">
            No previewable content found. Switch to <b>Raw JSON</b> to inspect the data.
          </p>
        )}
      </section>
    </main>
  );
}

/* ===========================
   Minimal in-file renderer
   =========================== */

function FakeBrowserBar({ url }: { url: string }) {
  return (
    <div className="h-9 bg-gray-100 flex items-center px-4 space-x-2 border-b border-gray-200">
      <div className="flex space-x-1">
        <div className="w-3 h-3 bg-red-400 rounded-full" />
        <div className="w-3 h-3 bg-yellow-400 rounded-full" />
        <div className="w-3 h-3 bg-green-400 rounded-full" />
      </div>
      <div className="flex-1 bg-white rounded px-3 py-1 text-xs text-gray-600 truncate">{url}</div>
    </div>
  );
}

/* ---------- Safe image + section ---------- */
const fallbackImg = "https://picsum.photos/seed/placeholder/1200/600";

function SafeImg({ src, alt, className }: { src?: string; alt?: string; className?: string }) {
    const [current, setCurrent] = useState(() => {
        // Skip placeholder if no src (for optional images)
        if (!src) return src;
        return typeof src === "string" && src.startsWith("http") ? src : fallbackImg;
    });
  return (
    <img
      src={current}
      alt={alt || ""}
      onError={() => {
        if (current !== fallbackImg) setCurrent(fallbackImg);
      }}
      className={className ?? "w-full h-48 object-cover rounded-md"}
      loading="lazy"
      decoding="async"
    />
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return <section className="mx-auto max-w-6xl px-4 py-12">{children}</section>;
}


/* ---------- Normalizers (Header, FAQ, Gallery) ---------- */
/* ===========================
   SiteRenderer (uses normalizers)
   =========================== */
function SiteRenderer({ components }: { components: Comp[] }) {
  return (
    <div className="bg-white">
        {components.map((c) => {
            const props = normalizeProps(c.type, c.props || {});
            console.debug("Rendering component:", c.type, c.props);
            switch (c.type) {

          // no extra spacing wrapper for header/footer
          case "Header": {
            return <Header key={c.id} {...normHeaderProps(props)} />;
          }
case "BlogList":
  return (
    <Section key={c.id}>
      <BlogList {...normBlogListProps(props)} />
    </Section>
  );

          case "Hero":
            return (
              <Section key={c.id}>
                <Hero {...props} />
              </Section>
            );
                case "CurriculumAccordion":
                    return (
                        <Section key={c.id}>
                            <CurriculumAccordion {...props} />
                        </Section>
                    );

                case "InstructorHighlight":
                    return (
                        <Section key={c.id}>
                            <InstructorHighlight {...props} />
                        </Section>
                    );

                case "LearningPath":
                    return (
                        <Section key={c.id}>
                            <LearningPath {...props} />
                        </Section>
                    );

                case "ProductCarousel":
                    return (
                        <Section key={c.id}>
                            <ProductCarousel {...props} />
                        </Section>
                    );

                case "SizeGuide":
                    return (
                        <Section key={c.id}>
                            <SizeGuide {...props} />
                        </Section>
                    );

                case "ShippingTiers":
                    return (
                        <Section key={c.id}>
                            <ShippingTiers {...props} />
                        </Section>
                    );
case "ServicePackages":    return <ServicePackages key={c.id} {...props} />;
case "VehicleComparison":  return <VehicleComparison key={c.id} {...props} />;
case "LookbookGallery":    return <LookbookGallery key={c.id} {...props} />;
case "FitGuide":           return <FitGuide key={c.id} {...props} />;
case "RateTable":          return <RateTable key={c.id} {...props} />;
case "RetirementCalculator": return <RetirementCalculator key={c.id} {...props} />;
case "ImpactMeter":
  return (
    <Section key={c.id}>
      <ImpactMeter {...props} />
    </Section>
  );case "DonationTiers":      return <DonationTiers key={c.id} {...props} />;
case "VenueShowcase":      return <VenueShowcase key={c.id} {...props} />;
case "EventTimeline":      return <EventTimeline key={c.id} {...props} />;
case "StyleQuiz":          return <StyleQuiz key={c.id} {...props} />;
case "RoomVisualizer":     return <RoomVisualizer key={c.id} {...props} />;
case "ClientPortfolio":    return <ClientPortfolio key={c.id} {...props} />;
case "ServiceProcess":     return <ServiceProcess key={c.id} {...props} />;

                case "DestinationGrid":
                    return (
                        <Section key={c.id}>
                            <DestinationGrid {...props} />
                        </Section>
                    );
case "UseCaseShowcase":
  return <Section key={c.id}><UseCaseShowcase {...props} /></Section>;
case "SDKDownload":
  return <Section key={c.id}><SDKDownload {...props} /></Section>;
case "APIEndpoints":
  return <Section key={c.id}><APIEndpoints {...props} /></Section>;
case "Changelog":
  return <Section key={c.id}><Changelog {...props} /></Section>;
case "SystemStatus":
  return <Section key={c.id}><SystemStatus {...props} /></Section>;
case "ArchitectureDiagram":
  return <Section key={c.id}><ArchitectureDiagram {...props} /></Section>;
case "SecurityBadges":
  return <Section key={c.id}><SecurityBadges {...props} /></Section>;
case "ComplianceBadges":
  return <Section key={c.id}><ComplianceBadges {...props} /></Section>;
case "TutorialsList":
  return <Section key={c.id}><TutorialsList {...props} /></Section>;
case "InstallSteps":
  return <Section key={c.id}><InstallSteps {...props} /></Section>;
case "CustomersLogos":
  return <Section key={c.id}><CustomersLogos {...props} /></Section>;

                case "ItineraryDay":
                    return (
                        <Section key={c.id}>
                            <ItineraryDay {...props} />
                        </Section>
                    );
case "MembershipPlans":    return <Section key={c.id}><MembershipPlans {...props} /></Section>;
case "FacilityAmenities":  return <Section key={c.id}><FacilityAmenities {...props} /></Section>;
case "BeforeAfter":        return <Section key={c.id}><BeforeAfter {...props} /></Section>;
case "TrialPassCTA":       return <Section key={c.id}><TrialPassCTA {...props} /></Section>;
case "EquipmentShowcase":  return <Section key={c.id}><EquipmentShowcase {...props} /></Section>;
case "SuccessMetrics":     return <Section key={c.id}><SuccessMetrics {...props} /></Section>;

                case "SeasonalPromo":
                    return (
                        <Section key={c.id}>
                            <SeasonalPromo {...props} />
                        </Section>
                    );

                case "ProjectTimeline":
                    return (
                        <Section key={c.id}>
                            <ProjectTimeline {...props} />
                        </Section>
                    );

                case "MaterialShowcase":
                    return (
                        <Section key={c.id}>
                            <MaterialShowcase {...props} />
                        </Section>
                    );
          case "FeatureGrid":
            return (
              <Section key={c.id}>
                <FeatureGrid {...props} />
              </Section>
            );

          case "ProductGrid":
            return (
              <Section key={c.id}>
                <ProductGrid {...props} />
              </Section>
            );

          case "Pricing":
            return (
              <Section key={c.id}>
                <Pricing {...props} />
              </Section>
            );

          case "Testimonials":
            return (
              <Section key={c.id}>
                <Testimonials {...props} />
              </Section>
            );

          case "FAQ":
            return (
              <Section key={c.id}>
                <FAQ {...normFaqProps(props)} />
              </Section>
            );

          case "Gallery":
            return (
              <Section key={c.id}>
                <Gallery {...normGalleryProps(props)} />
              </Section>
            );

          case "Contact":
            return (
              <Section key={c.id}>
                <Contact {...props} />
              </Section>
            );

          case "CartSummary":
            return (
              <Section key={c.id}>
                <CartSummary {...props} />
              </Section>
            );

          case "EventList":
            return (
              <Section key={c.id}>
                <EventList {...props} />
              </Section>
            );

          // NEW TYPES (ensure these components exist!)
          case "Stats":
            return (
              <Section key={c.id}>
                <Stats {...props} />
              </Section>
            );

          case "ReservationForm":
            return (
              <Section key={c.id}>
                <ReservationForm {...props} />
              </Section>
            );

          case "RestaurantMenu":
            return (
              <Section key={c.id}>
                <RestaurantMenu {...props} />
              </Section>
            );

          case "DoctorCard":
            return (
              <Section key={c.id}>
                <DoctorCard {...props} />
              </Section>
            );

          case "AppointmentList":
            return (
              <Section key={c.id}>
                <AppointmentList {...props} />
              </Section>
            );

          case "PropertyList":
            return (
              <Section key={c.id}>
                <PropertyList {...props} />
              </Section>
            );

          case "PropertyMap":
            return (
              <Section key={c.id}>
                <PropertyMap {...props} />
              </Section>
            );

          case "CourseList":
            return (
              <Section key={c.id}>
                <CourseList {...props} />
              </Section>
            );

          case "CourseSyllabus":
            return (
              <Section key={c.id}>
                <CourseSyllabus {...props} />
              </Section>
            );

          case "JobList":
            return (
              <Section key={c.id}>
                <JobList {...props} />
              </Section>
            );

          case "Team":
            return (
              <Section key={c.id}>
                <Team {...props} />
              </Section>
            );

          case "Steps":
            return (
              <Section key={c.id}>
                <Steps {...props} />
              </Section>
            );

          case "CheckoutForm":
            return (
              <Section key={c.id}>
                <CheckoutForm {...props} />
              </Section>
            );

          case "SpecialsCarousel":
            return (
              <Section key={c.id}>
                <SpecialsCarousel {...props} />
              </Section>
            );

          case "PressLogos":
            return (
              <Section key={c.id}>
                <PressLogos {...props} />
              </Section>
            );

          case "AwardsBar":
            return (
              <Section key={c.id}>
                <AwardsBar {...props} />
              </Section>
            );

          case "ChefBio":
            return (
              <Section key={c.id}>
                <ChefBio {...props} />
              </Section>
            );

          case "DishGrid":
            return (
              <Section key={c.id}>
                <DishGrid {...props} />
              </Section>
            );

          case "BookingCTA":
            return (
              <Section key={c.id}>
                <BookingCTA {...props} />
              </Section>
            );

          case "Hours":
            return (
              <Section key={c.id}>
                <Hours {...props} />
              </Section>
            );

          case "LocationMap":
            return (
              <Section key={c.id}>
                <LocationMap {...props} />
              </Section>
            );

          case "TestimonialHighlight":
            return (
              <Section key={c.id}>
                <TestimonialHighlight {...props} />
              </Section>
            );

          case "SocialStrip":
            return (
              <Section key={c.id}>
                <SocialStrip {...props} />
              </Section>
            );

          case "Footer":
            return <Footer key={c.id} {...props} />;

                case "FeatureComparison":
                    return <Section key={c.id}><FeatureComparison {...props} /></Section>;
                case "APIDocs":
                    return <Section key={c.id}><APIDocs {...props} /></Section>;
                case "IntegrationGrid":
                    return (
                        <Section key={c.id}>
                            <IntegrationGrid {...props} />
                        </Section>
                    );

                case "DemoRequest":
                    return (
                        <Section key={c.id}>
                            <DemoRequest {...props} />
                        </Section>
                    );
case "CodeSample":
  return (
    <Section key={c.id}>
      <CodeSample {...props} />
    </Section>
  );
                // Healthcare & Medical
                case "InsuranceAccepted":
                    return <Section key={c.id}><InsuranceAccepted {...props} /></Section>;
                case "PatientPortalCTA":
                    return <PatientPortalCTA key={c.id} {...props} />;
                case "ServiceTiers":
                    return <Section key={c.id}><ServiceTiers {...props} /></Section>;
                case "TelehealthInfo":
                    return <Section key={c.id}><TelehealthInfo {...props} /></Section>;

                // Fitness & Wellness
                case "ClassSchedule":
                    return <Section key={c.id}><ClassSchedule {...props} /></Section>;
                case "TrainerProfiles":
                    return <Section key={c.id}><TrainerProfiles {...props} /></Section>;
                case "ResultsTimeline":
                    return <Section key={c.id}><ResultsTimeline {...props} /></Section>;
                case "NutritionPlan":
                    return <Section key={c.id}><NutritionPlan {...props} /></Section>;
                // Beauty/Spa
                // -------------------- BEAUTY & SPA --------------------
case "ServiceMenu":
  return (
    <Section key={c.id}>
      <ServiceMenu {...props} />
    </Section>
  );

case "GiftCardGrid":
  return (
    <Section key={c.id}>
      <GiftCardGrid {...props} />
    </Section>
  );

case "ProductSpotlight":
  return (
    <Section key={c.id}>
      <ProductSpotlight {...props} />
    </Section>
  );

case "SpaAmenities":
  return (
    <Section key={c.id}>
      <SpaAmenities {...props} />
    </Section>
  );

case "SpecialPackages":
  return (
    <Section key={c.id}>
      <SpecialPackages {...props} />
    </Section>
  );

case "SpaCTA":
  return (
    <Section key={c.id}>
      <SpaCTA {...props} />
    </Section>
  );

                // Legal
                case "PracticeAreas":
                    return <PracticeAreas key={c.id} {...props} />;
                case "CaseResults":
                    return <CaseResults key={c.id} {...props} />;
                case "AttorneyProfile":
                    return <AttorneyProfile key={c.id} {...props} />;

                // Real Estate
                case "PropertySearch":
                    return <PropertySearch key={c.id} {...props} />;
                case "NeighborhoodGuide":
                    return <NeighborhoodGuide key={c.id} {...props} />;
                // In your SiteRenderer switch statement:

                case "MortgageCalculator":
                    return (
                        <Section key={c.id}>
                            <MortgageCalculator {...props} />
                        </Section>
                    );
                case "IntroSection":
  return <Section key={c.id}><IntroSection {...props} /></Section>;
case "ServicesGrid":         return <Section key={c.id}><ServicesGrid {...props} /></Section>;
case "AppointmentScheduler": return <Section key={c.id}><AppointmentScheduler {...props} /></Section>;
case "CertificationsBadges": return <Section key={c.id}><CertificationsBadges {...props} /></Section>;
case "ConditionsTreated":    return <Section key={c.id}><ConditionsTreated {...props} /></Section>;
case "TreatmentProcess":     return <Section key={c.id}><TreatmentProcess {...props} /></Section>;
case "EmergencyNotice":      return <Section key={c.id}><EmergencyNotice {...props} /></Section>;

case "SplitFeature":
  return <Section key={c.id}><SplitFeature {...props} /></Section>;
case "ValueBadges":
  return <Section key={c.id}><ValueBadges {...props} /></Section>;
case "CTASection":
  return <Section key={c.id}><CTASection {...props} /></Section>;
case "NewsletterSignup":
  return <Section key={c.id}><NewsletterSignup {...props} /></Section>;
case "Divider":
  return <Section key={c.id}><Divider {...props} /></Section>;
case "PressLogos":
  return <Section key={c.id}><PressLogos {...props} /></Section>;
case "SpecialsCarousel":
  return <Section key={c.id}><SpecialsCarousel {...props} /></Section>;
case "PrivateDining":
  return <Section key={c.id}><PrivateDining {...props} /></Section>;
case "Catering":
  return <Section key={c.id}><Catering {...props} /></Section>;
case "WineListHighlight":
  return <Section key={c.id}><WineListHighlight {...props} /></Section>;
case "MapList":
  return <Section key={c.id}><MapList {...props} /></Section>;
          default:
            return (
              <Section key={c.id}>
                <div className="p-6 border">
                  Unknown component type: <b>{c.type}</b>
                </div>
              </Section>
            );
        }
      })}
    </div>
  );
}

/* ---------- Basic components (Tailwind) ---------- */

function Header(props: any) {
    const logo = props.logoText ?? props.brand ?? "Brand";
    // Accept `navigation: [{label,href}]` OR `links: string[]`
    const nav: Array<any> =
        Array.isArray(props.navigation) ? props.navigation :
            Array.isArray(props.links) ? (props.links.map((l:string)=>({label:l, href:"#"+(l||"").toLowerCase()}))) :
                [];

    return (
        <header className="border-b bg-white">
            <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
                <div className="font-semibold">{logo}</div>
                <nav className="hidden md:flex gap-6 text-sm text-gray-700">
                    {nav.map((it, i) => (
                        <a key={i} href={it.href || "#"} className="hover:text-black">{it.label}</a>
                    ))}
                </nav>
                {props.cta?.label && (
                    <a className="px-3 py-1.5 rounded bg-black text-white text-sm" href={props.cta.href || "#"}>
                        {props.cta.label}
                    </a>
                )}
            </div>
        </header>
    );
}


function Hero(all: any) {
  const title = pick<string>(all, ["title","heading"], "Your headline");
  const subtitle = pick<string>(all, ["subtitle","subheading"], "");
  const primaryCta = pick<any>(all, ["primaryCta","cta"], null);
  const image = all.image;

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {image && <SafeImg src={image} alt={all.alt || ""} className="absolute inset-0 h-full w-full object-cover opacity-30" />}
      <div className="relative px-6 py-16 md:py-24">
        <h1 className="text-4xl md:text-5xl font-bold">{title}</h1>
        {subtitle && <p className="mt-3 text-lg text-gray-700 max-w-2xl">{subtitle}</p>}
        {primaryCta?.label && (
          <a href={primaryCta.href || "#"} className="inline-block mt-6 px-5 py-2 rounded bg-black text-white">
            {primaryCta.label}
          </a>
        )}
      </div>
    </div>
  );
}



function FeatureGrid({ heading, items = [] }: any) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      {heading && <h2 className="text-2xl font-semibold mb-6">{heading}</h2>}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it: any, i: number) => (
          <div key={i} className="border rounded-lg p-5">
            {it.icon && <div className="mb-2 text-2xl">{it.icon}</div>}
            <div className="font-medium">{it.title}</div>
            {it.text && <div className="text-gray-600 text-sm mt-1">{it.text}</div>}
          </div>
        ))}
      </div>
    </section>
  );
}
function ServicesGrid({ heading, items = [] as any[] }) {
  return (
    <div>
      {heading && <h2 className="text-2xl font-semibold mb-6">{heading}</h2>}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it, i) => (
          <div key={i} className="border rounded-lg p-5 bg-white">
            {it.icon && <div className="text-2xl mb-2">{it.icon}</div>}
            <div className="font-medium">{it.title}</div>
            {it.text && <div className="text-sm text-gray-600 mt-1">{it.text}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function AppointmentScheduler({ heading, fields = [], submitLabel = "Request Appointment" }) {
  return (
    <div>
      {heading && <h2 className="text-2xl font-semibold mb-6">{heading}</h2>}
      <form className="grid gap-3 max-w-xl">
        {fields.map((f: string, i: number) => (
          <input key={i} placeholder={f[0].toUpperCase()+f.slice(1)} className="border rounded px-3 py-2" />
        ))}
        <button className="mt-2 px-4 py-2 rounded bg-black text-white">{submitLabel}</button>
      </form>
    </div>
  );
}
function MembershipPlans({ heading, plans = [] as any[] }) {
  return (
    <div>
      {heading && <h2 className="text-2xl font-semibold mb-6">{heading}</h2>}
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((p:any, i:number)=>(
          <div key={i} className="border rounded-lg p-6">
            <div className="text-lg font-semibold">{p.name}</div>
            <div className="text-2xl font-bold mt-2">{p.price}</div>
            <ul className="mt-4 space-y-1 text-sm text-gray-700">
              {(p.features||[]).map((f:string, j:number)=><li key={j}>• {f}</li>)}
            </ul>
            {p.cta?.label && <a className="inline-block mt-4 px-4 py-2 rounded bg-black text-white text-sm" href={p.cta.href||"#"}>{p.cta.label}</a>}
          </div>
        ))}
      </div>
    </div>
  );
}

function FacilityAmenities({ heading, items = [] as any[] }) {
  return (
    <div>
      {heading && <h2 className="text-2xl font-semibold mb-6">{heading}</h2>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it:any,i:number)=>(
          <div key={i} className="border rounded-lg p-4 flex items-center gap-3">
            {it.icon && <span className="text-2xl">{it.icon}</span>}
            <span className="font-medium">{it.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BeforeAfter({ heading, items = [] as any[] }) {
  return (
    <div>
      {heading && <h2 className="text-2xl font-semibold mb-6">{heading}</h2>}
      <div className="grid gap-6 md:grid-cols-2">
        {items.map((it:any, i:number)=>(
          <div key={i} className="grid grid-cols-2 gap-2 border rounded-lg p-2">
            <div><SafeImg src={it.before} alt={it.beforeAlt} className="w-full h-44 object-cover rounded-md" /><div className="text-xs mt-1 text-gray-600">Before</div></div>
            <div><SafeImg src={it.after} alt={it.afterAlt} className="w-full h-44 object-cover rounded-md" /><div className="text-xs mt-1 text-gray-600">After</div></div>
            {it.caption && <div className="col-span-2 text-sm text-gray-700 mt-2">{it.caption}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function TrialPassCTA({ heading, subheading, primary, secondary, background, alt }: any) {
  return (
    <section className="relative overflow-hidden rounded-2xl">
      {background && <SafeImg src={background} alt={alt} className="absolute inset-0 h-full w-full object-cover opacity-25" />}
      <div className="relative px-6 py-14">
        <h2 className="text-3xl font-bold">{heading}</h2>
        {subheading && <p className="text-lg text-gray-700 mt-2 max-w-2xl">{subheading}</p>}
        <div className="mt-6 flex gap-3">
          {primary?.label && <a href={primary.href||"#"} className="px-5 py-2 rounded bg-black text-white">{primary.label}</a>}
          {secondary?.label && <a href={secondary.href||"#"} className="px-5 py-2 rounded border border-black">{secondary.label}</a>}
        </div>
      </div>
    </section>
  );
}

function EquipmentShowcase({ heading, images = [] as any[] }) {
  return (
    <div>
      {heading && <h2 className="text-2xl font-semibold mb-6">{heading}</h2>}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
        {images.map((im:any, i:number)=>(
          <div key={i} className="overflow-hidden rounded-xl border">
            <SafeImg src={im.src} alt={im.alt} className="w-full h-44 object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SuccessMetrics({ heading, items = [] as any[] }) {
  return (
    <div>
      {heading && <h2 className="text-2xl font-semibold mb-6">{heading}</h2>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it:any, i:number)=>(
          <div key={i} className="rounded-xl border p-5">
            <div className="text-3xl font-bold">{it.value}</div>
            <div className="text-sm text-gray-700 mt-1">{it.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CertificationsBadges({ heading, items = [] as any[] }) {
  return (
    <div>
      {heading && <h2 className="text-2xl font-semibold mb-4">{heading}</h2>}
      <div className="flex flex-wrap gap-3">
        {items.map((it:any, i:number)=>(
          <div key={i} className="flex items-center gap-2 rounded-full bg-black/5 px-3 py-2">
            {it.logo && <img src={/^https?:/.test(it.logo) ? it.logo : fallbackImg} alt={it.label || "badge"} className="h-5 w-5 object-contain" />}
            <span className="text-sm font-medium">{it.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConditionsTreated({ heading, items = [] as string[] }) {
  return (
    <div>
      {heading && <h2 className="text-2xl font-semibold mb-4">{heading}</h2>}
      <ul className="grid md:grid-cols-2 gap-2 list-disc pl-5 text-gray-700">
        {items.map((t, i)=> <li key={i}>{t}</li>)}
      </ul>
    </div>
  );
}

function TreatmentProcess({ heading, steps = [] as any[] }) {
  return (
    <div>
      {heading && <h2 className="text-2xl font-semibold mb-6">{heading}</h2>}
      <ol className="space-y-4">
        {steps.map((s:any, i:number)=>(
          <li key={i} className="border rounded-lg p-4">
            <div className="font-medium">{s.title}</div>
            {s.text && <div className="text-sm text-gray-700 mt-1">{s.text}</div>}
          </li>
        ))}
      </ol>
    </div>
  );
}

function EmergencyNotice({ heading, text, severity = "warning" }) {
  const tone = severity === "critical" ? "bg-red-50 border-red-300 text-red-800"
              : severity === "info" ? "bg-blue-50 border-blue-300 text-blue-800"
              : "bg-yellow-50 border-yellow-300 text-yellow-800";
  return (
    <div className={`border rounded-lg p-4 ${tone}`}>
      <div className="font-semibold">{heading}</div>
      <p className="text-sm mt-1">{text}</p>
    </div>
  );
}

function ProductGrid({ heading, items = [] }: any) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      {heading && <h2 className="text-2xl font-semibold mb-6">{heading}</h2>}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it: any, i: number) => (
          <div key={i} className="border rounded-lg overflow-hidden">
            <SafeImg src={it.image} alt={it.title} className="w-full h-40 object-cover" />
            <div className="p-4">
              <div className="font-medium">{it.title}</div>
              {"price" in it && <div className="text-gray-600">{it.price}</div>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Pricing({ heading = "Pricing", plans = [] }: any) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <h2 className="text-2xl font-semibold mb-6">{heading}</h2>
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((p: any, i: number) => (
          <div key={i} className="border rounded-lg p-6">
            <div className="text-lg font-semibold">{p.name}</div>
            <div className="text-2xl font-bold mt-2">{p.price}</div>
            <ul className="mt-4 space-y-1 text-sm text-gray-700">
              {(p.features || []).map((f: string, idx: number) => <li key={idx}>• {f}</li>)}
            </ul>
            {p.cta?.label && (
              <a href={p.cta.href || "#"} className="inline-block mt-4 px-4 py-2 rounded bg-black text-white text-sm">
                {p.cta.label}
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function Testimonials({ heading, items = [] }: any) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      {heading && <h2 className="text-2xl font-semibold mb-6">{heading}</h2>}
      <div className="grid gap-6 md:grid-cols-2">
        {items.map((t: any, i: number) => (
          <div key={i} className="border rounded-lg p-5">
            <p className="italic">“{t.quote}”</p>
            <div className="mt-3 text-sm text-gray-700">
              <b>{t.author}</b> {t.role ? `• ${t.role}` : ""}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FAQ({ items = [] }: any) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <h2 className="text-2xl font-semibold mb-6">FAQ</h2>
      <div className="space-y-4">
        {items.map((q: any, i: number) => (
          <details key={i} className="border rounded-lg p-4">
            <summary className="font-medium cursor-pointer">{q.q}</summary>
            <p className="text-gray-700 mt-2">{q.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function Gallery({ heading, images = [] as any[] }) {
  return (
    <div>
      {heading && <h2 className="text-2xl font-semibold mb-6">{heading}</h2>}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
        {images.map((im: any, i: number) => (
          <div key={i} className="overflow-hidden rounded-xl border">
            <SafeImg src={im.src} alt={im.alt} className="w-full h-44 object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}


function EventList({ heading, items = [] }: any) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      {heading && <h2 className="text-2xl font-semibold mb-6">{heading}</h2>}
      <ul className="space-y-3">
        {items.map((e: any, i: number) => (
          <li key={i} className="rounded-lg border border-black/10 p-4">
            <div className="font-medium">{e.title}</div>
            <div className="text-sm text-gray-600">{e.date} • {e.location}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CartSummary({ subtotal, shipping, total, checkoutCta }: any) {
  return (
    <section className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-lg border border-black/10 p-4">
        <h2 className="text-xl font-semibold mb-3">Order Summary</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{subtotal || "$0.00"}</span></div>
          <div className="flex justify-between"><span>Shipping</span><span>{shipping || "$0.00"}</span></div>
          <div className="border-t my-2" />
          <div className="flex justify-between font-medium"><span>Total</span><span>{total || "$0.00"}</span></div>
        </div>
        {checkoutCta?.label && (
          <a href={checkoutCta.href || "#"} className="mt-4 inline-block rounded-md bg-black text-white px-4 py-2">
            {checkoutCta.label}
          </a>
        )}
      </div>
    </section>
  );
}
// ========== EDUCATION & TRAINING COMPONENTS ==========

function CurriculumAccordion({ heading, modules }: any) {
    return (
        <Section>
            <h2 className="text-2xl font-semibold mb-6">{heading}</h2>
            <div className="space-y-2">
                {modules.map((module: any, i: number) => (
                    <details key={i} className="border rounded-lg overflow-hidden">
                        <summary className="p-4 bg-gray-50 cursor-pointer font-medium">
                            {module.title}
                        </summary>
                        <div className="p-4 bg-white">
                            <ul className="space-y-2 pl-5 list-disc">
                                {module.lessons.map((lesson: string, j: number) => (
                                    <li key={j}>{lesson}</li>
                                ))}
                            </ul>
                        </div>
                    </details>
                ))}
            </div>
        </Section>
    );
}


function ServicePackages({ heading, packages = [] }: any) {
  return (
    <Section>
      <h2 className="text-2xl font-semibold mb-6">{heading}</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {packages.map((p:any,i:number)=>(
          <div key={i} className="border rounded-xl p-6">
            <div className="text-lg font-medium">{p.name}</div>
            <div className="mt-1 text-gray-700">{p.interval}</div>
            <div className="mt-3 text-2xl font-semibold">{p.price}</div>
            <ul className="mt-4 space-y-1 text-sm text-gray-700">
              {(p.services||[]).map((s:string,idx:number)=><li key={idx}>• {s}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}
function UseCaseShowcase({ heading, items = [] as any[] }) {
  return (
    <div>
      {heading && <h2 className="text-2xl font-semibold mb-6">{heading}</h2>}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it:any, i:number)=>(
          <a key={i} href={it.href || "#"} className="border rounded-lg overflow-hidden hover:shadow">
            {it.image && <SafeImg src={it.image} alt={it.title} className="w-full h-36 object-cover" />}
            <div className="p-4">
              <div className="font-medium">{it.title}</div>
              {it.desc && <div className="text-sm text-gray-600 mt-1">{it.desc}</div>}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

function SDKDownload({ heading, languages = [], installCommands = [], cta }: any) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">{heading}</h2>
      <div className="flex flex-wrap gap-2 mb-4">
        {languages.map((l:string,i:number)=>(
          <span key={i} className="px-3 py-1 rounded-full bg-black/5 text-sm">{l}</span>
        ))}
      </div>
      <div className="grid gap-3">
        {installCommands.map((x:any, i:number)=>(
          <pre key={i} className="bg-gray-100 text-gray-900 p-3 rounded text-sm overflow-x-auto">
            <b className="mr-2">{x.lang}:</b>{x.cmd}
          </pre>
        ))}
      </div>
      {cta?.label && <a href={cta.href || "#"} className="inline-block mt-4 px-4 py-2 rounded bg-black text-white">{cta.label}</a>}
    </div>
  );
}

function APIEndpoints({ heading, endpoints = [] as any[] }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">{heading}</h2>
      <div className="rounded-xl overflow-hidden border">
        {endpoints.map((e:any,i:number)=>(
          <div key={i} className="grid grid-cols-[90px_1fr_2fr] gap-3 px-4 py-3 border-t first:border-t-0">
            <span className="font-mono text-xs px-2 py-1 bg-black/5 rounded">{e.method}</span>
            <span className="font-mono text-sm">{e.path}</span>
            <span className="text-sm text-gray-700">{e.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}





function SpaAmenities({ heading, items=[] }:any) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">{heading}</h2>
      <div className="flex flex-wrap gap-4">
        {items.map((it:any,i:number)=>(
          <div key={i} className="px-4 py-2 border rounded-full flex items-center gap-2">
            {it.icon && <span>{it.icon}</span>} <span>{it.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SpecialPackages({ heading, packages=[] }:any) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">{heading}</h2>
      <div className="grid gap-6 md:grid-cols-2">
        {packages.map((p:any,i:number)=>(
          <div key={i} className="border rounded-lg p-6">
            <div className="font-semibold">{p.title}</div>
            <div className="text-2xl font-bold">{p.price}</div>
            <ul className="mt-2">{(p.includes||[]).map((f:string,j:number)=><li key={j}>• {f}</li>)}</ul>
            {p.cta?.label && <a href={p.cta.href||"#"} className="block mt-3 px-4 py-2 bg-black text-white rounded">{p.cta.label}</a>}
          </div>
        ))}
      </div>
    </div>
  );
}

function SpaCTA({ heading, subheading, primary }:any) {
  return (
    <div className="text-center py-12">
      <h2 className="text-3xl font-bold">{heading}</h2>
      {subheading && <p className="mt-2 text-gray-600">{subheading}</p>}
      {primary?.label && (
        <a href={primary.href||"#"} className="inline-block mt-5 px-6 py-3 rounded bg-black text-white">
          {primary.label}
        </a>
      )}
    </div>
  );
}

function Changelog({ heading, entries = [] as any[] }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">{heading}</h2>
      <div className="space-y-4">
        {entries.map((en:any,i:number)=>(
          <div key={i} className="border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <span className="font-semibold">{en.version}</span>
              <span className="text-sm text-gray-600">{en.date}</span>
            </div>
            <ul className="mt-2 list-disc list-inside text-sm text-gray-700">
              {(en.notes||[]).map((n:string, j:number)=><li key={j}>{n}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function SystemStatus({ heading, lastUpdated, services = [] as any[] }) {
  const pill = (s:string) =>
    s === "operational" ? "bg-green-100 text-green-800" :
    s === "degraded"    ? "bg-yellow-100 text-yellow-800" :
    "bg-red-100 text-red-800";
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h2 className="text-2xl font-semibold mb-4">{heading}</h2>
        {lastUpdated && <div className="text-xs text-gray-600">Updated {lastUpdated}</div>}
      </div>
      <div className="grid gap-3">
        {services.map((s:any,i:number)=>(
          <div key={i} className="flex items-center justify-between border rounded-lg px-4 py-3">
            <div className="font-medium">{s.name}</div>
            <span className={`text-xs px-2 py-1 rounded ${pill((s.status||"").toLowerCase())}`}>{s.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ArchitectureDiagram({ heading, image, alt, caption }: any) {
  return (
    <div>
      {heading && <h2 className="text-2xl font-semibold mb-4">{heading}</h2>}
      {image && <SafeImg src={image} alt={alt} className="w-full h-72 object-cover rounded-xl" />}
      {caption && <div className="text-sm text-gray-600 mt-2">{caption}</div>}
    </div>
  );
}

function SecurityBadges({ heading, badges = [] as any[] }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">{heading}</h2>
      <div className="flex flex-wrap gap-3">
        {badges.map((b:any,i:number)=>(
          <div key={i} className="flex items-center gap-2 bg-black/5 rounded-full px-3 py-2">
            {b.icon && <img src={b.icon} className="h-5 w-5 object-contain" alt={b.label} />}
            <span className="text-sm font-medium">{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComplianceBadges({ heading, items = [] as any[] }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">{heading}</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        {items.map((it:any,i:number)=>(
          <div key={i} className="border rounded-lg px-4 py-3">
            <div className="font-medium">{it.label}</div>
            {it.desc && <div className="text-sm text-gray-600">{it.desc}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function TutorialsList({ heading, items = [] as any[] }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">{heading}</h2>
      <div className="grid gap-3">
        {items.map((it:any,i:number)=>(
          <a key={i} href={it.href || "#"} className="border rounded-lg px-4 py-3 hover:shadow">
            <div className="font-medium">{it.title}</div>
            <div className="text-xs text-gray-600">{it.duration}</div>
          </a>
        ))}
      </div>
    </div>
  );
}

function InstallSteps({ heading, steps = [] as any[] }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">{heading}</h2>
      <ol className="space-y-4">
        {steps.map((s:any,i:number)=>(
          <li key={i} className="border rounded-lg p-4">
            <div className="font-medium">{i+1}. {s.title}</div>
            {s.text && <div className="text-sm text-gray-700 mt-1">{s.text}</div>}
            {s.code && <pre className="bg-gray-100 text-gray-900 mt-2 p-3 rounded text-sm overflow-x-auto">{s.code}</pre>}
          </li>
        ))}
      </ol>
    </div>
  );
}

function CustomersLogos({ heading, logos = [] as any[] }) {
  return (
    <div>
      {heading && <h2 className="text-2xl font-semibold mb-4">{heading}</h2>}
      <div className="flex flex-wrap items-center gap-6 opacity-80">
        {logos.map((l:any,i:number)=>(
          <img key={i} src={l.src} alt={l.alt || "logo"} className="h-8 object-contain" />
        ))}
      </div>
    </div>
  );
}

function VehicleComparison({ heading, models = [] }: any) {
  const specKeys = Array.from(new Set(models.flatMap((m:any)=>Object.keys(m.specs||{}))));
  return (
    <Section>
      <h2 className="text-2xl font-semibold mb-6">{heading}</h2>
      <div className="overflow-auto">
        <table className="min-w-full border rounded-xl overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left border">Model</th>
              {specKeys.map((k)=> <th key={k} className="p-3 text-left border">{k}</th>)}
            </tr>
          </thead>
          <tbody>
            {models.map((m:any,i:number)=>(
              <tr key={i} className="odd:bg-white even:bg-gray-50">
                <td className="p-3 border font-medium">{m.name}</td>
                {specKeys.map((k)=> <td key={k} className="p-3 border">{m.specs?.[k] || "-"}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function LookbookGallery({ heading, looks = [] }: any) {
  return (
    <Section>
      <h2 className="text-2xl font-semibold mb-6">{heading}</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {looks.map((l:any,i:number)=>(
          <div key={i} className="border rounded-xl overflow-hidden">
            <SafeImg src={l.image} alt={`Look ${i+1}`} className="w-full h-64 object-cover" />
            <div className="p-4 text-sm text-gray-700">
              {(l.products||[]).join(" • ")}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function FitGuide({ heading, steps = [] }: any) {
  return (
    <Section>
      <h2 className="text-2xl font-semibold mb-6">{heading}</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {steps.map((s:any,i:number)=>(
          <div key={i} className="border rounded-xl overflow-hidden">
            <SafeImg src={s.image} alt={`Step ${i+1}`} className="w-full h-56 object-cover" />
            <div className="p-4 text-sm">{s.instruction}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function RateTable({ heading, products = [] }: any) {
  const rateKeys = Array.from(new Set(products.flatMap((p:any)=>Object.keys(p.rates||{}))));
  return (
    <Section>
      <h2 className="text-2xl font-semibold mb-6">{heading}</h2>
      <div className="overflow-auto">
        <table className="min-w-full border rounded-xl overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left border">Product</th>
              {rateKeys.map((k)=> <th key={k} className="p-3 text-left border">{k}</th>)}
            </tr>
          </thead>
          <tbody>
            {products.map((p:any,i:number)=>(
              <tr key={i} className="odd:bg-white even:bg-gray-50">
                <td className="p-3 border font-medium">{p.name}</td>
                {rateKeys.map((k)=> <td key={k} className="p-3 border">{p.rates?.[k] || "-"}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function RetirementCalculator({ heading, inputs = [], outputs = [] }: any) {
  // purely presentational for now
  return (
    <Section>
      <h2 className="text-2xl font-semibold mb-6">{heading}</h2>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="border rounded-xl p-6">
          <div className="font-medium mb-3">Inputs</div>
          <div className="grid gap-3">
            {inputs.map((f:string,i:number)=>(
              <input key={i} placeholder={f} className="border rounded px-3 py-2" />
            ))}
          </div>
          <button className="mt-4 px-4 py-2 bg-black text-white rounded">Calculate</button>
        </div>
        <div className="border rounded-xl p-6">
          <div className="font-medium mb-3">Outputs</div>
          <ul className="text-gray-700">
            {outputs.map((o:string,i:number)=><li key={i}>• {o}</li>)}
          </ul>
        </div>
      </div>
    </Section>
  );
}

function ImpactMeter({ goal, current, description }: any) {
  const g = Number(String(goal).replace(/[^0-9.]/g,"")) || 1;
  const c = Math.min(g, Number(String(current).replace(/[^0-9.]/g,"")) || 0);
  const pct = Math.round((c/g)*100);
  return (
    <Section>
      <div className="border rounded-xl p-6">
        <div className="mb-2 text-gray-700">{description}</div>
        <div className="h-3 bg-gray-200 rounded">
          <div className="h-3 bg-green-600 rounded" style={{width:`${pct}%`}} />
        </div>
        <div className="mt-2 text-sm text-gray-600">{pct}% of goal</div>
      </div>
    </Section>
  );
}

function DonationTiers({ heading, tiers = [] }: any) {
  return (
    <Section>
      <h2 className="text-2xl font-semibold mb-6">{heading}</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {tiers.map((t:any,i:number)=>(
          <div key={i} className="border rounded-xl p-6">
            <div className="text-2xl font-semibold">{t.amount}</div>
            <div className="mt-2 text-gray-700">{t.impact}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function VenueShowcase({ heading, venues = [] }: any) {
  return (
    <Section>
      <h2 className="text-2xl font-semibold mb-6">{heading}</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {venues.map((v:any,i:number)=>(
          <div key={i} className="border rounded-xl overflow-hidden">
            <SafeImg src={v.image} alt={v.name} className="w-full h-56 object-cover" />
            <div className="p-4 text-sm">
              <div className="font-medium">{v.name}</div>
              <div className="text-gray-700">Capacity: {v.capacity}</div>
              <div className="text-gray-700 mt-1">{(v.features||[]).join(" • ")}</div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function EventTimeline({ heading, milestones = [] }: any) {
  return (
    <Section>
      <h2 className="text-2xl font-semibold mb-6">{heading}</h2>
      <ol className="space-y-4">
        {milestones.map((m:any,i:number)=>(
          <li key={i} className="border rounded-xl p-4">
            <div className="font-medium">{m.time} — {m.task}</div>
            <div className="text-sm text-gray-700">{m.responsible}</div>
          </li>
        ))}
      </ol>
    </Section>
  );
}

function StyleQuiz({ heading, questions = [], results = [] }: any) {
  return (
    <Section>
      <h2 className="text-2xl font-semibold mb-6">{heading}</h2>
      <div className="space-y-6">
        {questions.map((q:any,i:number)=>(
          <div key={i} className="border rounded-xl p-4">
            <div className="font-medium mb-2">{q.text}</div>
            <div className="flex flex-wrap gap-2">
              {(q.options||[]).map((opt:string,idx:number)=>
                <button key={idx} className="px-3 py-1 rounded border">{opt}</button>
              )}
            </div>
          </div>
        ))}
      </div>
      {!!results.length && <div className="mt-6 text-sm text-gray-600">Results: {results.join(", ")}</div>}
    </Section>
  );
}

function RoomVisualizer({ heading, projects = [] }: any) {
  return (
    <Section>
      <h2 className="text-2xl font-semibold mb-6">{heading}</h2>
      <div className="grid md:grid-cols-2 gap-6">
        {projects.map((p:any,i:number)=>(
          <div key={i} className="border rounded-xl overflow-hidden">
            <div className="grid grid-cols-2 gap-0">
              <SafeImg src={p.before} alt="Before" className="w-full h-48 object-cover" />
              <SafeImg src={p.after}  alt="After"  className="w-full h-48 object-cover" />
            </div>
            <div className="p-4 text-sm text-gray-700">{p.description}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function ClientPortfolio({ heading, cases = [] }: any) {
  return (
    <Section>
      <h2 className="text-2xl font-semibold mb-6">{heading}</h2>
      <div className="space-y-4">
        {cases.map((c:any,i:number)=>(
          <div key={i} className="border rounded-xl p-6">
            <div className="font-semibold">{c.client}</div>
            <div className="mt-1 text-gray-700"><b>Challenge:</b> {c.challenge}</div>
            <div className="mt-1 text-gray-700"><b>Solution:</b> {c.solution}</div>
            <div className="mt-1 text-gray-700"><b>Results:</b> {c.results}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function ServiceProcess({ heading, steps = [] }: any) {
  return (
    <Section>
      <h2 className="text-2xl font-semibold mb-6">{heading}</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {steps.map((s:any,i:number)=>(
          <div key={i} className="border rounded-xl p-6 text-center">
            {s.icon && <SafeImg src={s.icon} alt="" className="mx-auto h-10 w-10 object-contain" />}
            <div className="mt-2 font-medium">{s.name}</div>
            <div className="mt-1 text-sm text-gray-700">{s.description}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}


function InstructorHighlight({ name, credentials, bio, image }: any) {
    return (
        <Section>
            <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="w-full md:w-1/3">
                    <SafeImg
                        src={image}
                        alt={name}
                        className="rounded-lg w-full h-64 object-cover"
                    />
                </div>
                <div className="w-full md:w-2/3">
                    <h2 className="text-2xl font-semibold">{name}</h2>
                    {credentials.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                            {credentials.map((cred: string, i: number) => (
                                <span key={i} className="px-2 py-1 bg-gray-100 rounded text-sm">
                  {cred}
                </span>
                            ))}
                        </div>
                    )}
                    <p className="mt-4 text-gray-700">{bio}</p>
                </div>
            </div>
        </Section>
    );
}

function LearningPath({ heading, steps }: any) {
    return (
        <Section>
            <h2 className="text-2xl font-semibold mb-6">{heading}</h2>
            <div className="space-y-8">
                {steps.map((step: any, i: number) => (
                    <div key={i} className="flex gap-4">
                        <div className="flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-medium">
                                {i + 1}
                            </div>
                            {i < steps.length - 1 && (
                                <div className="w-0.5 h-full bg-gray-200"></div>
                            )}
                        </div>
                        <div className="pb-6">
                            <h3 className="font-medium text-lg">{step.level}</h3>
                            <ul className="mt-2 space-y-1">
                                {step.skills.map((skill: string, j: number) => (
                                    <li key={j} className="text-gray-700">• {skill}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>
        </Section>
    );
}

// ========== E-COMMERCE COMPONENTS ==========

function ProductCarousel({ heading, products }: any) {
    return (
        <Section>
            <h2 className="text-2xl font-semibold mb-6">{heading}</h2>
            <div className="relative">
                <div className="flex overflow-x-auto pb-4 gap-4 scrollbar-hide">
                    {products.map((product: any, i: number) => (
                        <div key={i} className="flex-shrink-0 w-64 border rounded-lg overflow-hidden">
                            <SafeImg
                                src={product.image}
                                alt={product.name}
                                className="w-full h-48 object-cover"
                            />
                            <div className="p-4">
                                <h3 className="font-medium">{product.name}</h3>
                                <div className="text-gray-700 mt-1">{product.price}</div>
                                <a
                                    href={product.href}
                                    className="mt-3 inline-block text-sm text-blue-600 hover:underline"
                                >
                                    View Details
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Section>
    );
}

function SizeGuide({ heading, table }: any) {
    const headers: string[] = Array.isArray(table?.headers) ? table.headers : [];
    const rows: string[][] =
        Array.isArray(table?.rows) ? table.rows.filter(Array.isArray) : [];

    return (
        <section className="mx-auto max-w-6xl px-4 py-12">
            <h2 className="text-2xl font-semibold mb-6">{heading || "Size Guide"}</h2>

            <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                    <tr>
                        {headers.map((header, i) => (
                            <th key={i} className="p-3 text-left border">
                                {header}
                            </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {rows.map((row, rIdx) => (
                        <tr key={rIdx} className={rIdx % 2 ? "bg-white" : "bg-gray-50"}>
                            {row.map((cell, cIdx) => (
                                <td key={cIdx} className="p-3 border">
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                    {!rows.length && (
                        <tr>
                            <td className="p-3 border text-gray-500" colSpan={headers.length || 1}>
                                No data
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}


function ShippingTiers({ heading, options }: any) {
    return (
        <Section>
            <h2 className="text-2xl font-semibold mb-6">{heading}</h2>
            <div className="grid md:grid-cols-3 gap-4">
                {options.map((option: any, i: number) => (
                    <div key={i} className="border rounded-lg p-4">
                        <h3 className="font-medium">{option.name}</h3>
                        <div className="mt-2 text-2xl font-semibold">{option.price}</div>
                        <div className="mt-2 text-gray-700">{option.delivery}</div>
                    </div>
                ))}
            </div>
        </Section>
    );
}

// ========== TRAVEL COMPONENTS ==========

function DestinationGrid({ heading, destinations }: any) {
    return (
        <Section>
            <h2 className="text-2xl font-semibold mb-6">{heading}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {destinations.map((dest: any, i: number) => (
                    <div key={i} className="border rounded-lg overflow-hidden">
                        <SafeImg
                            src={dest.image}
                            alt={dest.name}
                            className="w-full h-48 object-cover"
                        />
                        <div className="p-4">
                            <h3 className="font-medium text-lg">{dest.name}</h3>
                            <div className="mt-2 text-gray-700">
                                From {dest.price}
                            </div>
                            <ul className="mt-3 space-y-1">
                                {dest.highlights.map((highlight: string, j: number) => (
                                    <li key={j} className="text-sm">• {highlight}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>
        </Section>
    );
}

function ItineraryDay({ day, activities }: any) {
    return (
        <Section>
            <h2 className="text-2xl font-semibold mb-6">{day}</h2>
            <div className="space-y-4">
                {activities.map((activity: any, i: number) => (
                    <div key={i} className="border-l-4 border-blue-500 pl-4 py-2">
                        <div className="font-medium">{activity.time}</div>
                        <p className="mt-1 text-gray-700">{activity.description}</p>
                        {activity.included.length > 0 && (
                            <ul className="mt-2 space-y-1 text-sm text-gray-600">
                                {activity.included.map((item: string, j: number) => (
                                    <li key={j}>✓ {item}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                ))}
            </div>
        </Section>
    );
}

function SeasonalPromo({ heading, validDates, included, cta }: any) {
    return (
        <Section>
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white">
                <h2 className="text-2xl font-semibold">{heading}</h2>
                <div className="mt-2 text-blue-100">Valid: {validDates}</div>

                <ul className="mt-4 space-y-2">
                    {included.map((item: string, i: number) => (
                        <li key={i} className="flex items-start">
                            <svg className="h-5 w-5 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {item}
                        </li>
                    ))}
                </ul>

                <a
                    href={cta.href}
                    className="mt-6 inline-block px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100"
                >
                    {cta.label}
                </a>
            </div>
        </Section>
    );
}

// ========== CONSTRUCTION COMPONENTS ==========

function ProjectTimeline({ heading, phases }: any) {
    return (
        <Section>
            <h2 className="text-2xl font-semibold mb-8">{heading}</h2>
            <div className="relative">
                <div className="absolute left-4 h-full w-0.5 bg-gray-200"></div>
                {phases.map((phase: any, i: number) => (
                    <div key={i} className="relative pl-12 pb-8">
                        <div className="absolute left-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                            {i + 1}
                        </div>
                        <h3 className="text-lg font-medium">{phase.name}</h3>
                        <div className="text-sm text-gray-600 mt-1">{phase.duration}</div>
                        <ul className="mt-3 space-y-1">
                            {phase.milestones.map((milestone: string, j: number) => (
                                <li key={j} className="text-gray-700">• {milestone}</li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </Section>
    );
}

function MaterialShowcase({ heading, materials }: any) {
    return (
        <Section>
            <h2 className="text-2xl font-semibold mb-6">{heading}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {materials.map((material: any, i: number) => (
                    <div key={i} className="border rounded-lg overflow-hidden">
                        <SafeImg
                            src={material.image}
                            alt={material.name}
                            className="w-full h-48 object-cover"
                        />
                        <div className="p-4">
                            <h3 className="font-medium">{material.name}</h3>
                            <ul className="mt-2 space-y-1">
                                {material.benefits.map((benefit: string, j: number) => (
                                    <li key={j} className="text-sm text-gray-700">• {benefit}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>
        </Section>
    );
}
function BlogList({ heading, items = [] }: any) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      {heading && <h2 className="text-2xl font-semibold mb-6">{heading}</h2>}
      <div className="grid sm:grid-cols-2 gap-4">
        {items.map((p: any, i: number) => (
          <article key={i} className="rounded-lg border border-black/10 p-4">
            <h3 className="font-medium">{p.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{p.excerpt}</p>
            {p.href && <a href={p.href} className="text-sm text-blue-600 mt-2 inline-block">Read more →</a>}
          </article>
        ))}
      </div>
    </section>
  );
}

function DoctorCard({ heading, doctors = [] }: any) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <h2 className="text-2xl font-semibold mb-6">{heading || "Our Doctors"}</h2>
      <div className="grid md:grid-cols-3 gap-8">
        {doctors.map((doc: any, i: number) => (
          <div key={i} className="border rounded-lg p-4 shadow-sm">
            {doc.image && (
              <img src={doc.image} alt={doc.name} className="w-full h-48 object-cover rounded-md mb-4" />
            )}
            <h3 className="font-semibold text-lg">{doc.name}</h3>
            <div className="text-sm text-gray-600">{doc.specialty}</div>
            {doc.bio && <p className="mt-2 text-gray-700 text-sm">{doc.bio}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

function AppointmentList({ heading, appointments = [] }: any) {
  return (
    <section className="mx-auto max-w-4xl px-4 py-12">
      <h2 className="text-2xl font-semibold mb-6">{heading || "Available Appointments"}</h2>
      <ul className="space-y-4">
        {appointments.map((apt: any, i: number) => (
          <li key={i} className="border p-4 rounded-lg flex justify-between items-center">
            <div>
              <div className="font-semibold">{apt.date} – {apt.time}</div>
              {apt.doctor && <div className="text-sm text-gray-600">Dr. {apt.doctor}</div>}
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md">Book</button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PropertyList({ heading, properties = [] }: any) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <h2 className="text-2xl font-semibold mb-6">{heading || "Available Properties"}</h2>
      <div className="grid md:grid-cols-3 gap-8">
        {properties.map((prop: any, i: number) => (
          <div key={i} className="border rounded-lg overflow-hidden shadow-sm">
            {prop.image && <img src={prop.image} alt={prop.title} className="w-full h-48 object-cover" />}
            <div className="p-4">
              <h3 className="font-semibold text-lg">{prop.title}</h3>
              <div className="text-sm text-gray-600">{prop.location}</div>
              <div className="font-semibold mt-2">{prop.price}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PropertyMap({ heading, mapUrl }: any) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <h2 className="text-2xl font-semibold mb-6">{heading || "Property Locations"}</h2>
      {mapUrl ? (
        <iframe
          src={mapUrl}
          className="w-full h-96 rounded-lg border"
          loading="lazy"
          allowFullScreen
        ></iframe>
      ) : (
        <div className="text-gray-600">No map available</div>
      )}
    </section>
  );
}

function CourseList({ heading, courses = [] }: any) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <h2 className="text-2xl font-semibold mb-6">{heading || "Our Courses"}</h2>
      <div className="grid md:grid-cols-2 gap-8">
        {courses.map((course: any, i: number) => (
          <div key={i} className="border rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-lg">{course.title}</h3>
            <div className="text-sm text-gray-600">{course.instructor}</div>
            {course.desc && <p className="mt-2 text-gray-700 text-sm">{course.desc}</p>}
            {course.price && <div className="font-semibold mt-2">{course.price}</div>}
          </div>
        ))}
      </div>
    </section>
  );
}

function CourseSyllabus({ heading, weeks = [] }: any) {
  return (
    <section className="mx-auto max-w-4xl px-4 py-12">
      <h2 className="text-2xl font-semibold mb-6">{heading || "Course Syllabus"}</h2>
      <ul className="space-y-4">
        {weeks.map((week: any, i: number) => (
          <li key={i} className="border rounded-lg p-4">
            <h3 className="font-semibold">Week {i + 1}: {week.title}</h3>
            {week.topics && (
              <ul className="list-disc list-inside mt-2 text-sm text-gray-700">
                {week.topics.map((topic: any, j: number) => (
                  <li key={j}>{topic}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}


function JobList({ heading, jobs = [] }: any) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <h2 className="text-2xl font-semibold mb-6">{heading || "Job Openings"}</h2>
      <div className="space-y-4">
        {jobs.map((job: any, i: number) => (
          <div key={i} className="border p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold text-lg">{job.title}</h3>
            <div className="text-sm text-gray-600">{job.location}</div>
            {job.desc && <p className="mt-2 text-gray-700 text-sm">{job.desc}</p>}
            <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md">Apply</button>
          </div>
        ))}
      </div>
    </section>
  );
}

function RestaurantMenu({ heading, categories = [] as any[] }) {
  return (
    <div>
      {heading && <h2 className="text-2xl font-semibold mb-6">{heading}</h2>}
      <div className="grid md:grid-cols-2 gap-10">
        {categories.map((cat: any, i: number) => (
          <div key={i}>
            <h3 className="font-semibold text-lg mb-4">{cat.name}</h3>
            <ul className="divide-y">
              {(cat.items || []).map((it: any, j: number) => (
                <li key={j} className="py-3 flex items-start justify-between">
                  <div className="pr-4">
                    <div className="font-medium">{it.name}</div>
                    {it.desc && <div className="text-sm text-gray-600">{it.desc}</div>}
                  </div>
                  {it.price && <div className="font-semibold whitespace-nowrap">{it.price}</div>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}


function ReservationForm({ heading, fields = [], submitLabel = "Reserve" }: any) {
  const want = (name: string) => fields.includes(name);
  return (
    <section className="mx-auto max-w-xl px-4 py-12">
      <h2 className="text-2xl font-semibold mb-4">{heading || "Book a Table"}</h2>
      <form className="grid gap-3">
        {want("name") && <input className="w-full border rounded p-2" placeholder="Name" />}
        {want("email") && <input className="w-full border rounded p-2" type="email" placeholder="Email" />}
        {want("phone") && <input className="w-full border rounded p-2" placeholder="Phone" />}
        {want("date") && <input className="w-full border rounded p-2" type="date" />}
        {want("time") && <input className="w-full border rounded p-2" type="time" />}
        {want("partySize") && <input className="w-full border rounded p-2" type="number" placeholder="Party size" />}
        <button className="px-4 py-2 rounded bg-black text-white">{submitLabel}</button>
      </form>
    </section>
  );
}

// Repeat similarly-simple components for: DoctorCard, AppointmentList, PropertyList, PropertyMap, CourseList, CourseSyllabus, JobList.

function Contact({ heading, fields = [], submitLabel = "Send" }: any) {
  return (
    <section id="contact" className="mx-auto max-w-md px-4 py-12">
      <h2 className="text-2xl font-semibold mb-4">{heading || "Contact Us"}</h2>
      <form className="space-y-3">
        {fields.includes("name") && <input className="w-full border rounded p-2" placeholder="Name" />}
        {fields.includes("email") && <input className="w-full border rounded p-2" placeholder="Email" type="email" />}
        {fields.includes("message") && <textarea className="w-full border rounded p-2" placeholder="Message" />}
        <button className="px-4 py-2 rounded bg-black text-white">{submitLabel}</button>
      </form>
    </section>
  );
}

function Stats({ heading, items = [] }: any) {
  // items: [{ label: string, value: string, sublabel?: string }]
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      {heading && <h2 className="text-2xl font-semibold mb-6">{heading}</h2>}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((s: any, i: number) => (
          <div key={i} className="border rounded-lg p-5">
            <div className="text-3xl font-bold">{s.value}</div>
            <div className="mt-1 text-sm text-gray-600">{s.label}</div>
            {s.sublabel && <div className="mt-1 text-xs text-gray-500">{s.sublabel}</div>}
          </div>
        ))}
      </div>
    </section>
  )
}

function Team({ heading, members = [] }: any) {
  // members: [{ name, role, avatar?, bio? }]
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      {heading && <h2 className="text-2xl font-semibold mb-6">{heading}</h2>}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((m: any, i: number) => (
          <div key={i} className="border rounded-lg p-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100">
              <SafeImg src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="font-medium">{m.name}</div>
              <div className="text-sm text-gray-600">{m.role}</div>
              {m.bio && <p className="text-sm text-gray-600 mt-1">{m.bio}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function Steps({ heading, items = [] }: any) {
  // items: [{ title, text }]
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      {heading && <h2 className="text-2xl font-semibold mb-6">{heading}</h2>}
      <ol className="space-y-4">
        {items.map((s: any, i: number) => (
          <li key={i} className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-black text-white flex items-center justify-center">
              {i + 1}
            </div>
            <div>
              <div className="font-medium">{s.title}</div>
              {s.text && <div className="text-sm text-gray-600">{s.text}</div>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}


function AwardsBar({ heading, items = [] as any[] }) {
  return (
    <div>
      {heading && <h2 className="text-2xl font-semibold mb-4">{heading}</h2>}
      <div className="flex flex-wrap gap-3">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2 rounded-full bg-black/5 px-3 py-2">
            {it.icon && (
              <img
                src={/^https?:/.test(it.icon) ? it.icon : fallbackImg}
                alt={it.label || "award"}
                className="h-5 w-5 object-contain"
              />
            )}
            <span className="text-sm font-medium">{it.label}</span>
            {it.value && <span className="text-xs text-gray-600">• {it.value}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}


function ChefBio({ heading, name, role, photo, bio, social = [] }: any) {
  return (
    <section className="mx-auto max-w-4xl px-4 py-12 grid md:grid-cols-[160px_1fr] gap-6 items-start">
      <SafeImg src={photo} alt={name} className="w-40 h-40 object-cover rounded-full" />
      <div>
        {heading && <h2 className="text-2xl font-semibold mb-2">{heading}</h2>}
        <div className="font-semibold">{name} {role && <span className="text-gray-600 font-normal">• {role}</span>}</div>
        <p className="text-gray-700 mt-2">{bio}</p>
        {social.length > 0 && (
          <div className="flex gap-3 mt-3">
            {social.map((s: any, i: number) => <a key={i} href={s.href} className="text-sm underline">{s.label}</a>)}
          </div>
        )}
      </div>
    </section>
  );
}

function DishGrid({ heading, items = [] }: any) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      {heading && <h2 className="text-2xl font-semibold mb-6">{heading}</h2>}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it: any, i: number) => (
          <div key={i} className="border rounded-lg overflow-hidden bg-white">
            <SafeImg src={it.image} alt={it.title} className="w-full h-40 object-cover" />
            <div className="p-4">
              <div className="font-medium">{it.title}</div>
              {it.desc && <div className="text-sm text-gray-600 mt-1">{it.desc}</div>}
              {it.price && <div className="mt-2 font-semibold">{it.price}</div>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function BookingCTA({ heading, subheading, primary, secondary, background }: any) {
  return (
    <section className="relative overflow-hidden">
      {background && <SafeImg src={background} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />}
      <div className="relative mx-auto max-w-5xl px-4 py-16">
        <h2 className="text-3xl font-bold">{heading}</h2>
        {subheading && <p className="text-lg text-gray-700 mt-2">{subheading}</p>}
        <div className="mt-6 flex gap-3">
          {primary?.label && <a href={primary.href || "#"} className="px-5 py-2 rounded bg-black text-white">{primary.label}</a>}
          {secondary?.label && <a href={secondary.href || "#"} className="px-5 py-2 rounded border border-black">{secondary.label}</a>}
        </div>
      </div>
    </section>
  );
}


function Hours({ heading = "Our Hours", items = [] as any[] }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">{heading}</h2>
      <div className="rounded-xl border border-black/10 overflow-hidden">
        {items.map((row: any, i: number) => (
          <div key={i} className="flex justify-between px-4 py-3 border-t first:border-t-0">
            <span>{row.day}</span>
            <span className="text-gray-700">{row.open} — {row.close}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


function LocationMap({ heading, addressLine1, addressLine2, phone, mapIframeSrc }: any) {
  return (
    <div className="grid md:grid-cols-2 gap-6 items-start">
      <div>
        <h2 className="text-2xl font-semibold mb-4">{heading || "Location"}</h2>
        <div className="space-y-1 text-gray-700">
          {addressLine1 && <div>{addressLine1}</div>}
          {addressLine2 && <div>{addressLine2}</div>}
          {phone && <a className="text-blue-600" href={`tel:${phone.replace(/[^0-9+]/g,'')}`}>{phone}</a>}
        </div>
      </div>
      <div className="rounded-xl overflow-hidden border">
        {mapIframeSrc && (
          <iframe
            src={mapIframeSrc}
            className="w-full h-[280px]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        )}
      </div>
    </div>
  );
}

function TestimonialHighlight({ quote, author, role, avatar }: any) {
    return (
        <section className="mx-auto max-w-3xl px-4 py-16 text-center">
            {avatar && <img src={avatar} alt="" className="w-14 h-14 rounded-full mx-auto mb-4" />}
            <p className="text-xl italic">“{quote}”</p>
            <div className="mt-3 text-sm text-gray-700">
                <b>{author}</b>{role ? ` • ${role}` : ""}
            </div>
        </section>
    );
}

function SocialStrip({ items = [] }: any) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap gap-3">
        {items.map((s: any, i: number) => (
          <a key={i} href={s.href} className="px-3 py-1.5 rounded-full border text-sm hover:bg-black hover:text-white transition">
            {s.label}
          </a>
        ))}
      </div>
    </section>
  );
}



function CheckoutForm({ heading = "Checkout", fields = [] as string[], submitLabel = "Pay" }: any) {
  const want = new Set(fields.length ? fields : ["name","email","address","card"]);
  return (
    <section className="mx-auto max-w-lg px-4 py-12">
      <h2 className="text-2xl font-semibold mb-6">{heading}</h2>
      <form className="space-y-3">
        {want.has("name") && <input className="w-full border rounded p-2" placeholder="Full name" />}
        {want.has("email") && <input className="w-full border rounded p-2" placeholder="Email" type="email" />}
        {want.has("address") && <input className="w-full border rounded p-2" placeholder="Address" />}
        {want.has("card") && <input className="w-full border rounded p-2" placeholder="Card number" />}
        <button className="px-4 py-2 rounded bg-black text-white">{submitLabel}</button>
      </form>
    </section>
  )
}


function Footer({ text, links = [] }: any) {
  return (
    <footer className="border-t py-8">
      <div className="mx-auto max-w-6xl px-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">{text || "© 2025"}</div>
        <div className="flex gap-4 text-sm">
          {links.map((l: any, i: number) => (
            <a key={i} href={l.href || "#"} className="text-gray-700 hover:text-black">
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}






// ========== TECHNOLOGY & SOFTWARE ==========
function FeatureComparison({ heading, items = [], legend = [] }: any) {
    return (
        <Section>
            <h2 className="text-2xl font-semibold mb-6">{heading || "Feature Comparison"}</h2>
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                    <tr>
                        <th className="text-left p-3 border-b">Feature</th>
                        {legend.map((item: string, i: number) => (
                            <th key={i} className="text-center p-3 border-b">{item}</th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {items.map((row: any, i: number) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                            <td className="p-3 border-b font-medium">{row.feature}</td>
                            {row.values.map((value: string, j: number) => (
                                <td key={j} className="p-3 border-b text-center">
                                    {value === 'true' ? '✓' : value === 'false' ? '✗' : value}
                                </td>
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </Section>
    );
}

function APIDocs({ heading, endpoints = [] }: any) {
    return (
        <Section>
            <h2 className="text-2xl font-semibold mb-6">{heading || "API Documentation"}</h2>
            <div className="space-y-6">
                {endpoints.map((endpoint: any, i: number) => (
                    <div key={i} className="border rounded-lg p-4">
                        <div className="flex items-baseline gap-2">
              <span className={`px-2 py-1 rounded text-xs font-mono ${
                  endpoint.method === 'GET' ? 'bg-blue-100 text-blue-800' :
                      endpoint.method === 'POST' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
              }`}>
                {endpoint.method}
              </span>
                            <code className="font-mono text-sm">{endpoint.path}</code>
                        </div>
                        <p className="mt-2 text-gray-700">{endpoint.description}</p>
                        {endpoint.params?.length > 0 && (
                            <div className="mt-3">
                                <h4 className="text-sm font-medium mb-1">Parameters:</h4>
                                <ul className="space-y-1">
                                    {endpoint.params.map((param: any, j: number) => (
                                        <li key={j} className="text-sm font-mono">
                                            {param.name}: <span className="text-gray-600">{param.type}</span>
                                            {param.required && <span className="ml-1 text-red-500">*</span>}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </Section>
    );
}

// ========== HEALTHCARE & MEDICAL ==========
function InsuranceAccepted({ heading, providers = [] }: any) {
    return (
        <Section>
            <h2 className="text-2xl font-semibold mb-6">{heading || "Insurance Accepted"}</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {providers.map((provider: string, i: number) => (
                    <div key={i} className="border p-3 rounded-lg flex items-center">
                        <span className="mr-2">✓</span>
                        <span>{provider}</span>
                    </div>
                ))}
            </div>
        </Section>
    );
}

// ========== FITNESS & WELLNESS ==========
function ClassSchedule({ heading, days = [] }: any) {
    return (
        <Section>
            <h2 className="text-2xl font-semibold mb-6">{heading || "Class Schedule"}</h2>
            <div className="space-y-6">
                {days.map((day: any, i: number) => (
                    <div key={i} className="border rounded-lg overflow-hidden">
                        <h3 className="bg-gray-100 p-3 font-medium">{day.day}</h3>
                        <ul className="divide-y">
                            {day.sessions.map((session: any, j: number) => (
                                <li key={j} className="p-3 flex justify-between items-center">
                                    <div>
                                        <span className="font-medium">{session.time}</span>
                                        <span className="mx-2">-</span>
                                        <span>{session.class}</span>
                                    </div>
                                    <span className="text-sm text-gray-600">{session.instructor}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </Section>
    );
}




function PatientPortalCTA({ heading, description, cta }: any) {
    return (
        <Section>
            <div className="bg-blue-50 rounded-xl p-8 md:p-10">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-2xl font-semibold mb-4">{heading}</h2>
                    <p className="text-gray-700 mb-6">{description}</p>
                    {cta && (
                        <a
                            href={cta.href || "#"}
                            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                        >
                            {cta.label}
                        </a>
                    )}
                </div>
            </div>
        </Section>
    );
}

function ServiceTiers({ heading, tiers = [] }: any) {
    return (
        <Section>
            <h2 className="text-2xl font-semibold mb-8">{heading || "Service Packages"}</h2>
            <div className="grid md:grid-cols-3 gap-6">
                {tiers.map((tier: any, i: number) => (
                    <div key={i} className="border rounded-xl overflow-hidden">
                        <div className="bg-gray-100 p-6">
                            <h3 className="font-bold text-xl">{tier.name}</h3>
                            <div className="mt-2 text-2xl font-semibold">{tier.price}</div>
                        </div>
                        <div className="p-6">
                            <ul className="space-y-2 mb-6">
                                {tier.includes.map((item: string, j: number) => (
                                    <li key={j} className="flex items-start">
                                        <span className="mr-2 text-green-500">✓</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                            {tier.cta && (
                                <a
                                    href={tier.cta.href || "#"}
                                    className="block w-full text-center px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50"
                                >
                                    {tier.cta.label || "Get Started"}
                                </a>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </Section>
    );
}

function TelehealthInfo({ heading, description, steps = [], cta }: any) {
    return (
        <Section>
            <h2 className="text-2xl font-semibold mb-6">{heading || "Telehealth Visits"}</h2>
            <p className="text-gray-700 mb-8 max-w-3xl">
                {description || "Connect with your healthcare provider from the comfort of your home."}
            </p>

            <div className="grid md:grid-cols-3 gap-8 mb-10">
                {steps.map((step: string, i: number) => (
                    <div key={i} className="flex flex-col items-center text-center">
                        <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3 font-bold">
                            {i + 1}
                        </div>
                        <p className="text-gray-700">{step}</p>
                    </div>
                ))}
            </div>

            {cta && (
                <div className="text-center">
                    <a
                        href={cta.href || "#"}
                        className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                    >
                        {cta.label || "Schedule Virtual Visit"}
                    </a>
                </div>
            )}
        </Section>
    );
}



function TrainerProfiles({ heading, trainers = [] }: any) {
    return (
        <Section>
            <h2 className="text-2xl font-semibold mb-8">{heading || "Our Trainers"}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {trainers.map((trainer: any, i: number) => (
                    <div key={i} className="border rounded-lg overflow-hidden shadow-sm">
                        <SafeImg
                            src={trainer.photo}
                            alt={trainer.name}
                            className="w-full h-60 object-cover"
                        />
                        <div className="p-6">
                            <h3 className="font-bold text-lg">{trainer.name}</h3>
                            {trainer.specialties && trainer.specialties.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                    {trainer.specialties.map((spec: string, j: number) => (
                                        <span
                                            key={j}
                                            className="inline-block px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full"
                                        >
                      {spec}
                    </span>
                                    ))}
                                </div>
                            )}
                            {trainer.bio && (
                                <p className="mt-3 text-gray-700">{trainer.bio}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </Section>
    );
}

function ResultsTimeline({ heading, milestones = [] }: any) {
    return (
        <Section>
            <h2 className="text-2xl font-semibold mb-8">{heading || "Client Transformations"}</h2>
            <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 md:left-1/2 md:-ml-0.5"></div>

                {milestones.map((milestone: any, i: number) => (
                    <div
                        key={i}
                        className={`relative mb-8 md:flex ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                    >
                        {/* Timeline dot */}
                        <div className="absolute left-0 w-8 h-8 rounded-full bg-blue-500 border-4 border-white flex items-center justify-center md:left-1/2 md:-ml-4">
                            <span className="text-white text-xs font-bold">{i + 1}</span>
                        </div>

                        {/* Content */}
                        <div className={`md:w-5/12 ${i % 2 === 0 ? 'md:pr-8 md:text-right' : 'md:pl-8'}`}>
                            <div className="mt-10 md:mt-0">
                                <div className="text-sm text-gray-500">{milestone.date}</div>
                                <p className="mt-1 text-gray-700">{milestone.text}</p>
                            </div>
                        </div>

                        {/* Image */}
                        <div className="md:w-5/12 mt-4 md:mt-0">
                            <SafeImg
                                src={milestone.image}
                                alt={`Milestone ${i + 1}`}
                                className="rounded-lg shadow-md w-full h-48 object-cover"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </Section>
    );
}

function NutritionPlan({ heading, meals = [] }: any) {
    return (
        <Section>
            <h2 className="text-2xl font-semibold mb-6">{heading || "Nutrition Plan"}</h2>
            <div className="space-y-6">
                {meals.map((meal: any, i: number) => (
                    <div key={i} className="border rounded-lg overflow-hidden shadow-sm">
                        <div className="p-4 bg-gray-50 border-b">
                            <h3 className="font-medium">
                                <span className="text-gray-500">{meal.time}</span> - {meal.name}
                            </h3>
                        </div>
                        <div className="p-4">
                            <p className="text-gray-700">{meal.description}</p>
                            {meal.nutrition && (
                                <div className="mt-3 pt-3 border-t">
                                    <h4 className="text-sm font-medium mb-2">Nutrition Info</h4>
                                    <div className="grid grid-cols-3 gap-2 text-sm">
                                        {Object.entries(meal.nutrition).map(([key, value]) => (
                                            <div key={key} className="bg-gray-50 p-2 rounded text-center">
                                                <div className="font-medium">{value}</div>
                                                <div className="text-xs text-gray-500">{key}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </Section>
    );
}
// ========== REAL ESTATE ==========
function MortgageCalculator({ heading, fields = [], results = [] }: any) {
    return (
        <Section>
            <h2 className="text-2xl font-semibold mb-6">{heading || "Mortgage Calculator"}</h2>
            <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        {fields.includes('price') && (
                            <div>
                                <label className="block text-sm font-medium mb-1">Home Price ($)</label>
                                <input type="number" className="w-full border p-2 rounded" />
                            </div>
                        )}
                        {fields.includes('down') && (
                            <div>
                                <label className="block text-sm font-medium mb-1">Down Payment (%)</label>
                                <input type="number" className="w-full border p-2 rounded" />
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {fields.includes('rate') && (
                            <div>
                                <label className="block text-sm font-medium mb-1">Interest Rate (%)</label>
                                <input type="number" step="0.01" className="w-full border p-2 rounded" />
                            </div>
                        )}
                        {fields.includes('term') && (
                            <div>
                                <label className="block text-sm font-medium mb-1">Loan Term (years)</label>
                                <input type="number" className="w-full border p-2 rounded" />
                            </div>
                        )}
                    </div>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-md">
                        Calculate
                    </button>
                </div>
                <div className="border rounded-lg p-6 bg-gray-50">
                    <h3 className="font-medium mb-4">Estimated Payment</h3>
                    {results.includes('monthly') && (
                        <div className="flex justify-between py-2 border-b">
                            <span>Monthly Payment</span>
                            <span className="font-medium">$1,850</span>
                        </div>
                    )}
                    {results.includes('total') && (
                        <div className="flex justify-between py-2">
                            <span>Total Interest</span>
                            <span className="font-medium">$156,200</span>
                        </div>
                    )}
                </div>
            </div>
        </Section>
    );
}



function IntegrationGrid({ heading, items = [] }: any) {
    return (
        <Section>
            <h2 className="text-2xl font-semibold mb-8">{heading || "Integrations"}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {items.map((item: any, i: number) => (
                    <div key={i} className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 mb-3 flex items-center justify-center">
                            <SafeImg
                                src={item.logo}
                                alt={item.name}
                                className="object-contain max-h-full"
                            />
                        </div>
                        <h3 className="font-medium text-sm">{item.name}</h3>
                        {item.description && (
                            <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                        )}
                    </div>
                ))}
            </div>
        </Section>
    );
}



function ServiceMenu({ heading, categories = [] }: any) {
    return (
        <Section>
            <h2 className="text-2xl font-semibold mb-6">{heading}</h2>
            <div className="space-y-8">
                {categories.map((category: any, i: number) => (
                    <div key={i} className="border rounded-lg overflow-hidden">
                        <h3 className="bg-gray-100 p-4 font-medium">{category.name}</h3>
                        <ul className="divide-y">
                            {category.services.map((service: any, j: number) => (
                                <li key={j} className="p-4 flex justify-between">
                                    <div>
                                        <h4 className="font-medium">{service.name}</h4>
                                        <p className="text-sm text-gray-600">{service.duration}</p>
                                    </div>
                                    <span className="font-semibold">{service.price}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </Section>
    );
}

function GiftCardGrid({ heading, cards = [] }: any) {
    return (
        <Section>
            <h2 className="text-2xl font-semibold mb-6">{heading}</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                {cards.map((card: any, i: number) => (
                    <div key={i} className="border rounded-lg p-6 text-center">
                        <div className="text-2xl font-bold mb-2">{card.value}</div>
                        {card.bonus && <div className="text-sm text-green-600 mb-4">{card.bonus}</div>}
                        <a
                            href={card.cta?.href || "#"}
                            className="inline-block px-4 py-2 bg-black text-white rounded-md text-sm"
                        >
                            {card.cta?.label || "Purchase"}
                        </a>
                    </div>
                ))}
            </div>
        </Section>
    );
}

function ProductSpotlight({ heading, products = [] }: any) {
    return (
        <Section>
            <h2 className="text-2xl font-semibold mb-6">{heading}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {products.map((product: any, i: number) => (
                    <div key={i} className="border rounded-lg overflow-hidden">
                        <SafeImg src={product.image} alt={product.name} className="w-full h-48 object-cover" />
                        <div className="p-4">
                            <div className="text-sm text-gray-600">{product.brand}</div>
                            <h3 className="font-medium">{product.name}</h3>
                            <div className="mt-2 font-semibold">{product.price}</div>
                        </div>
                    </div>
                ))}
            </div>
        </Section>
    );
}

// Legal Components
function PracticeAreas({ heading, areas = [] }: any) {
    return (
        <Section>
            <h2 className="text-2xl font-semibold mb-6">{heading}</h2>
            <div className="grid md:grid-cols-2 gap-8">
                {areas.map((area: any, i: number) => (
                    <div key={i} className="border rounded-lg p-6">
                        <div className="flex items-start">
                            {area.icon && (
                                <img src={area.icon} alt="" className="w-10 h-10 mr-4" />
                            )}
                            <div>
                                <h3 className="font-bold text-lg">{area.name}</h3>
                                <p className="mt-2 text-gray-700">{area.description}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Section>
    );
}

function CaseResults({ heading, cases = [] }: any) {
    return (
        <Section>
            <h2 className="text-2xl font-semibold mb-6">{heading}</h2>
            <div className="space-y-4">
                {cases.map((caseItem: any, i: number) => (
                    <div key={i} className="border-l-4 border-blue-500 pl-4 py-2">
                        <div className="font-medium">{caseItem.type}</div>
                        <div className="text-gray-700">{caseItem.outcome}</div>
                    </div>
                ))}
            </div>
        </Section>
    );
}

function AttorneyProfile({ name, photo, title, education = [], barAdmissions = [] }: any) {
    return (
        <Section>
            <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-1/3">
                    <SafeImg src={photo} alt={name} className="rounded-lg w-full" />
                </div>
                <div className="md:w-2/3">
                    <h2 className="text-2xl font-bold">{name}</h2>
                    <div className="text-lg text-gray-600 mb-4">{title}</div>

                    <h3 className="font-semibold mt-6 mb-2">Education</h3>
                    <ul className="list-disc pl-5 space-y-1">
                        {education.map((item: string, i: number) => (
                            <li key={i}>{item}</li>
                        ))}
                    </ul>

                    <h3 className="font-semibold mt-6 mb-2">Bar Admissions</h3>
                    <ul className="list-disc pl-5 space-y-1">
                        {barAdmissions.map((item: string, i: number) => (
                            <li key={i}>{item}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </Section>
    );
}


// Real Estate Components
function PropertySearch({ heading, filters = [], sortOptions = [] }: any) {
    return (
        <Section>
            <h2 className="text-2xl font-semibold mb-6">{heading}</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
                <div className="grid md:grid-cols-4 gap-4 mb-4">
                    {filters.map((filter: string, i: number) => (
                        <div key={i}>
                            <label className="block text-sm font-medium mb-1">{filter}</label>
                            <input
                                type="text"
                                className="w-full border p-2 rounded"
                                placeholder={`Filter by ${filter}`}
                            />
                        </div>
                    ))}
                </div>
                <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                        {sortOptions.length > 0 && (
                            <>
                                <span className="mr-2">Sort by:</span>
                                <select className="border p-1 rounded">
                                    {sortOptions.map((option: string, i: number) => (
                                        <option key={i} value={option}>{option}</option>
                                    ))}
                                </select>
                            </>
                        )}
                    </div>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-md">
                        Search Properties
                    </button>
                </div>
            </div>
        </Section>
    );
}

function NeighborhoodGuide({ heading, features = [] }: any) {
    return (
        <Section>
            <h2 className="text-2xl font-semibold mb-6">{heading}</h2>
            <div className="grid md:grid-cols-2 gap-8">
                {features.map((feature: any, i: number) => (
                    <div key={i} className="border rounded-lg p-6">
                        <h3 className="font-bold text-lg mb-2">{feature.name}</h3>
                        <p className="text-gray-700 mb-2">{feature.description}</p>
                        {feature.distance && (
                            <div className="text-sm text-gray-500">{feature.distance} away</div>
                        )}
                    </div>
                ))}
            </div>
        </Section>
    );
}


function DemoRequest({ heading, fields = [], submitLabel = "Request Demo" }: any) {
    return (
        <Section>
            <h2 className="text-2xl font-semibold mb-6">{heading || "Schedule a Demo"}</h2>
            <form className="max-w-lg space-y-4">
                {fields.includes('name') && (
                    <div>
                        <label className="block text-sm font-medium mb-1">Full Name</label>
                        <input type="text" className="w-full border p-2 rounded" required />
                    </div>
                )}
                {fields.includes('email') && (
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input type="email" className="w-full border p-2 rounded" required />
                    </div>
                )}
                {fields.includes('company') && (
                    <div>
                        <label className="block text-sm font-medium mb-1">Company</label>
                        <input type="text" className="w-full border p-2 rounded" />
                    </div>
                )}
                {fields.includes('useCase') && (
                    <div>
                        <label className="block text-sm font-medium mb-1">Use Case</label>
                        <textarea className="w-full border p-2 rounded" rows={3} />
                    </div>
                )}
                <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                    {submitLabel}
                </button>
            </form>
        </Section>
    );
}

function CodeSample({ language = "javascript", code = "", description }: any) {
    return (
        <Section>
            <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-800 text-gray-100 px-4 py-2 text-sm font-mono">
                    {language.toUpperCase()}
                </div>
                <pre className="p-4 bg-gray-900 text-gray-100 overflow-x-auto">
          <code>{code}</code>
        </pre>
            </div>
            {description && (
                <p className="mt-3 text-gray-700">{description}</p>
            )}
        </Section>
    );
}

function IntroSection({ heading, text, image, cta }: any) {
  return (
    <div className="grid md:grid-cols-[1fr_380px] gap-8 items-center">
      <div>
        {heading && <h2 className="text-3xl font-bold">{heading}</h2>}
        {text && <p className="mt-3 text-gray-700 leading-relaxed">{text}</p>}
        {cta?.label && (
          <a href={cta.href || "#"} className="inline-block mt-6 px-4 py-2 rounded bg-black text-white">
            {cta.label}
          </a>
        )}
      </div>
      {image && <SafeImg src={image} alt={heading || ""} className="w-full h-64 object-cover rounded-xl" />}
    </div>
  );
}

function SplitFeature({ left, right }: any) {
  const Block = ({ b }: any) => (
    <div className="rounded-2xl border p-6 bg-white">
      {b.image && <SafeImg src={b.image} alt={b.heading || ""} className="w-full h-40 object-cover rounded-lg mb-4" />}
      {b.heading && <h3 className="text-xl font-semibold">{b.heading}</h3>}
      {b.text && <p className="text-gray-700 mt-2">{b.text}</p>}
      {b.cta?.label && (
        <a href={b.cta.href || "#"} className="inline-block mt-4 px-4 py-2 rounded bg-black text-white text-sm">
          {b.cta.label}
        </a>
      )}
    </div>
  );
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Block b={left || {}} />
      <Block b={right || {}} />
    </div>
  );
}

function ValueBadges({ heading, items = [] }: any) {
  return (
    <div>
      {heading && <h2 className="text-2xl font-semibold mb-4">{heading}</h2>}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {items.map((it: any, i: number) => (
          <div key={i} className="rounded-xl border p-4 bg-white flex items-start gap-3">
            {it.icon && <span className="text-2xl">{it.icon}</span>}
            <div>
              <div className="font-semibold">{it.label}</div>
              {it.text && <div className="text-gray-600 text-sm mt-1">{it.text}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CTASection({ heading, subheading, primary, secondary, background }: any) {
  return (
    <div className="relative overflow-hidden rounded-2xl">
      {background && <SafeImg src={background} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />}
      <div className="relative px-6 py-16 md:py-20">
        {heading && <h2 className="text-3xl font-bold">{heading}</h2>}
        {subheading && <p className="text-gray-700 mt-2 text-lg">{subheading}</p>}
        <div className="mt-6 flex gap-3">
          {primary?.label && <a href={primary.href || "#"} className="px-5 py-2 rounded bg-black text-white">{primary.label}</a>}
          {secondary?.label && <a href={secondary.href || "#"} className="px-5 py-2 rounded border border-black">{secondary.label}</a>}
        </div>
      </div>
    </div>
  );
}

function NewsletterSignup({ heading, subheading, placeholder, submitLabel }: any) {
  return (
    <div className="rounded-2xl border p-8 bg-white">
      {heading && <h3 className="text-xl font-semibold">{heading}</h3>}
      {subheading && <p className="text-gray-700 mt-1">{subheading}</p>}
      <form className="mt-4 flex gap-2">
        <input
          type="email"
          placeholder={placeholder || "you@example.com"}
          className="flex-1 rounded-lg border px-3 py-2"
        />
        <button type="submit" className="rounded-lg bg-black text-white px-4 py-2">{submitLabel || "Subscribe"}</button>
      </form>
    </div>
  );
}

function Divider({ label }: any) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="h-px flex-1 bg-gray-200" />
      {label && <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>}
      <div className="h-px flex-1 bg-gray-200" />
    </div>
  );
}

function PressLogos({ heading, logos = [] }: any) {
  return (
    <div>
      {heading && <h2 className="text-2xl font-semibold mb-4">{heading}</h2>}
      <div className="flex flex-wrap items-center gap-6 opacity-80">
        {logos.map((l:any, i:number)=>(
          <img key={i} src={/^https?:/.test(l.src) ? l.src : fallbackImg} alt={l.alt || "logo"} className="h-8 object-contain" />
        ))}
      </div>
    </div>
  );
}

function SpecialsCarousel({ heading, items = [] }: any) {
  return (
    <div>
      {heading && <h2 className="text-2xl font-semibold mb-4">{heading}</h2>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((it:any, i:number)=>(
          <div key={i} className="rounded-xl border overflow-hidden">
            {it.image && <SafeImg src={it.image} alt={it.title} className="w-full h-40 object-cover" />}
            <div className="p-4">
              <div className="font-semibold">{it.title}</div>
              {it.desc && <div className="text-sm text-gray-600 mt-1">{it.desc}</div>}
              {it.price && <div className="mt-2 font-semibold">{it.price}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PrivateDining({ heading, text, features = [], image, cta }: any) {
  return (
    <div className="grid md:grid-cols-[1fr_360px] gap-8 items-center">
      <div>
        {heading && <h2 className="text-2xl font-semibold">{heading}</h2>}
        {text && <p className="text-gray-700 mt-2">{text}</p>}
        {features.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm text-gray-700 list-disc list-inside">
            {features.map((f:any, i:number)=><li key={i}>{f}</li>)}
          </ul>
        )}
        {cta?.label && (
          <a href={cta.href || "#"} className="inline-block mt-4 px-4 py-2 rounded bg-black text-white text-sm">
            {cta.label}
          </a>
        )}
      </div>
      {image && <SafeImg src={image} alt={heading || ""} className="w-full h-56 object-cover rounded-xl" />}
    </div>
  );
}

function Catering({ heading, text, tiers = [], image, cta }: any) {
  return (
    <div className="grid md:grid-cols-[1fr_360px] gap-8 items-start">
      <div>
        {heading && <h2 className="text-2xl font-semibold">{heading}</h2>}
        {text && <p className="text-gray-700 mt-2">{text}</p>}
        <div className="mt-4 grid sm:grid-cols-2 gap-4">
          {tiers.map((t:any,i:number)=>(
            <div key={i} className="rounded-xl border p-5">
              <div className="font-semibold">{t.name}</div>
              {t.price && <div className="text-lg font-bold mt-1">{t.price}</div>}
              <ul className="mt-3 space-y-1 text-sm text-gray-700">
                {(t.features || []).map((f:string, idx:number)=><li key={idx}>• {f}</li>)}
              </ul>
            </div>
          ))}
        </div>
        {cta?.label && (
          <a href={cta.href || "#"} className="inline-block mt-4 px-4 py-2 rounded bg-black text-white text-sm">
            {cta.label}
          </a>
        )}
      </div>
      {image && <SafeImg src={image} alt={heading || ""} className="w-full h-56 object-cover rounded-xl" />}
    </div>
  );
}

function WineListHighlight({ heading, items = [], image }: any) {
  return (
    <div className="grid md:grid-cols-[1fr_320px] gap-8">
      <div>
        {heading && <h2 className="text-2xl font-semibold mb-4">{heading}</h2>}
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2">Wine</th>
                <th className="text-left px-4 py-2">Region</th>
                <th className="text-left px-4 py-2">Year</th>
                <th className="text-left px-4 py-2">Price</th>
              </tr>
            </thead>
            <tbody>
              {items.map((w:any, i:number)=>(
                <tr key={i} className="border-t">
                  <td className="px-4 py-2">{w.name}</td>
                  <td className="px-4 py-2 text-gray-600">{w.region}</td>
                  <td className="px-4 py-2 text-gray-600">{w.year}</td>
                  <td className="px-4 py-2 font-medium">{w.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {image && <SafeImg src={image} alt={heading || ""} className="w-full h-56 object-cover rounded-xl" />}
    </div>
  );
}

function MapList({ heading, locations = [] }: any) {
  return (
    <div>
      {heading && <h2 className="text-2xl font-semibold mb-4">{heading}</h2>}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-600">Static map placeholder</div>
          <div className="mt-2 h-56 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
            Map (lat/lng not rendered)
          </div>
        </div>
        <div className="rounded-xl border p-4">
          <ul className="space-y-3">
            {locations.map((loc:any, i:number)=>(
              <li key={i} className="text-sm">
                <div className="font-medium">{loc.name}</div>
                {loc.address && <div className="text-gray-600">{loc.address}</div>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
