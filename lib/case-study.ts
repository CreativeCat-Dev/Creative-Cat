import { WORK_PROJECTS } from "./work";

/**
 * DEL-02 — the individual project case studies.
 *
 * Identity, canonical covers and route order stay in `lib/work.ts`. This module
 * only adds editorial content on top of that collection, keyed by the same slug.
 * The build fails if a canonical project has no study or a study invents a slug.
 *
 * Provenance rules:
 *
 * - `client`, `services`, `deliverables`, overview facts and the two published
 *   challenge/outcome records come from the owner's current portfolio project
 *   records (creativecat.digital). They are paraphrased, not expanded.
 * - `creativeDirection` and `identityNotes` describe only what the supplied
 *   artwork shows.
 * - `year` and `timeline` are intentionally absent: the live records repeat a
 *   single "2026" value and no project timeline is published, so neither is
 *   asserted here.
 * - Palette swatches carry their own provenance. "Brand artwork" means the HEX
 *   appears in the project's own guidelines/palette slide; "Published portfolio"
 *   means it comes from the published project metadata; "Artwork-sampled" means
 *   it was sampled from the supplied artwork and is not a certified brand code.
 * - Typography is only claimed for Dipakkhik, whose supplied brand guide names
 *   its families. No other project's typeface is asserted.
 */

export type CaseStudySwatchProvenance =
  | "Brand artwork"
  | "Published portfolio"
  | "Artwork-sampled";

export type CaseStudySwatch = {
  name: string;
  hex: string;
  role: string;
  provenance: CaseStudySwatchProvenance;
};

export type CaseStudyMedia = {
  src: string;
  width: number;
  height: number;
  alt: string;
  caption?: string;
};

export type CaseStudyMediaBlock =
  | { layout: "full"; media: CaseStudyMedia }
  | { layout: "portrait"; media: CaseStudyMedia }
  | { layout: "pair"; left: CaseStudyMedia; right: CaseStudyMedia }
  | {
      layout: "portrait-pair";
      left: CaseStudyMedia;
      right: CaseStudyMedia;
    };

export type CaseStudyTypography = {
  families: readonly { name: string; role: string; note: string }[];
  note: string;
};

export type CaseStudy = {
  slug: string;
  introduction: string;
  client?: string;
  /** Editorial classification derived from the published description. */
  industry?: string;
  category?: string;
  services: readonly string[];
  deliverables: readonly string[];
  overview: readonly string[];
  workScope?: string;
  challenge?: { challenge: string; approach: string };
  creativeDirection: readonly string[];
  identityNotes: readonly { label: string; value: string }[];
  outcome?: string;
  palette: readonly CaseStudySwatch[];
  paletteNote: string;
  typography?: CaseStudyTypography;
  gallery: readonly CaseStudyMediaBlock[];
  sources: readonly { label: string; href?: string }[];
  verification: string;
};

const media = (
  slug: string,
  file: string,
  width: number,
  height: number,
  alt: string,
  caption?: string,
): CaseStudyMedia => ({
  src: `/work/${slug}/case-study/${file}`,
  width,
  height,
  alt,
  caption,
});

const portfolio = (label: string, slug: string) => ({
  label: `Creative Cat portfolio — ${label}`,
  href: `https://portfolio.creativecat.digital/projects/${slug}`,
});

const coverSource = {
  label: "Canonical cover artwork supplied by the owner (DEL-01C)",
};

