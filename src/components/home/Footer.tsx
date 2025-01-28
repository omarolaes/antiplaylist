import Link from 'next/link';

export interface FooterProps {
  availableGenres?: { name: string; slug: string }[];
}

const QUICK_LINKS = [
  { href: '/about', label: 'About Us' },
  { href: '/privacy', label: 'Privacy Policy' },
];

export default function Footer({ availableGenres = [] }: FooterProps) {
  return (
    <footer className="bg-zinc-950/50 backdrop-blur-lg border-t border-white/5">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <h3 className="text-white font-semibold text-sm">About AntiPlaylist</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              An experimental radio platform redefining music discovery through genre exploration and sonic education.
            </p>
          </div>

          {availableGenres.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-white font-semibold text-sm">Popular Genres</h3>
              <ul className="space-y-1.5">
                {availableGenres.slice(0, 3).map((genre) => (
                  <li key={genre.slug}>
                    <Link
                      href={`/genre/${genre.slug}`}
                      className="text-zinc-400 hover:text-white text-sm transition-colors"
                    >
                      {genre.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-white font-semibold text-sm">Quick Links</h3>
            <ul className="space-y-1.5">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-zinc-400 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-white/5">
          <p className="text-zinc-400 text-xs text-center">
            © {new Date().getFullYear()} AntiPlaylist. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}