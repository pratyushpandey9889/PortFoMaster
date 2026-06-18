export interface WorkExperienceDTO {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  description: string;
}

export interface ProjectDTO {
  id: string;
  title: string;
  description: string;
  techList: string[];
  githubUrl: string | null;
  liveUrl: string | null;
}

export interface EducationDTO {
  id: string;
  degree: string;
  institution: string;
  graduationYear: number;
}

export interface SocialLinkDTO {
  type: "github" | "linkedin" | "twitter" | "email";
  url: string;
}

export interface PortfolioDTO {
  name: string;
  title: string;
  location: string;
  bio: string;
  theme: "minimal" | "dark" | "creative";
  photoUrl: string | null;
  skills: string[];
  experiences: WorkExperienceDTO[];
  projects: ProjectDTO[];
  educations: EducationDTO[];
  socialLinks: SocialLinkDTO[];
}
