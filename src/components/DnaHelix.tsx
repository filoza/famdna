type DnaHelixProps = {
  className?: string;
};

/**
 * A single, sparse double-helix line graphic — two smooth intertwining
 * strands with a handful of connecting rungs. Deliberately not tiled:
 * meant to read as one premium vector illustration, not a busy pattern.
 */
export default function DnaHelix({ className }: DnaHelixProps) {
  return (
    <svg
      viewBox="0 0 320 900"
      preserveAspectRatio="xMidYMid meet"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="dna-helix-gradient" x1="0" y1="0" x2="0" y2="900" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ff9d2e" />
          <stop offset="100%" stopColor="#2fe6d1" />
        </linearGradient>
      </defs>

      <g stroke="url(#dna-helix-gradient)" strokeOpacity="0.35" strokeWidth="1.5">
        <line x1="90" y1="75" x2="230" y2="75" />
        <line x1="90" y1="225" x2="230" y2="225" />
        <line x1="90" y1="375" x2="230" y2="375" />
        <line x1="90" y1="525" x2="230" y2="525" />
        <line x1="90" y1="675" x2="230" y2="675" />
        <line x1="90" y1="825" x2="230" y2="825" />
      </g>

      <path
        d="M160,0 C160,37.5 230,37.5 230,75 C230,112.5 160,112.5 160,150 C160,187.5 90,187.5 90,225 C90,262.5 160,262.5 160,300 C160,337.5 230,337.5 230,375 C230,412.5 160,412.5 160,450 C160,487.5 90,487.5 90,525 C90,562.5 160,562.5 160,600 C160,637.5 230,637.5 230,675 C230,712.5 160,712.5 160,750 C160,787.5 90,787.5 90,825 C90,862.5 160,862.5 160,900"
        fill="none"
        stroke="url(#dna-helix-gradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M160,0 C160,37.5 90,37.5 90,75 C90,112.5 160,112.5 160,150 C160,187.5 230,187.5 230,225 C230,262.5 160,262.5 160,300 C160,337.5 90,337.5 90,375 C90,412.5 160,412.5 160,450 C160,487.5 230,487.5 230,525 C230,562.5 160,562.5 160,600 C160,637.5 90,637.5 90,675 C90,712.5 160,712.5 160,750 C160,787.5 230,787.5 230,825 C230,862.5 160,862.5 160,900"
        fill="none"
        stroke="url(#dna-helix-gradient)"
        strokeWidth="2.5"
        strokeOpacity="0.65"
        strokeLinecap="round"
      />
    </svg>
  );
}
