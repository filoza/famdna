"use client";

import Reveal from "./Reveal";
import RevealGroup from "./RevealGroup";

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
      <RevealGroup className="mx-auto max-w-6xl px-6">
        <Reveal>
          <p className="font-serif text-xl text-cyan-soft">what we offer</p>
          <h2 className="font-display mt-4 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Active learning, built for every family
          </h2>
        </Reveal>

        <div className="mt-16 border-b border-border">
          {PROGRAMS.map((program, i) => (
            <Reveal key={program.title}>
              <div className="group grid grid-cols-[3rem_1fr] items-start gap-4 border-t border-border py-8 transition-colors sm:grid-cols-[5rem_1fr_1fr] sm:items-center sm:gap-8">
                <span
                  className={`font-display text-xl text-muted transition-colors ${
                    program.accent === "orange"
                      ? "group-hover:text-orange"
                      : "group-hover:text-cyan"
                  }`}
                >
                  0{i + 1}
                </span>
                <h3 className="font-display text-2xl font-medium transition-transform duration-300 group-hover:translate-x-2 sm:text-3xl">
                  {program.title}
                </h3>
                <p className="col-span-2 mt-2 text-muted sm:col-span-1 sm:mt-0 sm:max-w-sm">
                  {program.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </RevealGroup>
    </section>
  );
}
