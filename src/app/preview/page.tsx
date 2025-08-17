"use client";

import React, { useEffect, useMemo, useState } from "react";


// --- prop helpers ---
function pick<T>(obj: any, keys: string[], fallback: T): T {
    for (const k of keys) {
        if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
    }
    return fallback;
}

function normalizeProps(type: string, props: any) {
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

    case "Hero": {
      // title/heading, subtitle/subheading, cta/primaryCta, image/alt
      const title = (globalThis as any).pick ? (globalThis as any).pick<string>(p, ["title", "heading"], "Your headline") : (p.title ?? p.heading ?? "Your headline");
      const subtitle = (globalThis as any).pick ? (globalThis as any).pick<string>(p, ["subtitle", "subheading"], "") : (p.subtitle ?? p.subheading ?? "");
      const primaryCta = p.primaryCta || p.cta || undefined;
      const image = p.image;
      const alt = p.alt || "";
      return { ...p, title, subtitle, primaryCta, image, alt };
    }

    case "FAQ": {
      const items = Array.isArray(p.items)
        ? p.items.map((it: any) => ({
            q: it.q ?? it.question ?? "",
            a: it.a ?? it.answer ?? "",
          }))
        : [];
      const images = Array.isArray(srcList)
        ? srcList.map((im: any) =>
            typeof im === "string" ? { src: im, alt: "" } : im
          )
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
        items = p.items;
      } else if (Array.isArray(p.days)) {
        items = p.days.map((d: any) => {
          const time = String(d.time || "");
          // split things like "6pm-10pm" or "6pm — 10pm"
          const m = time.split(/[-—–]/);
          return {
            day: d.day || "",
            open: (m[0] || "").trim(),
            close: (m[1] || "").trim(),
          };
        });
      }
      return { ...p, items };
    }

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



type Comp = { id: string; type: string; tags?: string[]; props: any };

