/**
 * MinimalTheme — Clean, whitespace-heavy portfolio layout.
 *
 * Styling:
 *   - White background, dark text
 *   - Sans-serif font (Tailwind font-sans)
 *   - Name in text-3xl font-bold, title in text-lg text-gray-500
 *   - Section headers with a thin bottom border
 *   - Skill chips with light gray background
 *   - Clean card borders for projects
 *
 * This is a pure presentational component — no hooks, no API calls.
 * It receives the full PortfolioDTO and renders each non-empty section.
 */

import type { PortfolioDTO } from "@/src/types/portfolio";

interface MinimalThemeProps {
  portfolio: PortfolioDTO;
}

export default function MinimalTheme({ portfolio }: MinimalThemeProps) {
  // ── Determine which sections have data ────────────────────────────────────
  const hasPhoto = Boolean(portfolio.photoUrl);
  const hasName = Boolean(portfolio.name);
  const hasTitle = Boolean(portfolio.title);
  const hasLocation = Boolean(portfolio.location);
  const hasBio = Boolean(portfolio.bio);
  const hasSkills = portfolio.skills.length > 0;
  const hasExperiences = portfolio.experiences.length > 0;
  const hasProjects = portfolio.projects.length > 0;
  const hasEducations = portfolio.educations.length > 0;
  const hasSocialLinks = portfolio.socialLinks.length > 0;

  return (
    /* Outer page: white background, sans-serif font */
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {/* px-4 on mobile, px-6 on sm+ to prevent overflow at 320px */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-10">

        {/* ── 1. Header: Photo, Name, Title, Location ───────────────────── */}
        {/* flex-col on mobile, flex-row on sm+ to prevent overflow at 320px */}
        <header className="flex flex-col sm:flex-row sm:items-center items-start gap-6">
          {/* Profile photo (only shown if present) */}
          {hasPhoto && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={portfolio.photoUrl!}
              alt={portfolio.name || "Profile photo"}
              className="h-24 w-24 rounded-full object-cover flex-shrink-0 border border-gray-200"
            />
          )}
          <div>
            {hasName && (
              <h1 className="text-3xl font-bold text-gray-900">
                {portfolio.name}
              </h1>
            )}
            {hasTitle && (
              <p className="text-lg text-gray-500 mt-0.5">{portfolio.title}</p>
            )}
            {hasLocation && (
              <p className="text-sm text-gray-400 mt-1">{portfolio.location}</p>
            )}
          </div>
        </header>

        {/* ── 2. Bio ──────────────────────────────────────────────────────── */}
        {hasBio && (
          <section>
            {/* Section header: thin bottom border for the minimal look */}
            <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 pb-2 border-b border-gray-200 mb-4">
              About
            </h2>
            <p className="text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
              {portfolio.bio}
            </p>
          </section>
        )}

        {/* ── 3. Skills ───────────────────────────────────────────────────── */}
        {hasSkills && (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 pb-2 border-b border-gray-200 mb-4">
              Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {portfolio.skills.map((skill) => (
                /* Light gray background chip for the minimal style */
                <span
                  key={skill}
                  className="inline-block rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* ── 4. Work Experience ──────────────────────────────────────────── */}
        {hasExperiences && (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 pb-2 border-b border-gray-200 mb-4">
              Work Experience
            </h2>
            <div className="space-y-6">
              {portfolio.experiences.map((exp) => (
                <div key={exp.id}>
                  <p className="text-base font-semibold text-gray-900">
                    {exp.role}
                  </p>
                  <p className="text-sm text-gray-600 mt-0.5">{exp.company}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {exp.startDate} – {exp.isCurrent ? "Present" : (exp.endDate ?? "")}
                  </p>
                  {exp.description && (
                    <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                      {exp.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── 5. Projects ─────────────────────────────────────────────────── */}
        {hasProjects && (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 pb-2 border-b border-gray-200 mb-4">
              Projects
            </h2>
            <div className="space-y-4">
              {portfolio.projects.map((project) => (
                /* Clean card border for the minimal look */
                <div
                  key={project.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <p className="text-base font-semibold text-gray-900">
                    {project.title}
                  </p>
                  {project.description && (
                    <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                      {project.description}
                    </p>
                  )}
                  {/* Tech stack chips */}
                  {project.techList.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {project.techList.map((tech) => (
                        <span
                          key={tech}
                          className="text-xs bg-gray-100 text-gray-600 rounded px-2 py-0.5"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                  {/* GitHub / live demo links */}
                  <div className="flex gap-3 mt-2">
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-gray-500 hover:text-gray-900 hover:underline"
                      >
                        GitHub ↗
                      </a>
                    )}
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-gray-500 hover:text-gray-900 hover:underline"
                      >
                        Live Demo ↗
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── 6. Education ────────────────────────────────────────────────── */}
        {hasEducations && (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 pb-2 border-b border-gray-200 mb-4">
              Education
            </h2>
            <div className="space-y-4">
              {portfolio.educations.map((edu) => (
                <div key={edu.id}>
                  <p className="text-base font-semibold text-gray-900">
                    {edu.degree}
                  </p>
                  <p className="text-sm text-gray-600">{edu.institution}</p>
                  <p className="text-xs text-gray-400">
                    Graduated {edu.graduationYear}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── 7. Social Links ─────────────────────────────────────────────── */}
        {hasSocialLinks && (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 pb-2 border-b border-gray-200 mb-4">
              Connect
            </h2>
            <div className="flex flex-wrap gap-4">
              {portfolio.socialLinks.map((link) => (
                /* Opens in a new tab per Requirement 14.4 */
                <a
                  key={link.type}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm capitalize text-gray-600 hover:text-gray-900 hover:underline"
                >
                  {link.type}
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
