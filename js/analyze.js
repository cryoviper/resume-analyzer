// Resume analysis that runs entirely in the browser. Pure functions, unit tested.

// Canonical skill -> aliases (lowercase). Matching is whole-word.
export const SKILLS = {
  // languages
  "JavaScript": ["javascript", "js", "es6", "ecmascript"], "TypeScript": ["typescript", "ts"], "Python": ["python"], "Java": ["java"],
  "C++": ["c++", "cpp"], "C#": ["c#", "csharp"], "Go": ["golang", "go lang"], "Rust": ["rust"], "PHP": ["php"], "Ruby": ["ruby"],
  "Kotlin": ["kotlin"], "Swift": ["swift"], "SQL": ["sql"], "HTML": ["html", "html5"], "CSS": ["css", "css3"], "Bash": ["bash", "shell scripting"],
  // frontend
  "React": ["react", "react.js", "reactjs"], "Next.js": ["next.js", "nextjs"], "Vue": ["vue", "vue.js", "vuejs"], "Angular": ["angular"],
  "Svelte": ["svelte"], "Redux": ["redux"], "Tailwind CSS": ["tailwind", "tailwindcss", "tailwind css"], "Sass": ["sass", "scss"],
  "Vite": ["vite"], "Webpack": ["webpack"], "Three.js": ["three.js", "threejs"], "Framer Motion": ["framer motion"],
  "Responsive design": ["responsive design", "responsive", "mobile-first", "mobile first"], "Accessibility": ["accessibility", "a11y", "wcag"],
  // backend
  "Node.js": ["node.js", "nodejs", "node"], "Express": ["express", "express.js", "expressjs"], "Django": ["django"], "Flask": ["flask"],
  "FastAPI": ["fastapi"], "Spring": ["spring", "spring boot"], "REST APIs": ["rest", "rest api", "rest apis", "restful"], "GraphQL": ["graphql"],
  "PostgreSQL": ["postgresql", "postgres"], "MySQL": ["mysql"], "MongoDB": ["mongodb", "mongo"], "SQLite": ["sqlite"], "Redis": ["redis"],
  "Supabase": ["supabase"], "Firebase": ["firebase"], "Prisma": ["prisma"],
  // cloud / devops
  "AWS": ["aws", "amazon web services"], "Azure": ["azure"], "GCP": ["gcp", "google cloud"], "Docker": ["docker"], "Kubernetes": ["kubernetes", "k8s"],
  "CI/CD": ["ci/cd", "ci cd", "continuous integration", "github actions", "gitlab ci", "jenkins"], "Git": ["git", "github", "gitlab"],
  "Linux": ["linux"], "Vercel": ["vercel"], "Netlify": ["netlify"], "Serverless": ["serverless", "lambda"],
  // testing / quality
  "Testing": ["testing", "unit tests", "unit testing", "test-driven", "tdd"], "Jest": ["jest"], "Vitest": ["vitest"], "Cypress": ["cypress"],
  "Playwright": ["playwright"], "Performance": ["performance optimization", "web vitals", "lighthouse"],
  // data / AI
  "Machine learning": ["machine learning", "ml"], "Pandas": ["pandas"], "NumPy": ["numpy"], "scikit-learn": ["scikit-learn", "sklearn"],
  "TensorFlow": ["tensorflow"], "PyTorch": ["pytorch"], "LLMs": ["llm", "llms", "openai", "gemini", "large language models", "prompt engineering"],
  "Data structures": ["data structures", "algorithms", "dsa"],
  // design / product
  "Figma": ["figma"], "UI/UX": ["ui/ux", "ux", "ui design", "user experience", "user interface"], "SEO": ["seo"],
  // ways of working
  "Agile": ["agile", "scrum", "kanban"], "Communication": ["communication", "communicate"], "Teamwork": ["teamwork", "collaboration", "collaborate", "cross-functional"],
  "Problem solving": ["problem solving", "problem-solving"], "Leadership": ["leadership", "led a team", "mentored", "mentoring"],
  "Customer support": ["customer support", "customer service", "zendesk", "helpdesk"],
};

const SECTIONS = {
  contact: /\b(email|phone|linkedin|github|@)\b/i,
  summary: /^\s*(summary|profile|about( me)?|objective)\s*$/im,
  experience: /^\s*((work|professional) )?(experience|employment|work history)\s*$/im,
  education: /^\s*(education|academics?|qualifications?)\s*$/im,
  skills: /^\s*((technical|key|core) )?skills(\s*&\s*tools)?\s*$/im,
  projects: /^\s*(projects?|personal projects|portfolio)\s*$/im,
};

const ACTION_VERBS = ["built", "created", "designed", "developed", "launched", "led", "improved", "reduced", "increased", "automated", "implemented", "shipped",
  "optimized", "migrated", "refactored", "delivered", "architected", "deployed", "integrated", "managed", "mentored", "owned", "scaled", "tested", "wrote",
  "analyzed", "resolved", "streamlined", "collaborated", "negotiated", "trained", "organized", "won", "achieved", "grew", "cut", "saved"];
const WEAK = ["responsible for", "worked on", "helped with", "duties included", "tasked with", "involved in", "assisted with", "various", "etc"];

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Whole-word matcher that also works for tokens like "c++", "next.js" and "ci/cd".
const wordRe = (alias) => new RegExp(`(^|[^a-z0-9+#])${esc(alias)}(?=$|[^a-z0-9+#])`, "i");

