import { useEffect, useState, useMemo } from 'react';
import { Effect } from 'effect';
import { DataService, DataServiceLive } from '../services/DataService';
import type { SocialPost, SocialPlatform } from '../types';
import { Play, Instagram, Facebook, Youtube, Image, Film, ArrowRight, Share2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cs } from 'date-fns/locale';
import { Share } from '@capacitor/share';
import CachedImage from '../components/CachedImage';
import LoadingState from '../components/LoadingState';

type FilterType = 'all' | SocialPlatform;

export default function Home() {
  const [feed, setFeed] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const handleShare = async (e: React.MouseEvent, post: SocialPost) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const canShare = await Share.canShare();
      if (canShare.value) {
        await Share.share({
          title: post.title,
          text: post.title,
          url: post.url,
          dialogTitle: 'Sdílet novinku'
        });
      } else {
        throw new Error('Share API not available');
      }
    } catch (err) {
      console.log('Falling back to clipboard', err);
      // Fallback for desktop: copy to clipboard
      navigator.clipboard.writeText(post.url);
      alert('Odkaz zkopírován do schránky!');
    }
  };

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

  const filteredFeed = useMemo(() => {
    if (activeFilter === 'all') return feed;
    return feed.filter(post => post.platform === activeFilter);
  }, [feed, activeFilter]);

  if (loading) return <LoadingState message="Načítám feed..." className="py-20" />;

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

  const filters: { value: FilterType; label: string; icon?: React.ReactNode }[] = [
    { value: 'all', label: 'Vše' },
    { value: 'youtube', label: 'YouTube', icon: <Youtube size={14} className="text-[#FF0000]" /> },
    { value: 'instagram', label: 'Instagram', icon: <Instagram size={14} className="text-[#E1306C]" /> },
    { value: 'facebook', label: 'Facebook', icon: <Facebook size={14} className="text-[#1877F2]" /> },
  ];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <section>
        <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-6 flex items-center gap-3">
          <span className="bg-brand w-2 h-8 block skew-x-[-15deg]"></span>
          Novinky
        </h2>

        {/* Filter Bar */}
        <div className="mb-6 flex items-center gap-2 flex-wrap">
          {filters.map(filter => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`
                px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wide
                transition-all duration-300 ease-out
                flex items-center gap-2
                ${activeFilter === filter.value
                  ? 'bg-brand text-brand-contrast shadow-lg shadow-brand/30 scale-105'
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-brand/50 hover:shadow-md hover:scale-102'
                }
              `}
            >
              {filter.icon}
              {filter.label}
            </button>
          ))}
        </div>

        <div className="grid gap-6">
          {filteredFeed.map(post => (
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
                <CachedImage src={post.thumbnail} alt={post.title} className="w-full h-full object-cover opacity-90 transition-transform group-hover:scale-105 duration-700" />
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

                  <button
                    onClick={(e) => handleShare(e, post)}
                    className="ml-auto flex items-center gap-1.5 p-2 rounded-lg text-slate-400 hover:text-brand hover:bg-brand/10 transition-colors"
                  >
                    <Share2 size={16} />
                  </button>

                  <span className="flex items-center gap-1 text-slate-900 group-hover:text-brand transition-colors">
                    Otevřít <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

    </div>
  );
}
