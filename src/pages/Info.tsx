import { ShoppingBag, Wrench, Camera, Youtube, Instagram, Facebook, Truck, Shield, FileText, Mail, Users, Car } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getAppStats, type AppStats } from '../lib/appStats';
import { useAuth } from '../contexts/AuthContext';

export default function Info() {
  const sections = [
    {
      title: "Autoservis Bez Komprese",
      desc: "Profesionální servis v Klatovech. Pneuservis, diagnostika, tuning. Stavte se za námi v garáži.",
      icon: Wrench,
      link: "https://bezkompreseservis.cz",
      color: "bg-blue-600"
    },
    {
      title: "Bez Komprese Shop",
      desc: "E-shop s vůní benzínu. Podpořte nás nákupem merche nebo profesionálních přípravků Xintex na ošetření vozidla.",
      icon: ShoppingBag,
      link: "https://bezkompreseshop.cz",
      color: "bg-green-600"
    },
    {
      title: "Odtahovka Bez Komprese",
      desc: "Když to nejede, nepanikařte. Vytáhneme vás z bryndy. Rychlý odtah pro Vaše plechové miláčky s lidským přístupem.",
      icon: Truck,
      link: "https://kdyztonejede.cz/",
      color: "bg-orange-600"
    },
    {
      title: "Bez Komprese Media",
      desc: "Foto, video, vývoj aplikací a využití AI v reálném životě. Tvoříme obsah, který má koule.",
      icon: Camera,
      link: "https://bezkompresemedia.cz",
      color: "bg-purple-600"
    }
  ];

  const socials = [
    { name: 'Instagram', icon: Instagram, url: 'https://www.instagram.com/bez_komprese', color: 'hover:text-pink-600' },
    { name: 'Facebook', icon: Facebook, url: 'https://www.facebook.com/bezkomprese/', color: 'hover:text-blue-600' },
    { name: 'YouTube', icon: Youtube, url: 'https://www.youtube.com/channel/UCw7nrQwqRDvG6Q3CSEmcOSw', color: 'hover:text-red-600' },
  ];

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="text-center py-8">
        <h2 className="text-4xl font-black italic text-brand mb-3 uppercase tracking-tighter">BEZ KOMPRESE</h2>
        <p className="text-slate-600 text-lg">Komunita petrolheadů. Děláme to srdcem a s vůní benzínu.</p>

        {/* Stats */}
        <div className="flex justify-center gap-8 mt-6">
          <StatsDisplay />
        </div>
      </div>

      <div className="grid gap-4">
        {sections.map((item) => {
          const Icon = item.icon;
          return (
            <a key={item.title} href={item.link} target="_blank" rel="noopener noreferrer" className="flex items-start gap-4 bg-white p-5 rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 border border-slate-100">
              <div className={`${item.color} text-white p-3 rounded-xl shadow-md`}>
                <Icon size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            </a>
          )
        })}
      </div>

      <div className="grid gap-4 mt-8">
        <a href="/privacy" className="flex items-center gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200 hover:bg-slate-100 transition-all group">
          <div className="bg-slate-200 text-slate-600 p-3 rounded-xl group-hover:bg-slate-300 transition-colors">
            <Shield size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg mb-1 text-slate-800">Ochrana soukromí a GDPR</h3>
            <p className="text-sm text-slate-500">Informace o tom, jak shromažďujeme a chráníme vaše data, včetně polohy.</p>
          </div>
        </a>
        <a href="/tos" className="flex items-center gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200 hover:bg-slate-100 transition-all group">
          <div className="bg-slate-200 text-slate-600 p-3 rounded-xl group-hover:bg-slate-300 transition-colors">
            <FileText size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg mb-1 text-slate-800">Smluvní podmínky</h3>
            <p className="text-sm text-slate-500">Pravidla používání aplikace a vaše povinnosti jako uživatele.</p>
          </div>
        </a>
        <a href="mailto:hello@jakubprosek.cz" className="flex items-center gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200 hover:bg-slate-100 transition-all group">
          <div className="bg-slate-200 text-slate-600 p-3 rounded-xl group-hover:bg-slate-300 transition-colors">
            <Mail size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg mb-1 text-slate-800">Zpětná vazba</h3>
            <p className="text-sm text-slate-500 leading-relaxed">Máte nějakou zpětnou vazbu k aplikaci? Něco Vám nejde nebo máte návrh na zlepšení? Popište to, co nejlépe přímo vývojáři</p>
          </div>
        </a>
      </div>

      <div className="bg-slate-100 p-8 rounded-3xl text-center">
        <h3 className="font-bold mb-4 text-slate-800">Sledujte nás na sítích</h3>
        <div className="flex justify-center gap-4">
          {socials.map(soc => {
            const Icon = soc.icon;
            return (
              <a key={soc.name} href={soc.url} target="_blank" rel="noopener noreferrer" className={`p-4 bg-white rounded-full shadow-sm ${soc.color} transition-colors text-slate-700`}>
                <Icon size={24} />
              </a>
            )
          })}
        </div>
      </div>
    </div>
  );
}

function StatsDisplay() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AppStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    getAppStats()
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [user]);

  if (loading || !stats) return null;

  return (
    <>
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2 text-slate-500 mb-1">
          <Users size={18} />
          <span className="text-xs uppercase font-bold tracking-wider">Uživatelů</span>
        </div>
        <span className="text-2xl font-black text-slate-800">{stats.userCount}</span>
      </div>
      <div className="w-px h-10 bg-slate-200"></div>
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2 text-slate-500 mb-1">
          <Car size={18} />
          <span className="text-xs uppercase font-bold tracking-wider">Vozidel</span>
        </div>
        <span className="text-2xl font-black text-slate-800">{stats.carCount}</span>
      </div>
    </>
  );
}