export const CASE_STUDIES: readonly CaseStudy[] = [
  {
    slug: "right-sight",
    introduction:
      "A complete identity for Rightsight Education, built to make learning feel clear, credible and ambitious.",
    client: "Rightsight Education",
    industry: "Education",
    category: "Branding",
    services: [
      "Brand Identity",
      "Logo Redesign",
      "Visual System",
      "Brand Guidelines",
    ],
    deliverables: [
      "Logo system and sub-brand marks",
      "Colour palette and brand patterns",
      "Stationery, ID and lanyard system",
      "Social media campaign templates",
    ],
    overview: [
      "Rightsight Education is an education platform with a mission to make quality learning more accessible. The rebrand needed to communicate trust, growth and academic clarity to students, parents and educators at once.",
      "The identity pairs a midnight field with a crimson accent and a geometric star mark. That system is carried through print, credentials, merchandise and campaign layouts rather than stopping at a logo.",
    ],
    workScope:
      "The published scope covers brand identity, logo redesign, a visual system and brand guidelines. The supplied artwork also documents stationery, ID and lanyard applications, drinkware and social campaign templates built on that system.",
    creativeDirection: [
      "The wordmark is set in a condensed uppercase sans, with a five-point star mark doing the recognisable work at small sizes. The mark is built from radial lines, which becomes a broader pattern language across backgrounds and dividers.",
      "Midnight and crimson carry the identity, with teal, amber and mint as supporting accents. The result is formal enough for an education institution but energetic enough for student-facing campaigns.",
    ],
    identityNotes: [
      { label: "Mark", value: "Radial star derived from five stepped strokes" },
      { label: "Wordmark", value: "Condensed uppercase sans with tight tracking" },
      { label: "Pattern", value: "Radiating line fields and stepped corner motifs" },
      {
        label: "Applications",
        value: "Stationery, ID cards, lanyards, drinkware, social templates",
      },
    ],
    palette: [
      {
        name: "Midnight",
        hex: "#241A57",
        role: "Primary dark surface",
        provenance: "Brand artwork",
      },
      {
        name: "Crimson",
        hex: "#DE1B52",
        role: "Primary accent",
        provenance: "Brand artwork",
      },
      {
        name: "Teal",
        hex: "#00A8AB",
        role: "Supporting accent",
        provenance: "Brand artwork",
      },
      {
        name: "Amber",
        hex: "#F79421",
        role: "Highlight",
        provenance: "Brand artwork",
      },
      {
        name: "Mint",
        hex: "#5ABD88",
        role: "Supporting accent",
        provenance: "Brand artwork",
      },
      {
        name: "Paper",
        hex: "#FFFFFF",
        role: "Light surface",
        provenance: "Brand artwork",
      },
    ],
    paletteNote:
      "These HEX values are read directly from the colour palette artwork in the supplied project set.",
    gallery: [
      {
        layout: "full",
        media: media(
          "right-sight",
          "identity-overview.jpg",
          1279,
          1280,
          "Rightsight Education identity overview with the star mark, mission and vision copy",
          "Identity overview",
        ),
      },
      {
        layout: "pair",
        left: media(
          "right-sight",
          "color-palette.jpg",
          1279,
          1280,
          "Rightsight Education colour palette artwork showing five brand colours",
          "Colour palette",
        ),
        right: media(
          "right-sight",
          "brand-patterns.jpg",
          1279,
          1280,
          "Rightsight Education curved line pattern studies",
          "Pattern system",
        ),
      },
      {
        layout: "pair",
        left: media(
          "right-sight",
          "merchandise.jpg",
          1279,
          1280,
          "Rightsight Education drinkware, bag and pen merchandise",
          "Merchandise",
        ),
        right: media(
          "right-sight",
          "brand-collage.jpg",
          1000,
          1000,
          "Collage of Rightsight Education badges, lanyards, visiting cards and stationery",
          "Brand kit collage",
        ),
      },
      {
        layout: "portrait-pair",
        left: media(
          "right-sight",
          "stationery-system.webp",
          787,
          2560,
          "Rightsight Education stationery and credential applications",
          "Stationery and credentials",
        ),
        right: media(
          "right-sight",
          "social-campaign.webp",
          854,
          2560,
          "Rightsight Education IELTS social campaign layout",
          "Social campaign",
        ),
      },
    ],
    sources: [
      portfolio("Rightsight Education", "rightsight-education"),
      coverSource,
      { label: "Archived original brand-kit collage (case-study media)" },
    ],
    verification: "Published project record plus artwork review",
  },
  {
    slug: "zero",
    introduction:
      "A broadcast identity for ZERO TV, built around a single orange signal and a globe-led wordmark.",
    client: "ZERO TV",
    industry: "News media",
    category: "Branding",
    services: [
      "Brand Guidelines",
      "Logo Design",
      "Merchandise Design",
      "Vehicle Branding",
      "Corporate Identity",
      "Office Branding",
    ],
    deliverables: [
      "Logo and orbit mark",
      "Press jackets and vests",
      "ID credentials and lanyards",
      "Microphone flags, pens and mugs",
      "Vehicle branding",
    ],
    overview: [
      "ZERO TV is a news media brand built around timely, accurate storytelling. The identity needed to project authority and trust across both editorial and physical environments.",
      "The system extends from the wordmark into press jackets, credentials, microphone flags, merchandise and vehicle branding. Orange is the constant signal, with black and white doing the supporting work.",
    ],
    workScope:
      "The published scope covers brand guidelines, logo design, merchandise, vehicle branding, corporate identity and office branding. The supplied artwork documents press kit applications, credentials, drinkware and vehicle livery.",
    creativeDirection: [
      "The wordmark sits inside a thin orbital ring, with the globe reading as the final letter. At broadcast scale the mark stays legible, and on merchandise it reduces to a clean orange badge.",
      "The palette is deliberately narrow: a vivid signal orange against carbon black and newsprint white. Press vests, microphone flags and the branded van all use the same high-visibility logic.",
    ],
    identityNotes: [
      { label: "Mark", value: "Wordmark with an orbital ring and globe counter" },
      { label: "Lettering", value: "Wide uppercase sans with an angled Z" },
      {
        label: "Applications",
        value: "Press vest, ID, mic flag, pens, mugs, vehicle livery",
      },
      { label: "Signal", value: "Orange reserved for recognition at distance" },
    ],
    palette: [
      {
        name: "Signal Orange",
        hex: "#FF4B00",
        role: "Primary brand signal",
        provenance: "Published portfolio",
      },
      {
        name: "Carbon",
        hex: "#0F0F0F",
        role: "Primary dark",
        provenance: "Published portfolio",
      },
      {
        name: "Newsprint",
        hex: "#F2F0EC",
        role: "Light surface",
        provenance: "Artwork-sampled",
      },
      {
        name: "Studio Grey",
        hex: "#464646",
        role: "Photographic neutral",
        provenance: "Artwork-sampled",
      },
    ],
    paletteNote:
      "Signal Orange and Carbon are published portfolio values. The two neutrals are sampled from the supplied artwork.",
    gallery: [
      {
        layout: "pair",
        left: media(
          "zero",
          "logo.png",
          1024,
          1024,
          "ZERO TV orange logo with orbital ring and globe",
          "Primary mark",
        ),
        right: media(
          "zero",
          "press-vest.png",
          900,
          601,
          "ZERO TV orange press vest with reflective strips",
          "Press vest",
        ),
      },
      {
        layout: "pair",
        left: media(
          "zero",
          "mic-flag.png",
          746,
          1024,
          "ZERO TV microphone flag held during a broadcast",
          "Microphone flag",
        ),
        right: media(
          "zero",
          "press-credential.png",
          1000,
          750,
          "ZERO TV press ID credential and lanyard",
          "Press credential",
        ),
      },
      {
        layout: "full",
        media: media(
          "zero",
          "vehicle-branding.png",
          800,
          640,
          "ZERO TV branded van with orange livery on a European street",
          "Vehicle branding",
        ),
      },
    ],
    sources: [portfolio("ZERO", "zero"), coverSource],
    verification: "Published project record plus artwork review",
  },
  {
    slug: "exciting-sundarban",
    introduction:
      "A place-rooted identity for a Sundarban tour operator, drawing on the tiger, the mangrove and the pull of the wild.",
    client: "Exciting Sundarban",
    industry: "Travel and tourism",
    category: "Branding",
    services: [
      "Logo Design",
      "Brand Guidelines",
      "Social Media Design",
      "Facebook Cover",
      "Logo Mockups",
    ],
    deliverables: [
      "Tiger emblem and wordmark",
      "Brand guidelines",
      "Facebook cover",
      "Social media templates",
      "Logo mockups",
    ],
    overview: [
      "Exciting Sundarban is a tour operator introducing travellers to the world's largest mangrove forest. The identity needed to hold both adventure and natural beauty without becoming a generic tourism badge.",
      "A tiger emblem, a decorative frame and a forest-green field give the brand a recognisable stamp. Social templates extend that language into trip announcements and seasonal offers.",
    ],
    workScope:
      "The published scope covers logo design, brand guidelines, social media design, a Facebook cover and logo mockups. The supplied artwork shows the identity applied to feed posts, a cover image and light and dark logo variants.",
    creativeDirection: [
      "The tiger sits inside a symmetrical line frame, with the wordmark stacked below in a condensed, slightly weathered uppercase. Gold and cream variants let the same stamp work on dark photography or a pale surface.",
      "Social layouts shift to a more editorial travel voice: large serif headlines, Bengali copy, wildlife photography and small service icons. Green stays the anchor while amber warms the campaign work.",
    ],
    identityNotes: [
      { label: "Mark", value: "Tiger emblem inside a symmetrical line frame" },
      { label: "Lettering", value: "Stacked condensed uppercase with a weathered edge" },
      {
        label: "Applications",
        value: "Facebook cover, trip posts, seasonal offers, logo mockups",
      },
      { label: "Voice", value: "Adventure-led, with Bengali and English campaign copy" },
    ],
    palette: [
      {
        name: "Sundarban Green",
        hex: "#1A5C3A",
        role: "Primary brand colour",
        provenance: "Published portfolio",
      },
      {
        name: "Tiger Amber",
        hex: "#F59E0B",
        role: "Warm accent",
        provenance: "Published portfolio",
      },
      {
        name: "Canopy",
        hex: "#2F3F1B",
        role: "Deep natural neutral",
        provenance: "Artwork-sampled",
      },
      {
        name: "River Cream",
        hex: "#F6E8D9",
        role: "Light surface",
        provenance: "Artwork-sampled",
      },
    ],
    paletteNote:
      "The green and amber are published portfolio values; the canopy and cream tones are sampled from the supplied logo and social artwork.",
    gallery: [
      {
        layout: "full",
        media: media(
          "exciting-sundarban",
          "facebook-cover.png",
          627,
          314,
          "Exciting Sundarban Facebook cover with deer in the mangrove",
          "Facebook cover",
        ),
      },
      {
        layout: "pair",
        left: media(
          "exciting-sundarban",
          "logo.png",
          1024,
          1024,
          "Exciting Sundarban tiger logo in gold on a dark green field",
          "Dark logo",
        ),
        right: media(
          "exciting-sundarban",
          "logo-cream.png",
          1024,
          1024,
          "Exciting Sundarban tiger logo in green on a cream field",
          "Light logo",
        ),
      },
      {
        layout: "pair",
        left: media(
          "exciting-sundarban",
          "social-vacation.jpg",
          1024,
          1024,
          "Exciting Sundarban vacation social post with deer and Bengali copy",
          "Trip campaign",
        ),
        right: media(
          "exciting-sundarban",
          "social-elegance.png",
          1001,
          1001,
          "Exciting Sundarban boat campaign post titled Enjoy the Wild with Elegance",
          "Experience campaign",
        ),
      },
    ],
    sources: [
      portfolio("Exciting Sundarban", "exciting-sundarban"),
      coverSource,
    ],
    verification: "Published project record plus artwork review",
  },
  {
    slug: "splash-shine",
    introduction:
      "A high-contrast car-care identity that turns clean into a visual promise.",
    client: "Splash n Shine",
    industry: "Car care and automotive services",
    category: "Branding",
    services: [
      "Brand Guidelines",
      "Logo Design",
      "Visiting Card",
      "Outdoor Banner",
      "Social Media Design",
    ],
    deliverables: [
      "Wave and shine logo",
      "Business cards",
      "Outdoor banner and station signage",
      "Social campaign posts",
    ],
    overview: [
      "Splash n Shine is a professional car wash that needed a vivid, memorable identity to stand apart in a crowded local market.",
      "The system pairs a deep green field with fresh lime, a wave-and-stars mark and confident campaign copy. Cards, signage and social posts all use the same clean, high-contrast language.",
    ],
    workScope:
      "The published scope covers brand guidelines, logo design, visiting cards, an outdoor banner and social media design. The supplied artwork also shows station forecourt branding and a before-and-after campaign.",
    creativeDirection: [
      "The logo draws a rising wave with a cluster of bubbles and stars, set above a light, extended wordmark. Deep green gives the brand a premium car-care tone, while lime keeps it energetic.",
      "Campaign layouts lean on split compositions: a dirty gold car against a clean white one, or a bold headline paired with a single vehicle. Forecourt signage scales the same shapes to architecture.",
    ],
    identityNotes: [
      { label: "Mark", value: "Rising wave with bubbles, stars and a speed line" },
      { label: "Lettering", value: "Light extended sans with a wave-like S" },
      {
        label: "Applications",
        value: "Business cards, outdoor banner, forecourt signage, social posts",
      },
      { label: "Campaign line", value: "“Splash In, Shine Out” used across touchpoints" },
    ],
    palette: [
      {
        name: "Deep Green",
        hex: "#1F4E33",
        role: "Primary surface",
        provenance: "Artwork-sampled",
      },
      {
        name: "Fresh Lime",
        hex: "#91CB6B",
        role: "Primary accent",
        provenance: "Artwork-sampled",
      },
      {
        name: "Pale Lime",
        hex: "#C2E9A2",
        role: "Light accent",
        provenance: "Artwork-sampled",
      },
      {
        name: "Workshop Teal",
        hex: "#013D49",
        role: "Deep print neutral",
        provenance: "Artwork-sampled",
      },
    ],
    paletteNote:
      "Sampled from the supplied artwork. The artwork's green identity is used rather than the blue values in the published metadata, which do not match the visible brand.",
    gallery: [
      {
        layout: "pair",
        left: media(
          "splash-shine",
          "business-cards.jpg",
          1024,
          768,
          "Splash n Shine deep green business cards",
          "Business cards",
        ),
        right: media(
          "splash-shine",
          "station-signage.png",
          980,
          634,
          "Splash n Shine forecourt station signage with lime canopy",
          "Station signage",
        ),
      },
      {
        layout: "pair",
        left: media(
          "splash-shine",
          "campaign-dirty-clean.png",
          615,
          615,
          "Splash n Shine before-and-after car wash campaign artwork",
          "Before and after",
        ),
        right: media(
          "splash-shine",
          "floor-graphic.jpg",
          1024,
          1024,
          "Splash n Shine floor graphic reading Drive Clean Happy",
          "Floor graphic",
        ),
      },
      {
        layout: "portrait",
        media: media(
          "splash-shine",
          "brand-overview.jpg",
          512,
          1024,
          "Splash n Shine brand overview with cards, signage and social posts",
          "Brand overview",
        ),
      },
    ],
    sources: [portfolio("Splash n Shine", "splash-n-shine"), coverSource],
    verification: "Published project record plus artwork review",
  },
  {
    slug: "gdri",
    introduction:
      "An institutional identity for a cross-border development and research foundation.",
    client: "Global Development and Research Initiative Foundation (GDRI)",
    industry: "International development and research",
    category: "Branding",
    services: [
      "Brand Guidelines",
      "Logo Design",
      "Corporate Identity",
      "Social Media Posts",
      "Stationery",
      "Signage",
    ],
    deliverables: [
      "Logo and petal mark",
      "Brand guidelines",
      "Visiting cards, notebooks and pen drives",
      "ID badges and lanyards",
      "Reception signage and email signatures",
    ],
    overview: [
      "The Global Development and Research Initiative is an international NGO working across development and research. The identity needed to read as credible to partners, institutions and field teams alike.",
      "A navy field, a white wordmark and a lime-green petal mark form the core. The system scales from formal stationery to social updates from the field.",
    ],
    workScope:
      "The published scope covers brand guidelines, logo design, corporate identity, social media posts, stationery and signage. The supplied artwork documents stationery and two field-led social layouts.",
    creativeDirection: [
      "The GDRI wordmark is set in a clean humanist sans, with the petal mark forming a circular burst to its right. Navy carries institutional weight; the green mark adds optimism without softening the tone.",
      "Social layouts combine field photography with a navy caption panel and a green footer band. The result keeps the foundation's work visible while holding a consistent institutional frame.",
    ],
    identityNotes: [
      { label: "Mark", value: "Six-petal burst arranged as an open globe" },
      { label: "Lettering", value: "Humanist sans with a wide, stable wordmark" },
      { label: "Applications", value: "Stationery, credentials, signage, social posts" },
      { label: "Tone", value: "Institutional navy with a bright development green" },
    ],
    palette: [
      {
        name: "Institutional Navy",
        hex: "#0A253E",
        role: "Primary surface",
        provenance: "Artwork-sampled",
      },
      {
        name: "Initiative Green",
        hex: "#7DC91D",
        role: "Primary accent",
        provenance: "Artwork-sampled",
      },
      {
        name: "Paper",
        hex: "#FFFFFF",
        role: "Light surface and wordmark",
        provenance: "Artwork-sampled",
      },
      {
        name: "Field Grey",
        hex: "#607080",
        role: "Supporting neutral",
        provenance: "Artwork-sampled",
      },
    ],
    paletteNote:
      "Sampled from the supplied identity and social artwork. The published metadata lists a blue accent that is not present in the visible mark, so the artwork values are used.",
    gallery: [
      {
        layout: "full",
        media: media(
          "gdri",
          "identity.png",
          1024,
          1024,
          "GDRI logo with white wordmark and lime green petal mark on navy",
          "Primary identity",
        ),
      },
      {
        layout: "pair",
        left: media(
          "gdri",
          "social-development.jpg",
          1024,
          1024,
          "GDRI social post showing a team group photograph at a development event",
          "Field update",
        ),
        right: media(
          "gdri",
          "social-field.jpg",
          1024,
          1024,
          "GDRI social post documenting a field visit with a green caption band",
          "Project visit",
        ),
      },
    ],
    sources: [portfolio("GDRI", "gdri"), coverSource],
    verification: "Published project record plus artwork review",
  },
  {
    slug: "project-we",
    introduction:
      "A red-led campaign system for social impact storytelling across education, child protection and women's leadership.",
    client: "Project WE",
    industry: "Social impact and advocacy",
    category: "Social Media",
    services: [
      "Social Media Campaign Design",
      "Awareness Post Creatives",
      "Advocacy Communication Visuals",
      "Campaign Art Direction",
      "Social Media Design System",
    ],
    deliverables: [
      "Seven campaign visuals",
      "Education, child protection and safe motherhood posts",
      "Women's leadership and awareness layouts",
      "Reusable campaign design system",
    ],
    overview: [
      "Project WE needed one visual language for several sensitive social themes. The campaign covers education empowerment, child protection, safe motherhood and women's leadership without letting each cause fragment the brand.",
      "A red, white and black system keeps the feed recognisable. Bold headlines, human-centred photography and the Project WE lockup carry the emotional weight while the grid stays consistent.",
    ],
    workScope:
      "The published scope covers social media campaign design, awareness creatives, advocacy communication, art direction and a social design system. The supplied artwork documents the feed across education, child labour, safe motherhood and women's achievement stories.",
    challenge: {
      challenge:
        "The campaign needed to communicate multiple sensitive social themes while preserving one consistent, recognisable identity across every post.",
      approach:
        "A coherent red-led direction, bold headline hierarchy and human-centred imagery keep each visual emotionally strong while remaining instantly identifiable as Project WE.",
    },
    creativeDirection: [
      "Each post opens with a short, direct headline, then lets a portrait or documentary image carry the story. The red band, white type and small WE lockup repeat at the edges so the campaign reads as one series.",
      "The layouts move between English and Bengali without changing the structure. That keeps the system flexible enough for advocacy, celebration and awareness messages.",
    ],
    identityNotes: [
      { label: "Lockup", value: "WE monogram with a radiating star inside a red square" },
      { label: "Lettering", value: "Heavy condensed headlines with a compact sans body" },
      { label: "Layout", value: "Red anchor band, full-bleed portrait, small caption rail" },
      { label: "Language", value: "English and Bengali campaign copy" },
    ],
    outcome:
      "Project WE received a publish-ready awareness creative set that supports storytelling, advocacy and engagement across its key social issues.",
    palette: [
      {
        name: "Campaign Red",
        hex: "#D3293B",
        role: "Primary brand anchor",
        provenance: "Artwork-sampled",
      },
      {
        name: "Deep Red",
        hex: "#7F1B1D",
        role: "Depth and shadow",
        provenance: "Artwork-sampled",
      },
      {
        name: "Ink",
        hex: "#25262A",
        role: "Editorial neutral",
        provenance: "Artwork-sampled",
      },
      {
        name: "Paper",
        hex: "#FAF6F6",
        role: "Light surface",
        provenance: "Artwork-sampled",
      },
    ],
    paletteNote:
      "Sampled from the supplied campaign artwork; the red matches the published campaign direction without treating it as a certified brand code.",
    gallery: [
      {
        layout: "full",
        media: media(
          "project-we",
          "campaign-overview.png",
          1024,
          512,
          "Project WE campaign overview grid with education, motherhood and child protection posts",
          "Campaign overview",
        ),
      },
      {
        layout: "pair",
        left: media(
          "project-we",
          "education-story.png",
          1024,
          1024,
          "Project WE education empowerment post featuring a graduate",
          "Education",
        ),
        right: media(
          "project-we",
          "child-labour.png",
          1024,
          1024,
          "Project WE World Day Against Child Labour campaign post",
          "Child protection",
        ),
      },
      {
        layout: "pair",
        left: media(
          "project-we",
          "chess-champion.png",
          1024,
          1024,
          "Project WE post celebrating a national women's chess champion",
          "Women's leadership",
        ),
        right: media(
          "project-we",
          "safe-motherhood.png",
          1024,
          1024,
          "Project WE safe motherhood campaign post with a newborn's feet",
          "Safe motherhood",
        ),
      },
      {
        layout: "full",
        media: media(
          "project-we",
          "campaign-illustration.png",
          1024,
          1024,
          "Project WE illustrated campaign post with a mother and child",
          "Campaign illustration",
        ),
      },
    ],
    sources: [portfolio("Project WE", "project-we"), coverSource],
    verification: "Published project record plus artwork review",
  },
  {
    slug: "zero-blind-spots",
    introduction:
      "A campaign artwork study built around the Zero Blind Spots wordmark and a surveillance-camera motif.",
    category: "Campaign artwork",
    services: [],
    deliverables: [],
    overview: [
      "Zero Blind Spots is presented here through its approved campaign artwork. The composition places the wordmark against sweeping orange arcs and a close-up security camera.",
      "No published case-study record, client brief or service list is available for this project. This page therefore limits itself to the artwork and the visual direction it demonstrates.",
    ],
    creativeDirection: [
      "The artwork uses a dark, cinematic field with a warm orange band cutting through it. The camera lens sits near the centre, while the wordmark stays large and legible in white.",
      "The contrast is deliberately technological: hard lens highlights, soft atmospheric gradients and a single saturated accent. It reads as a campaign key visual rather than a flat logo lockup.",
    ],
    identityNotes: [
      { label: "Wordmark", value: "Zero set in a light italic, with Blind Spots in sans caps" },
      { label: "Motif", value: "Surveillance camera and concentric lens reflections" },
      { label: "Composition", value: "Dark field, orange arc, centred product hero" },
      { label: "Status", value: "Artwork review only; no published project record" },
    ],
    palette: [
      {
        name: "Signal Orange",
        hex: "#FF7000",
        role: "Primary accent",
        provenance: "Artwork-sampled",
      },
      {
        name: "Deep Charcoal",
        hex: "#21242D",
        role: "Primary dark",
        provenance: "Artwork-sampled",
      },
      {
        name: "Slate",
        hex: "#2A323E",
        role: "Atmospheric neutral",
        provenance: "Artwork-sampled",
      },
      {
        name: "Ember",
        hex: "#541306",
        role: "Shadow warmth",
        provenance: "Artwork-sampled",
      },
    ],
    paletteNote:
      "Sampled from the canonical campaign artwork. These are presentation colours, not certified brand guidelines.",
    gallery: [],
    sources: [coverSource],
    verification:
      "Artwork review only. No published project record or supporting media was available.",
  },
  {
    slug: "dipakkhik",
    introduction:
      "A complete visual identity for a photography studio, from a Bengali logotype to stationery, merchandise and social layouts.",
    client: "Dipakkhik",
    industry: "Photography",
    category: "Branding",
    services: [
      "Brand Identity Design",
      "Logo System",
      "Typography and Colour Guidelines",
      "Stationery Design",
      "Merchandise Mockups",
      "Social Media Creative Direction",
    ],
    deliverables: [
      "Bengali logo system and placement rules",
      "Typography and colour guidelines",
      "Graphic elements and patterns",
      "Stationery and merchandise",
      "Social media showcase layouts",
    ],
    overview: [
      "Dipakkhik is a photography studio working across weddings, portraits, events and commercial commissions. The brand needed to hold premium visual storytelling across digital showcases, print and merchandise.",
      "The identity is built on a Bengali logotype, a deep plum field and a modular set of frames and marks. It is documented as a full brand profile rather than a single logo application.",
    ],
    workScope:
      "The published scope covers brand identity, the logo system, typography and colour guidelines, stationery, merchandise and social creative direction. The supplied brand guide also documents logo placement, graphic elements and presentation layouts.",
    challenge: {
      challenge:
        "The studio required a premium yet flexible identity that could work across digital showcases, print collateral and merchandise while keeping a distinctive visual signature.",
      approach:
        "A structured identity language centred on deep plum tones, contrast accents, Bengali logotype personality and modular brand elements that scale from social posts to physical materials.",
    },
    creativeDirection: [
      "The mark pairs a Bengali wordmark with a camera-frame device, giving the studio a recognisable signature without relying on a generic lens icon. Deep plum and horizon pink carry most applications, with lucid pink opening up lighter layouts.",
      "The brand guide sets a clear hierarchy: Clash Display for headlines, Waterfall Regular as a script accent, and Metropolis for paragraphs. The same grid then moves from stationery to apparel and social templates.",
    ],
    identityNotes: [
      { label: "Mark", value: "Bengali logotype inside a camera-frame device" },
      { label: "Display type", value: "Clash Display and Waterfall Regular" },
      { label: "Body type", value: "Metropolis" },
      { label: "Applications", value: "Stationery, merchandise, social templates, brand guide" },
    ],
    outcome:
      "Dipakkhik received a complete visual profile ready for online campaigns, client materials, team wear and branded production assets.",
    palette: [
      {
        name: "Wedding Purple",
        hex: "#311222",
        role: "Brand colour, background, dark mode",
        provenance: "Brand artwork",
      },
      {
        name: "Horizon Pink",
        hex: "#F94872",
        role: "Highlights and thin elements",
        provenance: "Brand artwork",
      },
      {
        name: "Lucid Pink",
        hex: "#FBE1EC",
        role: "Main light-mode colour",
        provenance: "Brand artwork",
      },
    ],
    paletteNote:
      "These values and roles are copied from the supplied brand guide. The guide also defines a “Buttery Mica” gradient reserved for display typography; it has no single HEX value and is not shown as a swatch.",
    typography: {
      families: [
        {
          name: "Clash Display",
          role: "Display and headlines",
          note: "Shown in light, regular, medium and bold in the supplied guide.",
        },
        {
          name: "Waterfall Regular",
          role: "Script accent",
          note: "Used for variable display glyphs and editorial flourishes.",
        },
        {
          name: "Metropolis",
          role: "Paragraph and body copy",
          note: "The guide's paragraph family for longer text.",
        },
      ],
      note: "Named in the supplied Dipakkhik brand guide. Waterfall Regular and Metropolis are not bundled with this site, so only Clash Display can be rendered as a live specimen here.",
    },
    gallery: [
      {
        layout: "full",
        media: media(
          "dipakkhik",
          "brand-profile.png",
          1024,
          492,
          "Dipakkhik brand profile spread with Bengali logotype and plum background",
          "Brand profile",
        ),
      },
      {
        layout: "pair",
        left: media(
          "dipakkhik",
          "typography.png",
          1024,
          576,
          "Dipakkhik brand guide typography slide naming Clash Display and Waterfall Regular",
          "Typography system",
        ),
        right: media(
          "dipakkhik",
          "brand-colours.png",
          1024,
          576,
          "Dipakkhik brand guide colour slide with four named swatches",
          "Colour system",
        ),
      },
      {
        layout: "pair",
        left: media(
          "dipakkhik",
          "graphic-elements.png",
          1024,
          576,
          "Dipakkhik graphic element studies and frame devices",
          "Graphic elements",
        ),
        right: media(
          "dipakkhik",
          "social-posters.png",
          1024,
          576,
          "Dipakkhik wedding social media poster layouts",
          "Social layouts",
        ),
      },
      {
        layout: "pair",
        left: media(
          "dipakkhik",
          "merchandise.png",
          1024,
          576,
          "Dipakkhik merchandise including mugs, lanyards and apparel",
          "Merchandise",
        ),
        right: media(
          "dipakkhik",
          "stationery.png",
          1024,
          576,
          "Dipakkhik stationery including boxes, pens and notebooks",
          "Stationery",
        ),
      },
    ],
    sources: [portfolio("Dipakkhik", "dipakkhik"), coverSource],
    verification: "Published project record plus artwork review",
  },
  {
    slug: "urbancut",
    introduction:
      "A barbershop identity with vintage signage warmth and a sharp, editorial wordmark.",
    client: "Urbancut Salon",
    industry: "Barbering and grooming",
    category: "Branding",
    services: [
      "Brand Guidelines",
      "Logo Design",
      "Signage",
      "Print Collateral",
      "Outdoor Mockups",
    ],
    deliverables: [
      "Logo variants and glass-etched signage",
      "Outdoor signage and door displays",
      "Visiting cards",
      "Spray bottle and product branding",
    ],
    overview: [
      "URBANCUT is a premium barbershop that needed a bold, masculine identity with a vintage edge. The brand had to work at street level as well as on print and product.",
      "A condensed wordmark, a scissors counter and a warm wine-and-cream palette create the signature. Signage, cards and product labels extend the same language.",
    ],
    workScope:
      "The published scope covers brand guidelines, logo design, signage, print collateral and outdoor mockups. The supplied artwork documents glass and hanging signs, cards, door graphics and product packaging.",
    creativeDirection: [
      "The wordmark uses a tall condensed display face with a scissors mark replacing the X. It reads as a stamp or a shop sign rather than a polite corporate logo.",
      "Wine, cream and warm orange keep the identity vintage without becoming sepia. Glass etching, illuminated ovals and product labels all use the same high-contrast pairing.",
    ],
    identityNotes: [
      { label: "Mark", value: "Condensed wordmark with scissors forming the X" },
      { label: "Lettering", value: "Tall display serif-sans hybrid with a vintage cut" },
      { label: "Applications", value: "Glass sign, hanging sign, cards, labels, door graphics" },
      { label: "Tone", value: "Warm barbershop craft with a premium finish" },
    ],
    palette: [
      {
        name: "Barber Wine",
        hex: "#8A3641",
        role: "Primary accent",
        provenance: "Artwork-sampled",
      },
      {
        name: "Vintage Cream",
        hex: "#E3D7AA",
        role: "Light surface",
        provenance: "Artwork-sampled",
      },
      {
        name: "Sign Orange",
        hex: "#F56535",
        role: "Illuminated signage",
        provenance: "Artwork-sampled",
      },
      {
        name: "Espresso",
        hex: "#211C18",
        role: "Deep neutral",
        provenance: "Artwork-sampled",
      },
      {
        name: "Stone",
        hex: "#A19890",
        role: "Material neutral",
        provenance: "Artwork-sampled",
      },
    ],
    paletteNote:
      "Sampled from the supplied signage, card and product artwork; these are presentation values, not certified brand codes.",
    gallery: [
      {
        layout: "pair",
        left: media(
          "urbancut",
          "glass-signage.jpg",
          1024,
          683,
          "URBANCUT glass-etched logo on a dark salon window",
          "Glass signage",
        ),
        right: media(
          "urbancut",
          "outdoor-sign.jpg",
          1024,
          683,
          "URBANCUT illuminated oval outdoor salon sign",
          "Outdoor sign",
        ),
      },
      {
        layout: "pair",
        left: media(
          "urbancut",
          "hanging-sign.jpg",
          1024,
          650,
          "URBANCUT hanging pavement sign outside the salon",
          "Pavement sign",
        ),
        right: media(
          "urbancut",
          "product-range.jpg",
          1024,
          768,
          "URBANCUT branded spray bottles and product jars",
          "Product range",
        ),
      },
      {
        layout: "portrait",
        media: media(
          "urbancut",
          "brand-overview.jpg",
          327,
          1024,
          "URBANCUT brand overview showing logo, colours, signage and stationery",
          "Brand overview",
        ),
      },
    ],
    sources: [portfolio("URBANCUT", "urbancut"), coverSource],
    verification: "Published project record plus artwork review",
  },
  {
    slug: "oralshine",
    introduction:
      "A clean dental identity pairing clinical navy with a fresh green smile mark.",
    client: "Oral Shine",
    industry: "Dental care",
    category: "Branding",
    services: [
      "Brand Guidelines",
      "Visiting Card",
      "Letterhead Design",
      "Social Media Posts",
      "Indoor Signage",
    ],
    deliverables: [
      "Brand guidelines",
      "Visiting card and letterhead",
      "Social media posts",
      "Indoor signage",
    ],
    overview: [
      "Oral Shine is a dental care brand that needed a clean, clinical identity to build patient trust from the first impression.",
      "Navy, white and a fresh green smile mark create the core. The system carries through stationery, social posts and indoor signage without losing its calm, professional tone.",
    ],
    workScope:
      "The published scope covers brand guidelines, visiting cards, letterhead design, social media posts and indoor signage. The supplied artwork documents each of those applications.",
    creativeDirection: [
      "The mark combines a tooth silhouette with a green smile curve, set beside a rounded sans wordmark. Navy gives the brand clinical weight while the green keeps it approachable.",
      "Social layouts use bright dental photography, a blue field and short benefit-led headlines. Signage and stationery stay quieter, with white space doing most of the work.",
    ],
    identityNotes: [
      { label: "Mark", value: "Tooth silhouette with a green smile curve" },
      { label: "Lettering", value: "Rounded geometric sans with a light wordmark" },
      { label: "Applications", value: "Cards, letterhead, social posts, indoor signage" },
      { label: "Tone", value: "Clinical navy balanced by a fresh green" },
    ],
    palette: [
      {
        name: "Clinical Navy",
        hex: "#2E466D",
        role: "Primary surface",
        provenance: "Artwork-sampled",
      },
      {
        name: "Oral Blue",
        hex: "#0D4EBB",
        role: "Campaign accent",
        provenance: "Artwork-sampled",
      },
      {
        name: "Fresh Green",
        hex: "#22C55E",
        role: "Smile accent",
        provenance: "Artwork-sampled",
      },
      {
        name: "Sky",
        hex: "#A2C7E2",
        role: "Light supporting tone",
        provenance: "Artwork-sampled",
      },
      {
        name: "Paper",
        hex: "#FFFFFF",
        role: "Light surface",
        provenance: "Artwork-sampled",
      },
    ],
    paletteNote:
      "Sampled from the supplied stationery, social and signage artwork. The published metadata lists cyan values that do not match the navy-and-green identity, so the artwork values are used.",
    gallery: [
      {
        layout: "pair",
        left: media(
          "oralshine",
          "stationery.png",
          891,
          594,
          "Oral Shine navy business cards with green and blue pencils",
          "Business cards",
        ),
        right: media(
          "oralshine",
          "letterhead.png",
          891,
          594,
          "Oral Shine letterhead and stationery set",
          "Letterhead",
        ),
      },
      {
        layout: "pair",
        left: media(
          "oralshine",
          "smile-campaign.jpg",
          1024,
          1024,
          "Oral Shine Smile Bright social campaign with a smiling patient",
          "Smile campaign",
        ),
        right: media(
          "oralshine",
          "indoor-signage.png",
          995,
          663,
          "Oral Shine indoor clinic signage and roll-up banners",
          "Indoor signage",
        ),
      },
    ],
    sources: [portfolio("Oral Shine", "oral-shine"), coverSource],
    verification: "Published project record plus artwork review",
  },
  {
    slug: "flex",
    introduction:
      "A high-energy apparel identity built on a lightning mark and a lime-purple contrast.",
    client: "Flex",
    industry: "Apparel and fitness",
    category: "Branding",
    services: ["Brand Identity", "Logo Design", "Apparel Mockups", "Visual System"],
    deliverables: [
      "Lightning logo",
      "Cap and apparel mockups",
      "Retail signage applications",
      "Brand overview",
    ],
    overview: [
      "Flex is an apparel and fitness brand built for performance culture. The identity needed to feel fast, physical and usable across a merchandise range.",
      "A lightning bolt and a condensed italic wordmark sit at the centre. Volt lime and court purple give the brand a deliberately athletic contrast.",
    ],
    workScope:
      "The published scope covers brand identity, logo design, apparel mockups and a visual system. The supplied artwork shows the mark on caps, bags, hoodies, shorts, leggings and a retail facade.",
    creativeDirection: [
      "The lightning bolt acts as both icon and framing device, while the wordmark stays compact and italic. The mark flips between white-on-purple and black-on-lime without losing recognition.",
      "Applications lean on large blocks of lime and purple against black or chalk grounds. The result is closer to a sports kit than a fashion lookbook.",
    ],
    identityNotes: [
      { label: "Mark", value: "Rounded lightning bolt with an italic wordmark" },
      { label: "Lettering", value: "Condensed italic sans, set tight to the bolt" },
      { label: "Applications", value: "Caps, bags, hoodies, shorts, leggings, retail signage" },
      { label: "Tone", value: "High-energy performance with a two-colour contrast" },
    ],
    palette: [
      {
        name: "Volt Lime",
        hex: "#9CFF2F",
        role: "Primary accent",
        provenance: "Artwork-sampled",
      },
      {
        name: "Field Lime",
        hex: "#8CCB3E",
        role: "Apparel green",
        provenance: "Artwork-sampled",
      },
      {
        name: "Court Purple",
        hex: "#6C4AB6",
        role: "Secondary accent",
        provenance: "Artwork-sampled",
      },
      {
        name: "Carbon",
        hex: "#111111",
        role: "Primary dark",
        provenance: "Artwork-sampled",
      },
      {
        name: "Chalk",
        hex: "#E2DEDE",
        role: "Light neutral",
        provenance: "Artwork-sampled",
      },
    ],
    paletteNote:
      "Sampled from the supplied cap and apparel artwork. The published metadata lists red and orange values that do not match the lime-purple identity, so the artwork values are used.",
    gallery: [
      {
        layout: "full",
        media: media(
          "flex",
          "cap-mockup.png",
          1051,
          1051,
          "Flex white cap with a lime lightning mark on a lime and dark background",
          "Cap mockup",
        ),
      },
      {
        layout: "portrait",
        media: media(
          "flex",
          "brand-overview.jpg",
          1143,
          2560,
          "Flex brand overview showing logo variants, retail signage, bags, apparel and caps",
          "Brand application range",
        ),
      },
    ],
    sources: [portfolio("Flex", "flex"), coverSource],
    verification: "Published project record plus artwork review",
  },
  {
    slug: "elegantic",
    introduction:
      "A luxury beauty identity in bronze, caramel and warm neutral tones.",
    client: "Elegantic",
    industry: "Beauty and cosmetics",
    category: "Branding",
    services: [
      "Brand Guidelines",
      "Logo Design",
      "Packaging Design",
      "Luxury Identity",
    ],
    deliverables: [
      "Serif wordmark and lotus motif",
      "Brand guidelines",
      "Packaging mockups",
      "Branded shopping bag",
    ],
    overview: [
      "Elegantic is a luxury cosmetics brand that needed an identity speaking to refinement, elegance and premium quality.",
      "A serif wordmark, a fine lotus line motif and a warm bronze palette position the brand in the beauty market without relying on cold minimalism.",
    ],
    workScope:
      "The published scope covers brand guidelines, logo design, packaging design and a luxury identity. The supplied artwork documents the key visual, product packaging and a branded bag.",
    creativeDirection: [
      "The wordmark is set in a high-contrast serif with a custom ligature, framed by a symmetrical lotus drawn in a single hairline. Skin tones and warm shadows give the key visual its intimacy.",
      "Packaging moves the same palette onto amber glass, cream labels and a patterned bag. Bronze stays the bridge between the editorial image and the physical product.",
    ],
    identityNotes: [
      { label: "Mark", value: "Serif wordmark framed by a hairline lotus motif" },
      { label: "Lettering", value: "High-contrast serif with a custom lowercase ligature" },
      { label: "Applications", value: "Key visual, packaging, product labels, shopping bag" },
      { label: "Tone", value: "Warm luxury rather than cold minimalism" },
    ],
    palette: [
      {
        name: "Antique Bronze",
        hex: "#B69D74",
        role: "Primary metallic accent",
        provenance: "Published portfolio",
      },
      {
        name: "Caramel",
        hex: "#DFA264",
        role: "Warm surface",
        provenance: "Artwork-sampled",
      },
      {
        name: "Espresso",
        hex: "#602000",
        role: "Deep shadow",
        provenance: "Artwork-sampled",
      },
      {
        name: "Champagne",
        hex: "#FDE2B2",
        role: "Light highlight",
        provenance: "Artwork-sampled",
      },
      {
        name: "Ivory",
        hex: "#FCF3E1",
        role: "Paper neutral",
        provenance: "Artwork-sampled",
      },
    ],
    paletteNote:
      "Antique Bronze is the published accent. The supporting tones are sampled from the supplied key visual and packaging artwork.",
    gallery: [
      {
        layout: "full",
        media: media(
          "elegantic",
          "brand-key-visual.jpg",
          730,
          718,
          "Elegantic beauty key visual with the serif wordmark and lotus motif over two faces",
          "Key visual",
        ),
      },
      {
        layout: "pair",
        left: media(
          "elegantic",
          "packaging.png",
          458,
          327,
          "Elegantic amber glass packaging with cream labels and warm stones",
          "Packaging",
        ),
        right: media(
          "elegantic",
          "shopping-bag.png",
          525,
          388,
          "Elegantic patterned shopping bag with a bronze band",
          "Shopping bag",
        ),
      },
    ],
    sources: [portfolio("Elegantic", "elegantic"), coverSource],
    verification: "Published project record plus artwork review",
  },
  {
    slug: "yogic-rhythm",
    introduction:
      "A calm, spirited identity for a yoga studio, carried by a lotus figure and plum tones.",
    client: "Yogic Rhythm",
    industry: "Wellness and yoga",
    category: "Social Media",
    services: [
      "Logo Design",
      "Facebook Cover",
      "Social Media Posts",
      "Brand Identity",
      "Brand Guidelines",
    ],
    deliverables: [
      "Lotus meditator logo",
      "Facebook cover",
      "Social media post series",
      "Brand guidelines",
    ],
    overview: [
      "Yogic Rhythm is a wellness and yoga studio seeking an identity as harmonious as its practice. The brand needed to feel spiritual and calming without becoming passive.",
      "A white lotus figure on plum, soft gradients and a steady social cadence carry the identity. Campaign posts move between class promotion, seasonal greetings and practical yoga facts.",
    ],
    workScope:
      "The published scope covers logo design, a Facebook cover, social media posts, brand identity and brand guidelines. The supplied artwork documents the logo, cover and a broad social series.",
    creativeDirection: [
      "The mark turns a seated meditator into a lotus flower in a single white silhouette. Plum and magenta give it depth, while cream and sand keep the social layouts breathable.",
      "Posts use large type, cut-out photography and soft circular fields. Seasonal Bengali greetings sit comfortably beside class schedules because the grid and palette stay constant.",
    ],
    identityNotes: [
      { label: "Mark", value: "Seated meditator formed as a white lotus" },
      { label: "Lettering", value: "Wide spaced serif caps with a thin supporting line" },
      { label: "Applications", value: "Facebook cover, class posts, seasonal greetings, fact cards" },
      { label: "Tone", value: "Calm, spiritual and community-facing" },
    ],
    palette: [
      {
        name: "Plum",
        hex: "#631054",
        role: "Primary surface",
        provenance: "Artwork-sampled",
      },
      {
        name: "Burgundy",
        hex: "#62172B",
        role: "Deep campaign tone",
        provenance: "Artwork-sampled",
      },
      {
        name: "Blush",
        hex: "#AB2A59",
        role: "Warm accent",
        provenance: "Artwork-sampled",
      },
      {
        name: "Sand",
        hex: "#FDD8A2",
        role: "Warm highlight",
        provenance: "Artwork-sampled",
      },
      {
        name: "Cream",
        hex: "#FFFCF8",
        role: "Light surface",
        provenance: "Artwork-sampled",
      },
    ],
    paletteNote:
      "Sampled from the supplied logo, cover and social artwork. The published metadata lists violet values that do not match the plum-and-magenta identity, so the artwork values are used.",
    gallery: [
      {
        layout: "full",
        media: media(
          "yogic-rhythm",
          "facebook-cover.jpg",
          1024,
          500,
          "Yogic Rhythm Facebook cover with a yoga silhouette and plum gradient",
          "Facebook cover",
        ),
      },
      {
        layout: "pair",
        left: media(
          "yogic-rhythm",
          "logo.jpg",
          1024,
          1024,
          "Yogic Rhythm white lotus meditator logo on plum",
          "Logo",
        ),
        right: media(
          "yogic-rhythm",
          "online-classes.jpg",
          1024,
          1024,
          "Yogic Rhythm online yoga classes social post",
          "Online classes",
        ),
      },
      {
        layout: "pair",
        left: media(
          "yogic-rhythm",
          "alignment-post.jpg",
          1024,
          1024,
          "Yogic Rhythm alignment is important social post",
          "Alignment post",
        ),
        right: media(
          "yogic-rhythm",
          "yoga-facts.jpg",
          1024,
          1024,
          "Yogic Rhythm yoga facts social post about the number of styles",
          "Yoga facts",
        ),
      },
    ],
    sources: [
      portfolio("Yogic Rhythm", "yogic-rhythm"),
      coverSource,
    ],
    verification: "Published project record plus artwork review",
  },
];

const bySlug = new Map(CASE_STUDIES.map((study) => [study.slug, study]));

for (const project of WORK_PROJECTS) {
  if (!bySlug.has(project.slug)) {
    throw new Error(`Missing case study for canonical project: ${project.slug}`);
  }
}
for (const study of CASE_STUDIES) {
  if (!WORK_PROJECTS.some((project) => project.slug === study.slug)) {
    throw new Error(`Case study references an unpublished slug: ${study.slug}`);
  }
}
if (CASE_STUDIES.length !== WORK_PROJECTS.length) {
  throw new Error(
    `Case studies list ${CASE_STUDIES.length} of ${WORK_PROJECTS.length} projects.`,
  );
}

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return bySlug.get(slug);
}
