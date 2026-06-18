/**
 * DarkTheme — Dark mode portfolio layout.
 *
 * Styling:
 *   - Dark background (bg-gray-900), light text (text-gray-100)
 *   - Name in text-3xl font-bold text-white, title in text-indigo-400
 *   - Section headers in text-indigo-400 text-xs uppercase tracking-widest
 *   - Skill chips: bg-indigo-900 text-indigo-300 border-indigo-800
 *   - Project cards: bg-gray-800 border-gray-700
 *
 * This is a pure presentational component — no hooks, no API calls.
 * It receives the full PortfolioDTO and renders each non-empty section.
 */

import type { PortfolioDTO } from "@/src/types/portfolio";

interface DarkThemeProps {
  portfolio: PortfolioDTO;
}

export default function DarkTheme({ portfolio }: DarkThemeProps) {
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
    /* Outer page: dark gray background with light text */
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
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
              className="h-24 w-24 rounded-full object-cover flex-shrink-0 border-2 border-indigo-700"
            />
          )}
          <div>
            {hasName && (
              <h1 className="text-3xl font-bold text-white">
                {portfolio.name}
              </h1>
            )}
            {/* Title in indigo accent color */}
            {hasTitle && (
              <p className="text-lg text-indigo-400 mt-0.5">{portfolio.title}</p>
            )}
            {hasLocation && (
              <p className="text-sm text-gray-500 mt-1">{portfolio.location}</p>
            )}
          </div>
        </header>

        {/* ── 2. Bio ──────────────────────────────────────────────────────── */}
        {hasBio && (
          <section>
            {/* Section header: indigo accent, small uppercase tracking */}
            <h2 className="text-indigo-400 text-xs uppercase tracking-widest mb-4 border-b border-gray-700 pb-2">
              About
            </h2>
            <p className="text-base text-gray-300 leading-relaxed whitespace-pre-wrap">
              {portfolio.bio}
            </p>
          </section>
        )}

        {/* ── 3. Skills ───────────────────────────────────────────────────── */}
        {hasSkills && (
          <section>
            <h2 className="text-indigo-400 text-xs uppercase tracking-widest mb-4 border-b border-gray-700 pb-2">
              Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {portfolio.skills.map((skill) => (
                /* Indigo-tinted dark chip */
                <span
                  key={skill}
                  className="inline-block rounded-full bg-indigo-900 text-indigo-300 border border-indigo-800 px-3 py-1 text-sm"
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
            <h2 className="text-indigo-400 text-xs uppercase tracking-widest mb-4 border-b border-gray-700 pb-2">
              Work Experience
            </h2>
            <div className="space-y-6">
              {portfolio.experiences.map((exp) => (
                <div key={exp.id} className="border-l-2 border-indigo-700 pl-4">
                  <p className="text-base font-semibold text-white">
                    {exp.role}
                  </p>
                  <p className="text-sm text-gray-400 mt-0.5">{exp.company}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {exp.startDate} – {exp.isCurrent ? "Present" : (exp.endDate ?? "")}
                  </p>
                  {exp.description && (
                    <p className="text-sm text-gray-300 mt-2 leading-relaxed">
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
            <h2 className="text-indigo-400 text-xs uppercase tracking-widest mb-4 border-b border-gray-700 pb-2">
              Projects
            </h2>
            <div className="space-y-4">
              {portfolio.projects.map((project) => (
                /* Dark card with gray border */
                <div
                  key={project.id}
                  className="bg-gray-800 border border-gray-700 rounded-lg p-4"
                >
                  <p className="text-base font-semibold text-white">
                    {project.title}
                  </p>
                  {project.description && (
                    <p className="text-sm text-gray-300 mt-1 leading-relaxed">
                      {project.description}
                    </p>
                  )}
                  {/* Tech stack chips */}
                  {project.techList.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {project.techList.map((tech) => (
                        <span
                          key={tech}
                          className="text-xs bg-gray-700 text-gray-300 rounded px-2 py-0.5"
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
                        className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline"
                      >
                        GitHub ↗
                      </a>
                    )}
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline"
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
            <h2 className="text-indigo-400 text-xs uppercase tracking-widest mb-4 border-b border-gray-700 pb-2">
              Education
            </h2>
            <div className="space-y-4">
              {portfolio.educations.map((edu) => (
                <div key={edu.id}>
                  <p className="text-base font-semibold text-white">
                    {edu.degree}
                  </p>
                  <p className="text-sm text-gray-400">{edu.institution}</p>
                  <p className="text-xs text-gray-500">
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
            <h2 className="text-indigo-400 text-xs uppercase tracking-widest mb-4 border-b border-gray-700 pb-2">
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
                  className="text-sm capitalize text-indigo-400 hover:text-indigo-300 hover:underline"
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
