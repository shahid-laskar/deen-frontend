const fs = require('fs');

let content = fs.readFileSync('src/routes/_authenticated/quran.jsx', 'utf-8');

// remove import
content = content.replace("import { parse as parseTajweed } from 'quran-tajweed'", "");

// fix AyahRow tajweedHtml
content = content.replace(
  `let tajweedHtml = arabicText;
  if (showTajweed) {
     try { tajweedHtml = parseTajweed(arabicText) } catch(e) {}
  }`,
  `let tajweedHtml = v.text_tajweed || arabicText;`
);

// fix word tajweed
content = content.replace(
  `{showTajweed 
                      ? <span className="font-amiri text-2xl text-foreground" dangerouslySetInnerHTML={{ __html: (() => { try { return parseTajweed(w.text_uthmani || w.text); } catch(e) { return w.text_uthmani || w.text; } })() }} />
                      : <span className="font-amiri text-2xl text-foreground">{w.text_uthmani || w.text}</span>
                    }`,
  `{showTajweed && w.text_tajweed
                      ? <span className="font-amiri text-2xl text-foreground" dangerouslySetInnerHTML={{ __html: w.text_tajweed }} />
                      : <span className="font-amiri text-2xl text-foreground">{w.text_uthmani || w.text}</span>
                    }`
);

fs.writeFileSync('src/routes/_authenticated/quran.jsx', content);
