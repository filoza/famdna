const SOCIALS = ["Vimeo", "YouTube", "Instagram", "LinkedIn"];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background-alt">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <span className="font-display text-2xl font-semibold">
              <span className="text-orange">D.</span>
              <span className="text-cyan">N.A.</span>
            </span>
            <p className="mt-2 max-w-xs text-sm text-muted">
              Discovering New Adventures — where curiosity meets motion.
            </p>
          </div>

          <div className="flex flex-wrap gap-6">
            {SOCIALS.map((social) => (
              <a
                key={social}
                href="#"
                className="text-sm text-muted transition-colors hover:text-cyan-soft"
              >
                {social}
              </a>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-border pt-8 text-xs text-muted md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} D.N.A. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground">
              Terms and Conditions
            </a>
            <a href="#" className="hover:text-foreground">
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
