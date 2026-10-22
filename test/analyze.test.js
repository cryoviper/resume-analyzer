import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { analyze, findSkills, contactInfo, bullets } from "../js/analyze.js";

const RESUME = `Praveen Sinwar
praveen@example.com · +91 98765 43210 · github.com/cryoviper · linkedin.com/in/praveen

SUMMARY
Frontend developer who builds fast React apps.

EXPERIENCE
Founder & Web Developer, Xyron Studio (2025 – present)
- Built 10+ client websites with React, Tailwind CSS and Vite
- Reduced page load time by 40% by lazy loading images
- Responsible for client calls

PROJECTS
- Developed a URL shortener API in Node.js and Express with SQLite and 11 tests
- Shipped a streaming AI chat UI used by 200 users

SKILLS
JavaScript, TypeScript, React, Next.js, Node.js, Git, Docker

EDUCATION
BCA, MDSU Ajmer`;

const JOB = "We need a React developer with TypeScript, Next.js, GraphQL, testing with Jest, CI/CD and good communication.";

describe("findSkills", () => {
  test("matches aliases and punctuation-heavy names", () => {
    const s = findSkills("Worked with reactjs, Next.js, C++, ci/cd pipelines and Tailwind");
    for (const k of ["React", "Next.js", "C++", "CI/CD", "Tailwind CSS"]) assert.ok(s.has(k), k);
  });
  test("does not confuse JavaScript with Java", () => {
    assert.equal(findSkills("JavaScript developer").has("Java"), false);
    assert.equal(findSkills("Java and JavaScript").has("Java"), true);
  });
  test("ignores the common word 'go'", () => {
    assert.equal(findSkills("ready to go live").has("Go"), false);
    assert.equal(findSkills("services written in Golang").has("Go"), true);
  });
});

test("contactInfo finds email, phone and links", () => {
  const c = contactInfo(RESUME);
  assert.equal(c.email, "praveen@example.com");
  assert.ok(c.phone);
  assert.ok(c.github && c.linkedin);
});

test("bullets strips markers", () => {
  assert.deepEqual(bullets("- one thing here\n• two\nplain line"), ["one thing here", "two"]);
});

describe("analyze", () => {
  const r = analyze(RESUME, JOB);
  test("finds matched and missing job skills", () => {
    for (const k of ["React", "TypeScript", "Next.js"]) assert.ok(r.matched.includes(k), k);
    for (const k of ["GraphQL", "Jest", "CI/CD"]) assert.ok(r.missing.includes(k), k);
  });
  test("detects sections and weak phrases", () => {
    assert.ok(r.sections.experience && r.sections.education && r.sections.skills && r.sections.projects);
    assert.ok(r.weak.includes("responsible for"));
  });
  test("counts quantified bullets", () => {
    assert.ok(r.quantified >= 3);
  });
  test("score is between 0 and 100 and parts add up", () => {
    assert.ok(r.score > 0 && r.score <= 100);
    assert.equal(r.parts.reduce((a, p) => a + p.max, 0), 100);
  });
  test("works without a job description", () => {
    const x = analyze(RESUME);
    assert.equal(x.jobSkills.length, 0);
    assert.equal(x.parts.reduce((a, p) => a + p.max, 0), 75);
    assert.ok(x.score > 0 && x.score <= 100);
  });
  test("handles empty input", () => {
    const x = analyze("");
    assert.equal(x.score >= 0, true);
    assert.equal(x.words, 0);
  });
});

test("'Tailwind CSS' alone does not count as CSS", () => {
  assert.equal(findSkills("Nice to have: Tailwind CSS").has("CSS"), false);
  assert.equal(findSkills("HTML, CSS and Tailwind CSS").has("CSS"), true);
});