export function findSkills(text) {
  const t = " " + text.toLowerCase() + " ";
  const found = new Set();
  for (const [skill, aliases] of Object.entries(SKILLS)) {
    // "go", "node", "rust" and "swift" are common words; require extra context for very short or ambiguous aliases
    if (aliases.some((a) => wordRe(a).test(t))) found.add(skill);
  }
  // reduce false positives for ambiguous words
  if (found.has("Go") && !/\bgolang\b|\bgo lang\b/i.test(text)) found.delete("Go");
  if (found.has("Java") && /\bjavascript\b/i.test(text) && !/\bjava\b(?!script)/i.test(text)) found.delete("Java");
  if (found.has("CSS") && !wordRe("css").test(t.replace(/tailwind\s?css/g, ""))) found.delete("CSS");
  return found;
}

export function contactInfo(text) {
  return {
    email: (text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/) || [null])[0],
    phone: (text.match(/(\+?\d[\d\s().-]{8,}\d)/) || [null])[0],
    linkedin: /linkedin\.com\/in\/[\w-]+/i.test(text),
    github: /github\.com\/[\w-]+/i.test(text),
  };
}

export function bullets(text) {
  return text.split(/\n/).map((l) => l.trim()).filter((l) => /^([-•*▪◦]|\d+[.)])\s+/.test(l) || (l.length > 40 && /^[A-Z][a-z]+ed\b/.test(l)))
    .map((l) => l.replace(/^([-•*▪◦]|\d+[.)])\s+/, ""));
}

export function analyze(resume, job = "") {
  const words = (resume.match(/\b[\w'+#.-]+\b/g) || []).length;
  const lower = resume.toLowerCase();
  const resumeSkills = findSkills(resume);
  const jobSkills = job.trim() ? findSkills(job) : new Set();
  const matched = [...jobSkills].filter((s) => resumeSkills.has(s));
  const missing = [...jobSkills].filter((s) => !resumeSkills.has(s));

  const sections = Object.fromEntries(Object.entries(SECTIONS).map(([k, re]) => [k, re.test(resume)]));
  const contact = contactInfo(resume);
  sections.contact = !!(contact.email || contact.phone);

  const bl = bullets(resume);
  const verbHits = ACTION_VERBS.filter((v) => new RegExp(`\\b${v}\\b`, "i").test(lower));
  const weakHits = WEAK.filter((w) => lower.includes(w));
  const quantified = bl.filter((b) => /\d/.test(b) && /(%|\b\d+[kmx+]?\b|₹|\$|users|hours|days|minutes|ms|seconds)/i.test(b)).length;
  const startsWithVerb = bl.filter((b) => ACTION_VERBS.includes(b.split(/\s+/)[0].toLowerCase())).length;

  // ---- score (0–100) ----
  const parts = [];
  const add = (label, got, max, tip) => parts.push({ label, got: Math.round(got), max, tip });
  if (jobSkills.size) add("Job keyword match", (matched.length / jobSkills.size) * 40, 40, missing.length ? `Add the missing skills you actually have: ${missing.slice(0, 5).join(", ")}.` : "Great keyword coverage.");
  const secKeys = ["contact", "experience", "education", "skills", "projects"];
  const secGot = secKeys.filter((k) => sections[k]).length;
  add("Sections", (secGot / secKeys.length) * (jobSkills.size ? 15 : 25), jobSkills.size ? 15 : 25,
    secGot === secKeys.length ? "All the key sections are there." : `Add a clear heading for: ${secKeys.filter((k) => !sections[k]).join(", ")}.`);
  const bulletScore = bl.length ? Math.min(1, quantified / Math.max(3, bl.length * 0.4)) : 0;
  add("Measurable results", bulletScore * 15, 15, quantified >= 3 ? `${quantified} bullets include numbers. Nice.` : "Add numbers to your bullets: users, %, time saved, money, team size.");
  const verbScore = bl.length ? Math.min(1, startsWithVerb / Math.max(3, bl.length * 0.6)) : Math.min(1, verbHits.length / 8);
  add("Strong action verbs", verbScore * 10 - Math.min(5, weakHits.length * 2), 10,
    weakHits.length ? `Replace weak phrases like "${weakHits[0]}" with verbs like built, shipped, improved.` : "Bullets start with strong verbs.");
  const lengthOk = words >= 250 && words <= 900;
  add("Length", lengthOk ? 10 : words < 250 ? (words / 250) * 10 : Math.max(0, 10 - (words - 900) / 60), 10,
    lengthOk ? `${words} words, about ${Math.max(1, Math.round(words / 450))} page${words > 675 ? "s" : ""}.` : words < 250 ? "Too short. Add projects and results." : "Too long. Aim for 1 page early in your career.");
  const contactGot = [contact.email, contact.phone, contact.linkedin || contact.github].filter(Boolean).length;
  add("Contact and links", (contactGot / 3) * (jobSkills.size ? 10 : 15), jobSkills.size ? 10 : 15,
    contactGot === 3 ? "Email, phone and profile links found." : `Add ${[!contact.email && "email", !contact.phone && "phone", !(contact.linkedin || contact.github) && "LinkedIn or GitHub link"].filter(Boolean).join(", ")}.`);
  // keep the total out of 100 when there is no job description
  const max = parts.reduce((a, p) => a + p.max, 0);
  const score = Math.max(0, Math.min(100, Math.round((parts.reduce((a, p) => a + Math.max(0, p.got), 0) / max) * 100)));

  return {
    score, parts, words, sections, contact,
    skills: [...resumeSkills].sort(), jobSkills: [...jobSkills].sort(), matched: matched.sort(), missing: missing.sort(),
    bullets: bl.length, quantified, startsWithVerb, verbs: verbHits, weak: weakHits,
  };
}
