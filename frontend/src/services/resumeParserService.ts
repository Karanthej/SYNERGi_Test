import * as pdfjsLib from 'pdfjs-dist';

// Use CDN for the worker to avoid Vite build configuration issues
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.mjs`;

// Heuristic keyword lists
const TECH_KEYWORDS = ["React", "Python", "JavaScript", "HTML", "CSS", "Node.js", "Java", "C", "SQL", "Docker", "AWS", "CI/CD", "TypeScript", "PostgreSQL", "Machine Learning"];

/**
 * Extracts text from a PDF File object using pdf.js
 */
async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(" ");
    fullText += pageText + "\n";
  }
  
  return fullText;
}

/**
 * Parses the raw text into a dynamic analysis structure
 */
export async function analyzeResumeFile(file: File): Promise<any> {
  let text = "";
  try {
    if (file.type === "application/pdf") {
      text = await extractTextFromPDF(file);
    } else {
      // Fallback for non-PDFs if drag-and-drop allows them (though we'll restrict to PDF)
      text = await file.text();
    }
  } catch (error) {
    /* console.error removed */
    throw new Error("Failed to extract text from the document.");
  }

  // Very basic heuristic scoring
  const lowerText = text.toLowerCase();
  
  // 1. Detect keywords
  const detected: string[] = [];
  const missing: string[] = [];
  
  TECH_KEYWORDS.forEach(kw => {
    if (lowerText.includes(kw.toLowerCase())) {
      detected.push(kw);
    } else {
      missing.push(kw);
    }
  });

  // 2. Detect Sections
  const hasExperience = lowerText.includes("experience") || lowerText.includes("employment");
  const hasProjects = lowerText.includes("projects");
  const hasEducation = lowerText.includes("education") || lowerText.includes("university");

  // 3. Calculate Scores
  let programmingScore = Math.min(100, detected.length * 12);
  let expScore = hasExperience ? 85 : 0;
  let projScore = hasProjects ? 90 : 0;
  let eduScore = hasEducation ? 90 : 20;

  // Weighted overall score
  let overall = Math.round((programmingScore * 0.4) + (expScore * 0.3) + (projScore * 0.2) + (eduScore * 0.1));
  if (overall === 0) overall = 15; // Minimum floor if random text

  // 4. Basic Parsed Data extraction (Heuristics)
  const extractEmail = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
  const email = extractEmail ? extractEmail[0] : "Not Found";
  
  const extractPhone = text.match(/(\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9})/);
  const phone = extractPhone ? extractPhone[0].trim() : "Not extracted";

  const extractLinkedin = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
  const linkedin = extractLinkedin ? extractLinkedin[0] : "Not extracted";

  const extractGithub = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/i);
  const github = extractGithub ? extractGithub[0] : "Not extracted";
  
  // Helper to extract a snippet of text after a section header
  const extractSection = (keyword: string) => {
    const idx = lowerText.indexOf(keyword.toLowerCase());
    if (idx === -1) return "Not Detected";
    // Grab the next 150 characters after the keyword
    let snippet = text.substring(idx + keyword.length, idx + keyword.length + 150).trim();
    // Clean up newlines and excessive whitespace
    snippet = snippet.split('\n').filter(line => line.trim().length > 0).slice(0, 2).join(' | ');
    return snippet.replace(/\s+/g, ' ').trim() || "Detected";
  };

  const educationText = hasEducation ? extractSection("education") : "Not Detected";
  const experienceText = hasExperience ? (extractSection("experience") !== "Not Detected" ? extractSection("experience") : extractSection("employment")) : "Not Detected";
  const projectsText = hasProjects ? extractSection("projects") : "Not Detected";

  // Return structure matching backend response
  return {
    overallScore: overall,
    categories: [
      { name: "Programming Skills", score: programmingScore },
      { name: "Projects", score: projScore },
      { name: "Experience", score: expScore },
      { name: "Education", score: eduScore },
      { name: "Communication", score: 80 }
    ],
    keywords: {
      detected: detected,
      missing: missing.slice(0, 5), // Only suggest top 5 missing
      suggested: ["GraphQL", "Next.js"],
      compatibility: overall,
      density: detected.length > 5 ? "Good" : "Low"
    },
    recommendations: [
      !hasProjects ? { id: 1, text: "Your resume lacks a dedicated Projects section. Adding personal projects will greatly improve your ATS score.", type: "add" } : null,
      !hasExperience ? { id: 2, text: "No work experience found. Highlight relevant internships or volunteer work.", type: "add" } : null,
      detected.length < 3 ? { id: 3, text: "Add more technical keywords to pass automated ATS filters.", type: "improve" } : null
    ].filter(Boolean),
    parsedData: {
      name: file.name.split('.')[0], // Fallback to filename
      email: email,
      phone: phone,
      education: educationText,
      experience: experienceText,
      projects: projectsText,
      skills: detected.join(", "),
      certifications: "See document",
      achievements: "See document",
      languages: "English",
      github: github,
      linkedin: linkedin,
      portfolio: "Not extracted"
    },
    skillGap: {
      matchPercentage: overall,
      matched: detected.slice(0, 4),
      missing: missing.slice(0, 2),
      recommended: ["AWS", "Docker"]
    },
    rawExtractedText: text // Pass this along for debugging if needed
  };
}
