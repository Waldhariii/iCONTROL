export function coreBaseStyles(): string {
  return `
  <style>
    :root{
      --bg:#0f1112;
      --panel:#1a1d1f;
      --line:#2b3136;
      --text:#e7ecef;
      --muted:#a7b0b7;
      --accent:#6d28d9; /* dark purple title */
      --accent2:#7c3aed;
      --radius:18px;
      --shadow: 0 18px 50px rgba(0,0,0,.45);
      --font: -apple-system,BlinkMacSystemFont,"SF Pro Text","SF Pro Display",Segoe UI,Roboto,Helvetica,Arial,sans-serif;
    }
    *{box-sizing:border-box}
    body{margin:0; font-family:var(--font); color:var(--text)}
    .cxWrap{min-height:100vh; display:flex; align-items:center; justify-content:center; background:radial-gradient(1100px 760px at 18% 0%, #1a1f23 0%, var(--bg) 60%) fixed;}
    .cxCard{width:min(520px,92vw); background:rgba(26,29,31,.92); border:1px solid var(--line); border-radius:var(--radius); box-shadow:var(--shadow); padding:22px;}
    .cxTitle{font-size:22px; font-weight:900; letter-spacing:.3px; color:#e9e0ff;}
    .cxTitle span{color:var(--accent2)}
    .cxMuted{color:var(--muted); margin-top:6px; font-size:13px; line-height:1.35}
    .cxRow{display:flex; gap:12px; align-items:center; justify-content:space-between}
    .cxField{margin-top:14px}
    .cxLabel{display:block; color:var(--muted); font-size:12px; margin-bottom:6px}
    .cxInput{width:100%; padding:12px 12px; border-radius:12px; border:1px solid var(--line); background:#121516; color:var(--text); outline:none}
    .cxInput:focus{border-color:#3a3f46}
    .cxBtn{margin-top:14px; width:100%; padding:12px 14px; border-radius:12px; border:1px solid #3a3f46; background:#171b1d; color:var(--text); cursor:pointer; font-weight:800}
    .cxBtn:hover{background:#1b2022}
    .cxTopRight{position:fixed; top:14px; right:14px; display:flex; gap:10px; align-items:center}
    .cxLang{border:1px solid var(--line); background:#121516; color:var(--text); padding:9px 10px; border-radius:12px}
    .cxLink{color:#cfc6ff; text-decoration:none; font-size:12px}
    .cxLink:hover{text-decoration:underline}
    .cxErr{margin-top:10px; color:#ffb4b4; font-size:12px}
    .cxOk{margin-top:10px; color:#b7f5c2; font-size:12px}
  </style>`;
}
