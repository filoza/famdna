"use client";

import Reveal from "./Reveal";

const PROGRAMS = [
  {
    title: "Obstacle Courses",
    accent: "orange" as const,
    description:
      "Full-body challenge courses that turn STEAM concepts into physical, hands-on adventures for every age group.",
  },
  {
    title: "Packages",
    accent: "cyan" as const,
    description:
      "Flexible event and workshop packages for schools, camps and community groups — scaled to any size crowd.",
  },
  {
    title: "Initiatives",
    accent: "orange" as const,
    description:
      "Community-driven programs designed to expand access to active learning in underserved neighborhoods.",
  },
  {
    title: "Partnerships",
    accent: "cyan" as const,
    description:
      "Collaborations with brands, media and city programs to bring D.N.A.'s game-show format to new audiences.",
  },
];

export default function Programs() {
  return (
    <section id="programs" className="relative bg-background py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <p className="text-xs font-semibold tracking-widest text-cyan-soft uppercase">
            What we offer
          </p>
          <h2 className="font-display mt-4 max-w-2xl text-4xl font-semibold sm:text-5xl">
            Active learning, built for <span className="text-gradient">every family</span>
          </h2>
        </Reveal>

        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          {PROGRAMS.map((program, i) => (
            <Reveal key={program.title} delay={i * 0.1}>
              <div
                className={`group h-full rounded-3xl border border-border bg-background-alt p-8 transition-colors ${
                  program.accent === "orange" ? "hover:border-orange" : "hover:border-cyan"
                }`}
              >
                <div
                  className={`mb-6 flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-semibold ${
                    program.accent === "orange"
                      ? "bg-orange/15 text-orange-soft"
                      : "bg-cyan/15 text-cyan-soft"
                  }`}
                >
                  {program.title.charAt(0)}
                </div>
                <h3 className="font-display text-2xl font-semibold">{program.title}</h3>
                <p className="mt-3 text-muted">{program.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
