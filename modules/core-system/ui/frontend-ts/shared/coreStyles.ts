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
      /* ICONTROL_DESIGN_TOKENS_V1 */
      --bg-app:var(--bg);
      --bg-panel:var(--panel);
      --bg-card:#161a1d;
      --border:var(--line);
      --radius-lg:16px;
      --radius-md:12px;
      --radius-sm:8px;
      --text-primary:var(--text);
      --text-secondary:#c9d0d6;
      --text-muted:var(--muted);
      --accent-primary:var(--accent);
      --accent-secondary:var(--accent2);
      --success:#4ec9b0;
      --warn:#f59e0b;
      --error:#f48771;
      /* ICONTROL_VAR_ALIAS_V1: Alias pour compatibilité UI primitives */
      --ic-bg: var(--bg-app);
      --ic-panel: var(--bg-panel);
      --ic-card: var(--bg-card);
      --ic-border: var(--border);
      --ic-text: var(--text-primary);
      --ic-mutedText: var(--text-muted);
      --ic-accent: var(--accent-primary);
      --ic-accent2: var(--accent-secondary);
      --ic-success: var(--success);
      --ic-warn: var(--warn);
      --ic-error: var(--error);
      --ic-radius-lg: var(--radius-lg);
      --ic-radius-md: var(--radius-md);
      --ic-radius-sm: var(--radius-sm);
    }
    *{box-sizing:border-box; max-width:100%}
    html, body{overflow-x:hidden; width:100%; max-width:100vw; margin:0; padding:0}
    body{font-family:var(--font); color:var(--text)}
    img, video, iframe, table{max-width:100%; height:auto}
    [style*="grid-template-columns"]{width:100%; max-width:100%}
    .cxWrap{min-height:100vh; display:flex; align-items:center; justify-content:center; background:radial-gradient(1100px 760px at 18% 0%, #1a1f23 0%, var(--bg) 60%) fixed; width:100%; max-width:100vw; overflow-x:hidden; min-width:0; box-sizing:border-box;}
    .cxCard{width:100%; max-width:100%; background:rgba(26,29,31,.92); border:1px solid var(--line); border-radius:var(--radius); box-shadow:var(--shadow); padding:22px; overflow-x:hidden;}
    .cxTitle{font-size:22px; font-weight:900; letter-spacing:.3px; color:#e9e0ff;}
    .cxTitle span{color:var(--accent2)}
    .cxMuted{color:var(--muted); margin-top:6px; font-size:13px; line-height:1.35}
    .cxRow{display:flex; gap:12px; align-items:center; justify-content:space-between}
    .cxField{margin-top:18px}
    .cxLabel{display:block; color:var(--muted); font-size:12px; margin-bottom:8px}
    .cxInput{width:100%; padding:12px 12px; border-radius:12px; border:1px solid var(--line); background:#121516; color:var(--text); outline:none}
    .cxInput:focus{border-color:#3a3f46}
    .cxBtn{margin-top:18px; width:100%; padding:12px 14px; border-radius:12px; border:1px solid #3a3f46; background:#171b1d; color:var(--text); cursor:pointer; font-weight:800}
    .cxBtn:hover{background:#1b2022}
    /* ICONTROL_SPACING_V1: Espacement amélioré pour lisibilité */
    .cxCard > * + * {margin-top:20px}
    .cxSection{margin-top:32px; padding-top:24px; border-top:1px solid var(--line)}
    .cxTopRight{position:fixed; top:14px; right:14px; display:flex; gap:10px; align-items:center}
    .cxLang{border:1px solid var(--line); background:#121516; color:var(--text); padding:9px 10px; border-radius:12px}
    .cxLink{color:#cfc6ff; text-decoration:none; font-size:12px}
    .cxLink:hover{text-decoration:underline}
    .cxErr{margin-top:10px; color:#ffb4b4; font-size:12px}
    .cxOk{margin-top:10px; color:#b7f5c2; font-size:12px}
  </style>`;
}
