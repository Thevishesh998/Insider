export const RESUME_KEYWORD_MAP = [
  { category: "Programming", role: "Full Stack Developer", roleKeywords: ["Full Stack Developer", "MERN Developer", "React Developer", "Backend Developer", "Frontend Developer"], keywords: ["React", "Node.js", "Express", "MongoDB", "JavaScript", "TypeScript", "Next.js", "HTML", "CSS", "Tailwind", "Redux", "Git"] },
  { category: "QA", role: "QA Engineer", roleKeywords: ["QA Engineer", "Software Tester", "Test Engineer", "Automation Engineer"], keywords: ["QA", "Testing", "Automation", "Manual Testing", "Selenium", "Cypress", "JUnit"] },
  { category: "DevOps", role: "DevOps Engineer", roleKeywords: ["DevOps Engineer", "Cloud Engineer", "Site Reliability Engineer"], keywords: ["Docker", "AWS", "Azure", "Linux", "CI/CD", "Jenkins"] },
  { category: "Java", role: "Java Developer", roleKeywords: ["Java Developer", "Spring Boot Developer", "Backend Developer"], keywords: ["Java", "Spring Boot", "Hibernate", "Maven"] },
  { category: "Python", role: "Python Developer", roleKeywords: ["Python Developer", "Django Developer", "Backend Developer"], keywords: ["Python", "Django", "Flask", "FastAPI"] },
  { category: "Management", role: "HR Executive", roleKeywords: ["HR Executive", "Human Resources", "Recruiter", "Talent Acquisition"], keywords: ["HR", "Human Resources", "Recruitment", "Recruiter", "Payroll", "Talent Acquisition"] },
];

const normalize = (value = "") => value.toLowerCase().replace(/\s+/g, " ");
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const includesKeyword = (text, keyword) => {
  const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(normalize(keyword))}(?=$|[^a-z0-9])`, "i");
  return pattern.test(text);
};

export const analyzeResumeText = (resumeText) => {
  const text = normalize(resumeText);
  const skills = [];
  const roleScores = RESUME_KEYWORD_MAP.map((entry) => {
    const matchedSkills = entry.keywords.filter((keyword) => includesKeyword(text, keyword));
    matchedSkills.forEach((skill) => {
      if (!skills.includes(skill)) skills.push(skill);
    });
    return { ...entry, score: matchedSkills.length };
  });

  const primary = roleScores.sort((a, b) => b.score - a.score)[0];
  return {
    skills,
    primaryCategory: primary?.score ? primary.category : "",
    primaryRole: primary?.score ? primary.role : "",
  };
};

export const scoreJobForCandidate = (job, candidate) => {
  const jobText = normalize(`${job.title || ""} ${job.category || ""} ${String(job.description || "").replace(/<[^>]*>/g, " ")}`);
  const category = normalize(candidate.primaryCategory);
  const role = normalize(candidate.primaryRole);
  const manualSkills = candidate.manualSkills || [];
  const skills = manualSkills.length ? manualSkills : (candidate.candidateSkills || []);
  const usingManualSkills = manualSkills.length > 0;
  let score = 0;

  // Explicit candidate choices take precedence over extracted resume text.
  if (category && normalize(job.category) === category) score += usingManualSkills ? 10 : 30;
  const roleEntry = RESUME_KEYWORD_MAP.find((entry) => entry.role === candidate.primaryRole);
  if (role && (roleEntry?.roleKeywords || [role]).some((roleKeyword) => includesKeyword(jobText, roleKeyword))) score += usingManualSkills ? 15 : 40;
  score += skills.filter((skill) => includesKeyword(jobText, skill)).length * (usingManualSkills ? 40 : 20);

  return score;
};
