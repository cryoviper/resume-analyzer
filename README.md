# Fitcheck · Resume Analyzer

Check your resume against a job description. Get a match score out of 100, the skills you're missing, a section check and clear fixes for your bullet points. Everything runs in your browser, so your resume never leaves your device.

**Live:** https://cryoviper.github.io/resume-analyzer/

## Features

- Upload a PDF (read in the browser with Mozilla PDF.js), a TXT file, drag and drop, or paste text
- Optional job description for a keyword match: matched and missing skills
- Score breakdown with a tip for each part:
  - job keyword match
  - key sections (contact, experience, education, skills, projects)
  - measurable results (bullets with numbers)
  - strong action verbs vs weak phrases like "responsible for"
  - length
  - contact info and profile links
- Detects 90+ skills with aliases (`reactjs` → React, `k8s` → Kubernetes, `ci/cd`, `C++`, `C#`)
- Sample resume and job post to try it instantly
- Warns when a PDF is a scanned image with no selectable text

## How it works

All the logic lives in `js/analyze.js` as pure functions:

- Whole-word matching that handles tricky names like `C++`, `Next.js` and `CI/CD`
- Guards against false positives: "JavaScript" doesn't count as Java, the word "go" doesn't count as Golang, and "Tailwind CSS" alone doesn't count as CSS
- The score is weighted and always adds up to 100, with or without a job description

12 tests with the built-in `node:test` runner cover skill matching, contact detection, scoring and edge cases. GitHub Actions runs them before every deploy.

## Run locally

```bash
git clone https://github.com/cryoviper/resume-analyzer.git
cd resume-analyzer
npm test
npx serve .
```

## Privacy

No backend and no tracking. The resume is read and analysed in the page itself. The only network request is loading PDF.js from a CDN.

## What I learned

- Parsing PDFs in the browser with PDF.js
- Designing a fair scoring system and explaining each part to the user
- Writing regexes that are strict enough to avoid false matches

---

Built by [Praveen Sinwar](https://github.com/cryoviper).
