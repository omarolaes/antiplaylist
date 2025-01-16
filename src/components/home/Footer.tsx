import { TbMusicPlus, TbPlaylist, TbMusicBolt } from "react-icons/tb";
import { GiMexico } from "react-icons/gi";

interface FooterProps {
  availableGenres: string[];
  genreSongsCount: number;
}

export default function Footer({ availableGenres, genreSongsCount }: FooterProps) {
  return (
    <div
      className="w-full animate-from-bottom opacity-0"
      style={{ animationDelay: "1.5s" }}
      aria-label="Footer statistics"
    >
      <div className="container mx-auto px-1 flex flex-wrap items-center justify-between gap-3 text-xs leading-loose tracking-wider uppercase">
        {[
          {
            text: "20 NEW GENRES DAILY",
            icon: <TbMusicPlus className="inline-block mr-1" />,
          },
          {
            text: `${availableGenres.length} GENRES+`,
            icon: <TbPlaylist className="inline-block mr-1" />,
          },
          {
            text: `${genreSongsCount} SONGS`,
            icon: <TbMusicBolt className="inline-block mr-1" />,
          },
          {
            text: "Hecho en Mexico",
            icon: <GiMexico className="inline-block mr-1" />,
            href: "https://twitter.com/omarolaes",
          },
        ].map((item, index) => (
          <span
            key={`${item.text}-${index}`}
            className="px-2 text-zinc-950 hover:text-zinc-700 transition-colors"
            role="text"
          >
            {item.icon}
            {item.href ? (
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="align-middle hover:underline"
              >
                {item.text}
              </a>
            ) : (
              <span className="align-middle">{item.text}</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}