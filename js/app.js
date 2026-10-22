import { analyze } from "./analyze.js";
import { SAMPLE_RESUME, SAMPLE_JOB } from "./samples.js";

const $ = (id) => document.getElementById(id);
const PDFJS = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs";
const WORKER = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";

// ---------- file reading ----------
let pdfjs;
async function readPdf(file) {
  if (!pdfjs) {
    pdfjs = await import(PDFJS);
    pdfjs.GlobalWorkerOptions.workerSrc = WORKER;
  }
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const content = await (await doc.getPage(i)).getTextContent();
    let text = "";
    for (const item of content.items) text += item.str + (item.hasEOL ? "\n" : " ");
    pages.push(text.replace(/[ \t]+\n/g, "\n").replace(/ {2,}/g, " "));
  }
  return { text: pages.join("\n\n"), pages: doc.numPages };
}

async function loadFile(file) {
  const note = $("fileNote");
  if (file.size > 8 * 1024 * 1024) { note.textContent = "That file is over 8 MB. Try a smaller PDF."; return; }
  note.textContent = `Reading ${file.name}…`;
  try {
    if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
      const { text, pages } = await readPdf(file);
      if (text.trim().length < 50) {
        note.textContent = "This PDF has almost no selectable text (it may be a scanned image). Paste the text instead.";
        return;
      }
      $("resume").value = text.trim();
      note.textContent = `Read ${pages} page${pages > 1 ? "s" : ""} from ${file.name}. Check the text below looks right.`;
    } else {
      $("resume").value = (await file.text()).trim();
      note.textContent = `Loaded ${file.name}.`;
    }
  } catch (err) {
    console.error(err);
    note.textContent = "Couldn't read that file. Paste your resume text instead.";
  }
}

$("file").addEventListener("change", (e) => { if (e.target.files[0]) loadFile(e.target.files[0]); e.target.value = ""; });
const drop = $("drop");
["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("over"); }));
["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("over"); }));
drop.addEventListener("drop", (e) => { const f = e.dataTransfer.files[0]; if (f) loadFile(f); });
$("sample").addEventListener("click", () => { $("resume").value = SAMPLE_RESUME; $("fileNote").textContent = "Loaded a sample resume (a made-up person)."; });
$("sampleJob").addEventListener("click", () => { $("job").value = SAMPLE_JOB; });

// ---------- render ----------
const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
const chips = (list, cls = "") => { const d = el("div", "chips " + cls); list.forEach((s) => d.append(el("span", null, s))); return d; };

$("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const resume = $("resume").value.trim();
  const job = $("job").value.trim();
  if (resume.length < 80) { $("err").textContent = "Add your resume first (paste the text or upload a PDF)."; $("resume").focus(); return; }
  $("err").textContent = "";
  render(analyze(resume, job), !!job);
  $("results").hidden = false;
  $("results").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
});

function render(r, hasJob) {
  // gauge
  $("scoreNum").textContent = r.score;
  $("gauge").setAttribute("aria-label", `Score ${r.score} out of 100`);
  requestAnimationFrame(() => ($("gaugeArc").style.strokeDasharray = `${(r.score / 100) * 314.2} 314.2`));
  const band = r.score >= 80 ? ["Strong", "Ready to send"] : r.score >= 60 ? ["Good", "A few fixes away"] : r.score >= 40 ? ["Needs work", "Worth an hour of edits"] : ["Weak", "Needs a rewrite"];
  $("scoreLabel").textContent = band[0];
  $("scoreHead").textContent = band[1];
  $("scoreSub").textContent = hasJob
    ? `Matches ${r.matched.length} of ${r.jobSkills.length} skills in the job post.`
    : "Add a job description to see how well you match a specific role.";

  // breakdown
  const parts = $("parts");
  parts.replaceChildren(...r.parts.map((p) => {
    const li = el("li");
    const row = el("div", "row");
    row.append(el("span", null, p.label), el("span", null, `${Math.max(0, p.got)}/${p.max}`));
    const bar = el("div", "bar");
    const i = el("i");
    const pct = Math.max(0, p.got) / p.max;
    i.style.width = Math.max(2, pct * 100) + "%";
    i.className = pct >= 0.75 ? "" : pct >= 0.45 ? "mid" : "low";
    bar.append(i);
    li.append(row, bar, el("p", null, p.tip));
    return li;
  }));

  // skills
  const box = $("skillsBox");
  box.replaceChildren();
  const group = (title, list, cls, empty) => {
    const g = el("div", "sk-group");
    g.append(el("h4", null, `${title} (${list.length})`));
    g.append(list.length ? chips(list, cls) : el("p", "weak", empty));
    box.append(g);
  };
  if (hasJob) {
    group("Matched", r.matched, "ok", "No skills from the job post found yet.");
    group("Missing from your resume", r.missing, "miss", "You cover every skill we found in the job post.");
  }
  group("All skills found in your resume", r.skills, "", "We couldn't detect skills. Add a Skills section.");

  // sections
  const names = { contact: "Contact info", summary: "Summary", experience: "Experience", projects: "Projects", skills: "Skills", education: "Education" };
  $("sections").replaceChildren(...Object.entries(names).map(([k, label]) => {
    const li = el("li", r.sections[k] ? "y" : "n2");
    li.append(el("i", null, r.sections[k] ? "✓" : "✕"), el("span", null, label));
    return li;
  }));

  // writing
  const w = $("writing");
  w.replaceChildren();
  [["Words", r.words], ["Bullet points", r.bullets], ["Bullets with numbers", r.quantified], ["Start with a strong verb", r.startsWithVerb]].forEach(([k, v]) => {
    const d = el("div");
    d.append(el("dt", null, k), el("dd", null, String(v)));
    w.append(d);
  });
  const weak = $("weakBox");
  weak.replaceChildren();
  if (r.weak.length) {
    const p = el("p", "weak");
    p.append("Weak phrases found: ");
    r.weak.forEach((x, i) => { p.append(el("b", null, `"${x}"`)); if (i < r.weak.length - 1) p.append(", "); });
    weak.append(p);
  } else weak.append(el("p", "weak", "No weak filler phrases found."));

  // tips: the lowest-scoring parts first
  const tips = [...r.parts].filter((p) => p.got / p.max < 0.85).sort((a, b) => a.got / a.max - b.got / b.max).map((p) => p.tip);
  if (!r.contact.github && !r.contact.linkedin) tips.push("Link your GitHub or LinkedIn so recruiters can check your work.");
  if (!tips.length) tips.push("Looks solid. Tailor your summary to each job and keep it to one page.");
  $("tips").replaceChildren(...tips.slice(0, 5).map((t) => el("li", null, t)));
}
