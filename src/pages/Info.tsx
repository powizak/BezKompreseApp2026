import { ShoppingBag, Wrench, Camera, Youtube, Instagram, Facebook } from 'lucide-react';

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

      <footer className="text-center text-xs text-slate-400 py-4">
        &copy; {new Date().getFullYear()} Bez Komprese Fan App. Not affiliated officially.
      </footer>
    </div>
  );
}