type MarqueeProps = {
  items: string[];
};

export default function Marquee({ items }: MarqueeProps) {
  const loop = [...items, ...items];

  return (
    <div className="relative overflow-hidden border-y border-border bg-background-alt py-5">
      <div className="flex w-max animate-marquee items-center gap-10">
        {loop.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-10 font-display text-sm tracking-[0.3em] whitespace-nowrap text-muted uppercase"
          >
            {item}
            <span className="text-orange">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
