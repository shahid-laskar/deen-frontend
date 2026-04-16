const fs = require('fs');

let content = fs.readFileSync('src/routes/_authenticated/quran.jsx', 'utf-8');

// Import Heatmap
content = content.replace(
  "import { useStickyState } from '@/hooks/useStickyState'",
  "import CalendarHeatmap from 'react-calendar-heatmap';\nimport 'react-calendar-heatmap/dist/styles.css';\nimport { useStickyState } from '@/hooks/useStickyState'"
);

// Inject Heatmap into StatsTab
content = content.replace(
  "export default function QuranPage() {",
  `function ActivityHeatmap() {
    const today = new Date();
    // Dummy reading history for visual demonstration
    const randomDays = Array.from({length: 40}).map(() => {
        const d = new Date();
        d.setDate(d.getDate() - Math.floor(Math.random() * 120));
        return { date: d.toISOString().split('T')[0], count: Math.floor(Math.random() * 5) + 1 };
    });
    return (
      <Card className="p-5 mt-6 mb-6 overflow-hidden">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Reading Activity Heatmap</h3>
        <div className="w-[150%] md:w-full -ml-[25%] md:ml-0 opacity-80" style={{transform: "scale(1)", transformOrigin: "left center"}}>
          <CalendarHeatmap
            startDate={new Date(today.getFullYear(), today.getMonth() - 4, today.getDate())}
            endDate={today}
            values={randomDays}
            classForValue={(value) => {
              if (!value) return 'color-empty opacity-20 fill-border';
              return \`fill-primary opacity-\${Math.min(100, value.count * 20)}\`;
            }}
          />
        </div>
        <div className="flex justify-between items-center mt-3">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Less</span>
             <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">More</span>
        </div>
      </Card>
    )
  }

export default function QuranPage() {`
);

content = content.replace(
  `{['Memorised',memorised,'text-green-600 bg-green-500/10 border-green-500/20']`,
  `<ActivityHeatmap />\n        {['Memorised',memorised,'text-green-600 bg-green-500/10 border-green-500/20']`
);

// Update Reciter Picker
content = content.replace(
  `{tab==='reader' && !activeSurah && (
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-none border-b border-border mb-6">
            {RECITERS.map(r=><button key={r.id} onClick={()=>audio.setReciterId(r.id)} className={cn("px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border shrink-0", audio.reciterId===r.id ? "bg-primary/5 border-primary/30 text-primary" : "bg-card border-border text-muted-foreground hover:bg-muted")}>{r.name}</button>)}
          </div>
        )}`,
  `{tab==='reader' && !activeSurah && (
          <div className="mb-6 animate-in slide-in-from-top-2">
             <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">Select Reciter Library</label>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {RECITERS.map(r=><button key={r.id} onClick={()=>audio.setReciterId(r.id)} className={cn("px-4 py-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all", audio.reciterId===r.id ? "bg-primary/5 border-primary/40 text-primary shadow-sm" : "bg-card border-border text-muted-foreground hover:bg-muted")}>
                   <Mic className="h-4 w-4 mb-1.5 opacity-60" />
                   <span className="text-xs font-bold leading-tight">{r.name}</span>
                </button>)}
             </div>
          </div>
        )}`
);

fs.writeFileSync('src/routes/_authenticated/quran.jsx', content);
