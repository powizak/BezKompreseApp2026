import { useEffect, useState } from 'react';
import { Effect } from 'effect';
import { DataService, DataServiceLive } from '../services/DataService';
import type { SocialPost } from '../types';
import { Play, Instagram, Facebook, Youtube, Image, Film, Car, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cs } from 'date-fns/locale';

export default function Home() {
  const [feed, setFeed] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const dataService = Effect.runSync(
      Effect.gen(function* (_) {
        return yield* _(DataService);
      }).pipe(Effect.provide(DataServiceLive))
    );

    Effect.runPromise(dataService.getSocialFeed).then(data => {
      setFeed(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-10 text-center text-slate-500 font-mono">Načítám feed...</div>;

  const getIcon = (platform: string) => {
    switch (platform) {
      case 'youtube': return <Youtube size={16} className="text-[#FF0000]" />; // Official YT Red
      case 'instagram': return <Instagram size={16} className="text-[#E1306C]" />; // Official IG
      case 'facebook': return <Facebook size={16} className="text-[#1877F2]" />; // Official FB
      default: return null;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Play size={14} className="fill-current" />;
      case 'reel': return <Film size={14} />;
      case 'post': return <Image size={14} />;
      case 'story': return <div className="w-3 h-3 rounded-full border-2 border-current" />;
      default: return null;
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <section>
        <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-6 flex items-center gap-3">
          <span className="bg-brand w-2 h-8 block skew-x-[-15deg]"></span>
          Novinky
        </h2>

        <div className="grid gap-6">
          {feed.map(post => (
            <a key={post.id} href={post.url} target="_blank" rel="noopener noreferrer" className="group block bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:shadow-brand/10 transition-all hover:-translate-y-1">

              {/* Header */}
              <div className="px-4 py-3 flex justify-between items-center border-b border-slate-50 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-full shadow-sm border border-slate-100">
                    {getIcon(post.platform)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-900">{post.platform}</span>
                    <span className="text-[10px] font-medium text-slate-500 uppercase">
                      {formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true, locale: cs })}
                    </span>
                  </div>
                </div>
                <div className="text-xs font-bold bg-white border border-slate-200 px-3 py-1 rounded-full text-slate-700 flex items-center gap-1.5 uppercase tracking-wide">
                  {getTypeIcon(post.type)}
                  {post.type}
                </div>
              </div>

              {/* Media */}
              <div className="relative aspect-video bg-slate-900 overflow-hidden">
                <img src={post.thumbnail} alt={post.title} className="w-full h-full object-cover opacity-90 transition-transform group-hover:scale-105 duration-700" />
                {['video', 'reel'].includes(post.type) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                    <div className="bg-brand p-4 rounded-full shadow-lg shadow-black/20 group-hover:scale-110 transition-transform text-brand-contrast">
                      <Play size={24} className="fill-current ml-1" />
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-5">
                <h3 className="font-bold text-lg leading-snug text-slate-900 mb-3 line-clamp-2 group-hover:text-brand transition-colors">{post.title}</h3>
                <div className="flex items-center gap-4 text-xs text-slate-500 font-bold uppercase tracking-wide">
                  {post.views && <span>{post.views.toLocaleString()} zhlédnutí</span>}
                  {post.likes && <span>{post.likes.toLocaleString()} likes</span>}
                  <span className="ml-auto flex items-center gap-1 text-slate-900 group-hover:text-brand transition-colors">
                    Otevřít <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="bg-[#111111] p-8 rounded-2xl text-white shadow-2xl relative overflow-hidden group">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex-1">
            <h3 className="font-black text-2xl mb-2 text-brand uppercase italic tracking-wide">Podpořte nás</h3>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Líbí se vám naše tvorba? Kupte si něco pěkného v e-shopu nebo se staňte členem a podpořte vznik dalších videí.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <a href="https://bezkompreseshop.cz" target="_blank" rel="noopener noreferrer" className="bg-brand text-brand-contrast font-black uppercase tracking-wider py-3 px-6 rounded-xl hover:bg-white hover:text-black transition-colors shadow-[0_0_20px_rgba(255,214,0,0.2)] text-center text-sm">
              E-shop
            </a>
            <a href="https://www.youtube.com/channel/UCw7nrQwqRDvG6Q3CSEmcOSw/join" target="_blank" rel="noopener noreferrer" className="bg-[#FF0000] text-white font-black uppercase tracking-wider py-3 px-6 rounded-xl hover:bg-white hover:text-[#FF0000] transition-colors shadow-lg shadow-black/20 text-center text-sm flex items-center justify-center gap-2">
              <Youtube size={18} className="fill-current" /> Členství
            </a>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -right-12 -bottom-12 opacity-5 rotate-12 group-hover:opacity-10 transition-opacity duration-500">
          <Car size={250} />
        </div>
        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-brand/10 to-transparent"></div>
      </section>
    </div>
  );
}