export default function Preview() {
  const [raw, setRaw] = useState<any>(null);
  const [tab, setTab] = useState<"preview" | "json">("preview");

  useEffect(() => {
    const stored = localStorage.getItem("generatedWebsite");
    if (stored) setRaw(JSON.parse(stored));
  }, []);


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

function SafeImg({
  src,
  alt,
  className,
}: {
  src?: string;
  alt?: string;
  className?: string;
}) {
  const initial =
    typeof src === "string" && src.startsWith("http") ? src : fallbackImg;

  const [current, setCurrent] = useState(initial);

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

function normGalleryProps(p: any) {
  // Normalize images: accept `images` OR `items`; accept {src} OR {image}
  const srcItems = Array.isArray(p?.images)
    ? p.images
    : Array.isArray(p?.items)
    ? p.items
    : [];

  const images = srcItems.map((im: any) => {
    const src = im?.src || im?.image || im?.url || im?.href;
    const alt =
      im?.alt ||
      im?.title ||
      im?.caption ||
      (typeof src === "string" ? src.split("/").pop() : "") ||
      "";
    return { src, alt };
  });

  return { ...p, images };
}

/* ===========================
   SiteRenderer (uses normalizers)
   =========================== */
function SiteRenderer({ components }: { components: Comp[] }) {
  return (
    <div className="bg-white">
        {components.map((c) => {
            const props = normalizeProps(c.type, c.props || {});
            switch (c.type) {

          // no extra spacing wrapper for header/footer
          case "Header": {
            return <Header key={c.id} {...normHeaderProps(props)} />;
          }

          case "Hero":
            return (
              <Section key={c.id}>
                <Hero {...props} />
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

          case "BlogList":
            return (
              <Section key={c.id}>
                <BlogList {...props} />
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

case "IntroSection":
  return <Section key={c.id}><IntroSection {...props} /></Section>;
case "SplitFeature":     return <Section key={c.id}><SplitFeature {...props} /></Section>;
case "ValueBadges":      return <Section key={c.id}><ValueBadges {...props} /></Section>;
case "CTASection":       return <Section key={c.id}><CTASection {...props} /></Section>;
case "NewsletterSignup": return <Section key={c.id}><NewsletterSignup {...props} /></Section>;

case "PrivateDining":     return <Section key={c.id}><PrivateDining {...props} /></Section>;
case "Catering":          return <Section key={c.id}><Catering {...props} /></Section>;
case "WineListHighlight": return <Section key={c.id}><WineListHighlight {...props} /></Section>;
case "MapList":           return <Section key={c.id}><MapList {...props} /></Section>;
case "Divider":          return <Divider key={c.id} {...props} />;

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



/* -------- PrivateDining -------- */
function PrivateDining(all: any) {
  const heading = all.heading || "Private Dining";
  const text = all.text || "Host intimate gatherings, celebrations, or corporate events in our private spaces.";
  const img = all.image;
  const highlights: string[] = all.highlights || [];
  const cta = all.cta;

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 grid md:grid-cols-2 gap-8 items-center">
      <div>
        <h2 className="text-2xl font-semibold">{heading}</h2>
        <p className="mt-3 text-gray-700">{text}</p>
        {!!highlights.length && (
          <ul className="mt-4 grid sm:grid-cols-2 gap-2 text-sm text-gray-700">
            {highlights.map((h: string, i: number) => <li key={i}>• {h}</li>)}
          </ul>
        )}
        {cta?.label && (
          <a href={cta.href || "#"} className="inline-block mt-6 px-4 py-2 rounded bg-black text-white text-sm">
            {cta.label}
          </a>
        )}
      </div>
      <div className="rounded-xl overflow-hidden border">
        <SafeImg src={img} alt={heading} className="w-full h-72 object-cover" />
      </div>
    </section>
  );
}

/* -------- Catering -------- */
function Catering(all: any) {
  const heading = all.heading || "Catering";
  const text = all.text || "Full-service catering for weddings, corporate events, and private parties.";
  const img = all.image;
  const bullets: string[] = all.menuHighlights || [];
  const cta = all.cta;

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 grid md:grid-cols-2 gap-8 items-center">
      <div className="rounded-xl overflow-hidden border order-2 md:order-1">
        <SafeImg src={img} alt={heading} className="w-full h-72 object-cover" />
      </div>
      <div className="order-1 md:order-2">
        <h2 className="text-2xl font-semibold">{heading}</h2>
        <p className="mt-3 text-gray-700">{text}</p>
        {!!bullets.length && (
          <ul className="mt-4 space-y-1 text-sm text-gray-700">
            {bullets.map((b: string, i: number) => <li key={i}>• {b}</li>)}
          </ul>
        )}
        {cta?.label && (
          <a href={cta.href || "#"} className="inline-block mt-6 px-4 py-2 rounded bg-black text-white text-sm">
            {cta.label}
          </a>
        )}
      </div>
    </section>
  );
}

/* -------- WineListHighlight -------- */
function WineListHighlight(all: any) {
  const heading = all.heading || "Our Wine Program";
  const text = all.text || "Curated old-world and new-world selections with a focus on small producers.";
  const img = all.image;
  const dl = all.download;

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 grid md:grid-cols-[2fr,1fr] gap-8 items-center">
      <div>
        <h2 className="text-2xl font-semibold">{heading}</h2>
        <p className="mt-3 text-gray-700">{text}</p>
        {dl?.href && (
          <a href={dl.href} className="inline-block mt-6 px-4 py-2 rounded border border-black text-black text-sm hover:bg-black hover:text-white">
            {dl.label || "Download Wine List"}
          </a>
        )}
      </div>
      <div className="rounded-xl overflow-hidden border">
        <SafeImg src={img} alt={heading} className="w-full h-64 object-cover" />
      </div>
    </section>
  );
}

/* -------- MapList (multi-location) -------- */
function MapList(all: any) {
  const heading = all.heading || "Our Locations";
  const locations: any[] = Array.isArray(all.locations) ? all.locations : [];
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <h2 className="text-2xl font-semibold mb-6">{heading}</h2>
      <div className="grid gap-6 md:grid-cols-2">
        {locations.map((loc, i) => (
          <div key={i} className="rounded-xl border overflow-hidden">
            <div className="p-4">
              <div className="font-medium">{loc.name}</div>
              <div className="text-sm text-gray-700">{loc.address}</div>
              {loc.phone && <a href={`tel:${loc.phone}`} className="text-sm text-blue-600">{loc.phone}</a>}
            </div>
            {loc.mapIframeSrc && (
              <iframe
                className="w-full h-56 border-t"
                src={loc.mapIframeSrc}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            )}
          </div>
        ))}
      </div>
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

function Divider({ size = "md" }: any) {
  const spacers: Record<string, string> = { sm: "py-4", md: "py-8", lg: "py-14" };
  return <div className={spacers[size] || spacers.md} />;
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

function SpecialsCarousel({ heading, items = [] as any[] }) {
  return (
    <div>
      {heading && <h2 className="text-2xl font-semibold mb-6">{heading}</h2>}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it: any, i: number) => (
          <div key={i} className="rounded-xl border border-black/10 overflow-hidden hover:shadow-md transition">
            <SafeImg src={it.image} alt={it.title} className="w-full h-40 object-cover" />
            <div className="p-4">
              <div className="font-medium">{it.title}</div>
              {it.desc && <div className="text-sm text-gray-600 mt-1">{it.desc}</div>}
              {it.price && <div className="mt-2 font-semibold">{it.price}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


function PressLogos({ heading, logos = [] }: any) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      {heading && <h2 className="text-xl font-semibold mb-4">{heading}</h2>}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 items-center">
        {logos.map((l: any, i: number) => (
          <div key={i} className="opacity-70 hover:opacity-100 transition">
            <SafeImg src={l.src} alt={l.alt} className="w-full h-12 object-contain bg-transparent" />
          </div>
        ))}
      </div>
    </section>
  );
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
function IntroSection({ heading, text, image, cta }: any) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 grid md:grid-cols-2 gap-8 items-center">
      <div>
        <h2 className="text-3xl font-semibold mb-4">{heading || "About Us"}</h2>
        <p className="text-gray-700 leading-relaxed">{text}</p>
        {cta?.label && (
          <a href={cta.href || "#"} className="inline-block mt-6 px-5 py-2 rounded-lg bg-black text-white">
            {cta.label}
          </a>
        )}
      </div>
      <div>
        <SafeImg src={image} alt={heading || "Intro"} className="w-full h-72 object-cover rounded-xl" />
      </div>
    </section>
  );
}


function SplitFeature({ heading, text, image, reverse }: any) {
  return (
    <section className={`mx-auto max-w-6xl px-4 py-16 grid md:grid-cols-2 gap-8 items-center ${reverse ? "md:[&>*:first-child]:order-2" : ""}`}>
      <div>
        <SafeImg src={image} alt={heading || "Feature"} className="w-full h-72 md:h-80 object-cover rounded-xl" />
      </div>
      <div>
        <h3 className="text-2xl font-semibold mb-3">{heading || "Feature"}</h3>
        <p className="text-gray-700">{text}</p>
      </div>
    </section>
  );
}

function ValueBadges({ heading, items = [] }: any) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      {heading && <h3 className="text-xl font-semibold mb-4">{heading}</h3>}
      <div className="flex flex-wrap gap-3">
        {items.map((it: any, i: number) => (
          <span key={i} className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-gray-100 text-sm">
            <span className="font-medium">{it.label}</span>
            {it.sub && <span className="text-gray-500">• {it.sub}</span>}
          </span>
        ))}
      </div>
    </section>
  );
}

function CTASection({ heading, subheading, primary, background }: any) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <div className="rounded-2xl p-10 md:p-14 border relative overflow-hidden">
        {background && (
          <div className="absolute inset-0 opacity-10">
            <SafeImg src={background} alt={heading || "CTA background"} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="relative">
          <h3 className="text-2xl md:text-3xl font-semibold mb-2">{heading || "Ready to book?"}</h3>
          {subheading && <p className="text-gray-700 mb-6">{subheading}</p>}
          {primary?.label && (
            <a href={primary.href || "#"} className="inline-block px-5 py-2 rounded-lg bg-black text-white">
              {primary.label}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

function NewsletterSignup({ heading, subheading, placeholder, submitLabel }: any) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-14 text-center">
      <h3 className="text-2xl font-semibold">{heading || "Get our specials"}</h3>
      {subheading && <p className="text-gray-600 mt-2">{subheading}</p>}
      <form className="mt-6 flex gap-2">
        <input className="flex-1 border rounded-lg px-4 py-2" placeholder={placeholder || "Your email"} />
        <button className="px-4 py-2 rounded-lg bg-black text-white">{submitLabel || "Subscribe"}</button>
      </form>
    </section>
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
