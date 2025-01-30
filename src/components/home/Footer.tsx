import Link from 'next/link';
import { FaGithub, FaTwitter } from 'react-icons/fa';
import { IoLogoGithub } from 'react-icons/io';
import { TbX } from 'react-icons/tb';
import { TfiGithub } from 'react-icons/tfi';

export interface FooterProps {
  availableGenres?: { name: string; slug: string }[];
}

const QUICK_LINKS = [
  { href: '/discover', label: 'Discover' },
  { href: '/about', label: 'About' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
];

const SOCIAL_LINKS = [
  { href: 'https://twitter.com/omarolaes', icon: TbX, label: 'Twitter' },
  { href: 'https://github.com/omarolaes/antiplaylist', icon: IoLogoGithub, label: 'GitHub' },
];

export default function Footer({ availableGenres = [] }: FooterProps) {
  return (
    <footer className="mt-auto relative z-20">
      <div className="bg-zinc-900/80 backdrop-blur-xl border-t border-white/5">
        <div className="max-w-[1800px] mx-auto px-4 md:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between gap-6">
            {/* Brand and Social */}
            <div className="flex flex-col gap-4 md:w-1/3">
              <div className="flex items-center justify-between gap-8">
                <h2 className="text-lg font-bold text-white tracking-tight">AntiPlaylist</h2>
              <p className="text-white/60 text-xs leading-relaxed min-w-max">
                Redefining music discovery through genre exploration.
              </p>
                <div className="flex gap-2">
                  {SOCIAL_LINKS.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-full hover:bg-white/5 text-white/60 hover:text-white transition-all"
                    >
                      <link.icon className="w-4 h-4" />
                      <span className="sr-only">{link.label}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="flex gap-8 md:gap-12">
                {/* Quick Links */}
                <div className="flex gap-8">
                  {QUICK_LINKS.map((link) => (
                    <div key={link.href}>
                      <Link
                        href={link.href}
                        className="text-white/60 hover:text-white text-xs transition-colors inline-block py-1"
                      >
                        {link.label}
                      </Link>
                    </div>
                  ))}
              </div>

              {/* Genres */}
              {availableGenres.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-white mb-2">Top Genres</h3>
                  <ul className="space-y-1">
                    {availableGenres.slice(0, 4).map((genre) => (
                      <li key={genre.slug}>
                        <Link
                          href={`/genre/${genre.slug}`}
                          className="text-white/60 hover:text-white text-xs transition-colors inline-block py-1"
                        >
                          {genre.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}