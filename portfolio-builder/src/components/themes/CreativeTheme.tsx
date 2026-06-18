/**
 * CreativeTheme — Bold, colorful portfolio layout.
 *
 * Styling:
 *   - Gradient header background (from-indigo-600 to-purple-600)
 *   - White text on the header, dark body below
 *   - Name in text-4xl font-black, title in text-lg text-indigo-200
 *   - Skill chips: gradient from-indigo-500 to-purple-500 with white text
 *   - Project cards with colored left border (border-l-4 border-indigo-500)
 *   - Section headings in indigo/purple
 *
 * This is a pure presentational component — no hooks, no API calls.
 * It receives the full PortfolioDTO and renders each non-empty section.
 */

import type { PortfolioDTO } from "@/src/types/portfolio";

interface CreativeThemeProps {
  portfolio: PortfolioDTO;
}

export default function CreativeTheme({ portfolio }: CreativeThemeProps) {
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
    /* Outer page: white body background */
    <div className="min-h-screen bg-gray-50 font-sans">

      {/* ── 1. Header: gradient background with photo, name, title, location ── */}
      {/* px-4 on mobile, px-6 on sm+ to prevent overflow at 320px */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 sm:px-6 py-12">
        {/* flex-col on mobile, flex-row on sm+ to prevent overflow at 320px */}
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row sm:items-center items-start gap-6">
          {/* Profile photo (only shown if present) */}
          {hasPhoto && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={portfolio.photoUrl!}
              alt={portfolio.name || "Profile photo"}
              className="h-28 w-28 rounded-full object-cover flex-shrink-0 border-4 border-white/30"
            />
          )}
          <div>
            {hasName && (
              /* Bold, large name on the gradient */
              <h1 className="text-4xl font-black text-white">
                {portfolio.name}
              </h1>
            )}
            {hasTitle && (
              /* Soft indigo-200 for the title so it stands out on the gradient */
              <p className="text-lg text-indigo-200 mt-1">{portfolio.title}</p>
            )}
            {hasLocation && (
              <p className="text-sm text-indigo-300 mt-1">{portfolio.location}</p>
            )}
          </div>
        </div>
      </header>

      {/* ── Body content ────────────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-10">

        {/* ── 2. Bio ────────────────────────────────────────────────────────── */}
        {hasBio && (
          <section>
            {/* Section heading in indigo/purple */}
            <h2 className="text-lg font-bold text-indigo-600 mb-3">About</h2>
            <p className="text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
              {portfolio.bio}
            </p>
          </section>
        )}

        {/* ── 3. Skills ───────────────────────────────────────────────────── */}
        {hasSkills && (
          <section>
            <h2 className="text-lg font-bold text-indigo-600 mb-3">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {portfolio.skills.map((skill) => (
                /* Gradient chip with white text */
                <span
                  key={skill}
                  className="inline-block rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-1 text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* ── 4. Work Experience ────────────────────────────────────────────── */}
        {hasExperiences && (
          <section>
            <h2 className="text-lg font-bold text-indigo-600 mb-3">
              Work Experience
            </h2>
            <div className="space-y-6">
              {portfolio.experiences.map((exp) => (
                <div key={exp.id} className="border-l-4 border-indigo-400 pl-4">
                  <p className="text-base font-semibold text-gray-900">
                    {exp.role}
                  </p>
                  <p className="text-sm text-purple-600 font-medium mt-0.5">
                    {exp.company}
                  </p>
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

        {/* ── 5. Projects ───────────────────────────────────────────────────── */}
        {hasProjects && (
          <section>
            <h2 className="text-lg font-bold text-indigo-600 mb-3">Projects</h2>
            <div className="space-y-4">
              {portfolio.projects.map((project) => (
                /* Card with a colored left border for the creative style */
                <div
                  key={project.id}
                  className="border-l-4 border-indigo-500 bg-white rounded-r-lg shadow-sm p-4"
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
                          className="text-xs bg-indigo-50 text-indigo-700 rounded px-2 py-0.5 border border-indigo-100"
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
                        className="text-xs text-indigo-600 hover:text-purple-600 hover:underline font-medium"
                      >
                        GitHub ↗
                      </a>
                    )}
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-600 hover:text-purple-600 hover:underline font-medium"
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

        {/* ── 6. Education ──────────────────────────────────────────────────── */}
        {hasEducations && (
          <section>
            <h2 className="text-lg font-bold text-indigo-600 mb-3">Education</h2>
            <div className="space-y-4">
              {portfolio.educations.map((edu) => (
                <div key={edu.id}>
                  <p className="text-base font-semibold text-gray-900">
                    {edu.degree}
                  </p>
                  <p className="text-sm text-purple-600 font-medium">
                    {edu.institution}
                  </p>
                  <p className="text-xs text-gray-400">
                    Graduated {edu.graduationYear}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── 7. Social Links ───────────────────────────────────────────────── */}
        {hasSocialLinks && (
          <section>
            <h2 className="text-lg font-bold text-indigo-600 mb-3">Connect</h2>
            <div className="flex flex-wrap gap-3">
              {portfolio.socialLinks.map((link) => (
                /* Opens in a new tab per Requirement 14.4 */
                <a
                  key={link.type}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-1 text-sm capitalize font-medium hover:opacity-90 transition-opacity"
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
