(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))i(r);new MutationObserver(r=>{for(const o of r)if(o.type==="childList")for(const a of o.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&i(a)}).observe(document,{childList:!0,subtree:!0});function n(r){const o={};return r.integrity&&(o.integrity=r.integrity),r.referrerPolicy&&(o.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?o.credentials="include":r.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function i(r){if(r.ep)return;r.ep=!0;const o=n(r);fetch(r.href,o)}})();const A={BASE_URL:"/",DEV:!1,MODE:"production",PROD:!0,SSR:!1},m="icontrol_brand_v1",b={APP_DISPLAY_NAME:"iCONTROL",APP_SHORT_NAME:"iCONTROL",LEGAL_NAME:"iCONTROL",TENANT_ID:"icontrol-default",TITLE_SUFFIX:"",THEME_MODE:"dark",ACCENT_COLOR:"#6D28D9",LOGO_PRIMARY:"",LOGO_COMPACT:""};function O(){try{const e=localStorage.getItem(m);return e?JSON.parse(e):null}catch{return null}}function P(){const e=typeof import.meta<"u"&&A?A:{},t=n=>typeof e[n]=="string"?e[n]:"";return{APP_DISPLAY_NAME:t("VITE_APP_DISPLAY_NAME"),APP_SHORT_NAME:t("VITE_APP_SHORT_NAME"),LEGAL_NAME:t("VITE_LEGAL_NAME"),TENANT_ID:t("VITE_TENANT_ID"),TITLE_SUFFIX:t("VITE_TITLE_SUFFIX"),THEME_MODE:t("VITE_THEME_MODE"),ACCENT_COLOR:t("VITE_ACCENT_COLOR"),LOGO_PRIMARY:t("VITE_LOGO_PRIMARY"),LOGO_COMPACT:t("VITE_LOGO_COMPACT")}}function y(e,t){const n={...e||{}};for(const i of Object.keys(t||{})){const r=t[i];typeof r=="string"&&r.trim()===""||r!=null&&(n[i]=r)}return n}function E(e){const t=[],n=l=>typeof l=="string"?l.trim():"",i=n(e.APP_DISPLAY_NAME),r=n(e.TENANT_ID),o=n(e.THEME_MODE),a=n(e.ACCENT_COLOR);i||t.push("ERR_BRAND_INVALID: APP_DISPLAY_NAME missing/empty"),(!r||!/^[a-z0-9][a-z0-9\\-]+$/.test(r))&&t.push("ERR_BRAND_INVALID: TENANT_ID invalid"),["dark","light","auto"].includes(o)||t.push("ERR_BRAND_INVALID: THEME_MODE invalid"),/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(a)||t.push("ERR_BRAND_INVALID: ACCENT_COLOR invalid");const d={APP_DISPLAY_NAME:i||"iCONTROL",APP_SHORT_NAME:n(e.APP_SHORT_NAME)||"iCONTROL",LEGAL_NAME:n(e.LEGAL_NAME)||i||"iCONTROL",TENANT_ID:r||"icontrol-default",TITLE_SUFFIX:n(e.TITLE_SUFFIX)||"",THEME_MODE:["dark","light","auto"].includes(o)?o:"dark",ACCENT_COLOR:a||"#6D28D9",LOGO_PRIMARY:n(e.LOGO_PRIMARY)||"",LOGO_COMPACT:n(e.LOGO_COMPACT)||""};return t.length?{ok:!1,warnings:t}:{ok:!0,value:d,warnings:[]}}function _(){const e=[],t=O();if(t){const o=E(t);if(o.ok)return{brand:o.value,source:"override",warnings:e};e.push(...o.warnings)}const n=P(),i=y(b,n),r=E(i);return r.ok?{brand:r.value,source:"env",warnings:e}:(e.push(...r.warnings),{brand:b,source:"fallback",warnings:e})}function D(e){const t=O()||{},n=y(t,e),i=E(y(b,n));if(!i.ok)return{ok:!1,warnings:i.warnings};try{return localStorage.setItem(m,JSON.stringify(n)),{ok:!0}}catch(r){return{ok:!1,warnings:["ERR_BRAND_WRITE_FAILED: "+String(r)]}}}function M(){try{localStorage.removeItem(m)}catch{}}const h="icontrol_session_v1";function g(){try{const e=localStorage.getItem(h);if(!e)return null;const t=JSON.parse(e);return!t||typeof t.username!="string"||typeof t.role!="string"?null:t}catch{return null}}function w(e){try{return localStorage.setItem(h,JSON.stringify(e)),!0}catch{return!1}}function C(){try{localStorage.removeItem(h)}catch{}}function T(){return!!g()}const k={sysadmin:{password:"sysadmin",role:"SYSADMIN"},developer:{password:"developer",role:"DEVELOPER"},admin:{password:"admin",role:"ADMIN"},Waldhari:{password:"Dany123456@",role:"DEVELOPER"}};function B(e,t){const n=(e||"").trim(),i=(t||"").toString();if(!n||!i)return{ok:!1,error:"Identifiants requis."};const r=k[n];if(!r||r.password!==i)return{ok:!1,error:"Identifiant invalide."};const o={username:n,role:r.role,issuedAt:Date.now()};return w(o),{ok:!0,session:o}}function F(){C()}function H(){try{const e=g(),t=String(e?.role||"USER").toUpperCase();return t==="ADMIN"||t==="SYSADMIN"||t==="DEVELOPER"?t:"USER"}catch{return"USER"}}function I(){const e=H();return e==="ADMIN"||e==="SYSADMIN"||e==="DEVELOPER"}function L(){return I()}function U(){return window.location.hash||"#/login"}function S(e){const t=U();e.querySelectorAll("a[data-hash]").forEach(n=>{const i=n.getAttribute("data-hash")||"";i&&t.startsWith(i)?n.classList.add("active"):n.classList.remove("active")})}function V(e){const t=document.createElement("div"),n=document.createElement("div");n.className="cxHeader",n.innerHTML=`
    <div class="cxBrand">
      <div class="cxBrandDot"></div>
      <div id="cxBrandTitle">iCONTROL</div>
    </div>
    <button class="cxBurger" id="cxBurger" aria-label="Menu">
      ☰
    </button>
  `;const i=document.createElement("div");i.className="cxDrawerOverlay",i.id="cxDrawerOverlay";const r=document.createElement("div");r.className="cxDrawer",r.id="cxDrawer",r.innerHTML=`
    <div class="cxDrawerTop">
      <div class="cxDrawerTitle">MENU</div>
      <button class="cxClose" id="cxClose" aria-label="Fermer">X</button>
    </div>
    <div class="cxNav" id="cxNav"></div>
    <div style="margin-top:14px; border-top:1px solid var(--line); padding-top:12px;">
      <a href="#/login" id="cxLogoutLink" style="display:none;">Déconnexion</a>
      <small id="cxSessionHint"></small>
    </div>
  `;const o=document.createElement("div");o.className="cxMain",o.id="cxMain",t.appendChild(n),t.appendChild(i),t.appendChild(r),t.appendChild(o);const a=r.querySelector("#cxNav");function d(){a.innerHTML="",e.forEach(u=>{if(!u.show())return;const p=document.createElement("a");p.href=u.hash,p.setAttribute("data-hash",u.hash),p.textContent=u.label,a.appendChild(p)});const c=r.querySelector("#cxLogoutLink"),f=r.querySelector("#cxSessionHint");if(T()){c.style.display="inline-block",c.onclick=p=>{p.preventDefault(),F(),window.location.hash="#/login",s()};const u=g();f.textContent=`Connecté: ${String(u?.username||"user")} • Rôle: ${String(u?.role||"USER")}`}else c.style.display="none",f.textContent="Non connecté";S(r)}function l(){i.classList.add("open"),r.classList.add("open"),d()}function s(){i.classList.remove("open"),r.classList.remove("open")}return n.querySelector("#cxBurger").onclick=l,r.querySelector("#cxClose").onclick=s,i.onclick=s,window.addEventListener("hashchange",()=>{d(),S(r)}),{root:t,main:o,setBrandTitle(c){const f=n.querySelector("#cxBrandTitle");f&&(f.textContent=c||"iCONTROL")},closeDrawer:s,rerenderNav:d}}function Y(){return[{id:"dashboard",label:"Dashboard",hash:"#/dashboard",show:()=>!0},{id:"settings",label:"Paramètres",hash:"#/settings",show:()=>I()}]}function R(){const t=((location.hash||"").replace(/^#\/?/,"").split("?")[0]||"").trim();return!t||t==="login"?"login":t==="dashboard"?"dashboard":t==="settings"?L()?"settings":"dashboard":t==="settings/branding"?L()?"settings_branding":"dashboard":"notfound"}function x(e){e.startsWith("#/")?location.hash=e:location.hash="#/"+e.replace(/^#\/?/,"")}function q(){return R()==="login"||T()?!0:(x("#/login"),!1)}function G(){const e=g();return e?`${e.username} (${e.role})`:"Invité"}function X(e){const t=()=>{q()&&e(R())};window.addEventListener("hashchange",t),t()}function $(){return window.__ICONTROL_MOUNT__||document.getElementById("app")||document.body}function W(e){e.innerHTML=`
    <div style="max-width:520px;margin:40px auto;padding:18px;border-radius:18px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06)">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
        <div style="font-size:20px;font-weight:900">Connexion</div>
        <div style="display:flex;align-items:center;gap:10px">
          <select id="lang" style="background:transparent;color:inherit;border:1px solid rgba(255,255,255,0.15);padding:6px 10px;border-radius:10px">
            <option value="fr">FR</option>
            <option value="en">EN</option>
          </select>
          <a href="#/login" id="forgot" style="color:inherit;opacity:.8;text-decoration:underline">Mot de passe oublié</a>
        </div>
      </div>

      <div style="margin-top:14px;opacity:.8">Entrez vos identifiants.</div>

      <div style="margin-top:14px;display:flex;flex-direction:column;gap:10px">
        <input id="u" placeholder="Nom d’utilisateur" style="padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,0.12);background:rgba(0,0,0,0.25);color:inherit" />
        <input id="p" type="password" placeholder="Mot de passe" style="padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,0.12);background:rgba(0,0,0,0.25);color:inherit" />
        <div id="err" style="min-height:18px;color:#ff6b6b"></div>
        <button id="btn" style="padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,0.15);background:rgba(183,217,75,0.15);color:inherit;font-weight:800;cursor:pointer">Se connecter</button>
      </div>
    </div>
  `;const t=e.querySelector("#u"),n=e.querySelector("#p"),i=e.querySelector("#err"),r=e.querySelector("#btn"),o=()=>{i.textContent="";const a=B(t.value,n.value);if(!a.ok){i.textContent=a.error;return}x("#/dashboard")};r.onclick=o,n.addEventListener("keydown",a=>{a.key==="Enter"&&o()})}function z(e){e.innerHTML=`
    <div style="max-width:980px;margin:26px auto;padding:0 16px">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
        <div style="font-size:22px;font-weight:900">Dashboard</div>
        <div style="opacity:.8">${G()}</div>
      </div>

      <div style="margin-top:14px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px">
        <div style="padding:14px;border-radius:18px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06)">
          <div style="font-weight:900">Santé PME</div>
          <div style="opacity:.8;margin-top:6px">Widget (placeholder)</div>
        </div>
        <div style="padding:14px;border-radius:18px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06)">
          <div style="font-weight:900">Raccourcis</div>
          <div style="opacity:.8;margin-top:6px">Widget (placeholder)</div>
        </div>
        <div style="padding:14px;border-radius:18px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06)">
          <div style="font-weight:900">Alertes</div>
          <div style="opacity:.8;margin-top:6px">Widget (placeholder)</div>
        </div>
      </div>
    </div>
  `}function j(){return g()?.role||"USER"}function J(){const e=j();return e==="SYSADMIN"||e==="DEVELOPER"}function K(e){if(!e)return;const t=J();if(e.innerHTML=`
    <div style="max-width:980px;margin:26px auto;padding:0 16px">
      <div style="font-size:22px;font-weight:900">Parametres</div>
      <div style="opacity:.8;margin-top:8px">Configuration du systeme.</div>

      <div style="margin-top:16px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px">
        <div style="padding:14px;border-radius:18px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06)">
          <div style="font-weight:900">Compte</div>
          <div style="opacity:.8;margin-top:6px">Preferences et securite.</div>
        </div>
        <div style="padding:14px;border-radius:18px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06)">
          <div style="font-weight:900">Systeme</div>
          <div style="opacity:.8;margin-top:6px">Diagnostics et maintenance.</div>
        </div>
      </div>

      ${t?`
      <div style="margin-top:16px;padding:14px;border-radius:18px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06)">
        <div style="font-weight:900">Identite & Marque</div>
        <div style="opacity:.8;margin-top:6px">Nom, logo, et presentation.</div>
        <button id="go_branding" style="margin-top:10px;padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,0.15);background:transparent;color:inherit;cursor:pointer">Branding</button>
      </div>
      `:""}
    </div>
  `,t){const n=e.querySelector("#go_branding");n&&(n.onclick=()=>x("#/settings/branding"))}}function Q(){return g()?.role||"USER"}function Z(){const e=Q();return e==="SYSADMIN"||e==="DEVELOPER"}function ee(e){return e.replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t]||t)}function N(){try{const t=_().brand,n=t.TITLE_SUFFIX&&t.TITLE_SUFFIX.trim()?" "+t.TITLE_SUFFIX.trim():"";document.title=(t.APP_DISPLAY_NAME||"iCONTROL")+n}catch{}}function te(e){if(!e)return;if(!Z()){x("#/dashboard"),e.innerHTML=`
      <div style="max-width:980px;margin:26px auto;padding:0 16px">
        <div style="font-size:22px;font-weight:900">Parametres — Branding</div>
        <div style="opacity:.8;margin-top:8px">Acces refuse (SYSADMIN/DEVELOPER requis).</div>
      </div>
    `;return}const n=_().brand.APP_DISPLAY_NAME||"iCONTROL";e.innerHTML=`
    <div style="max-width:980px;margin:26px auto;padding:0 16px">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="font-size:22px;font-weight:900">Parametres — Branding</div>
        <a id="back_settings" href="#/settings" style="opacity:.8;text-decoration:underline">Retour parametres</a>
      </div>
      <div style="opacity:.8;margin-top:8px">Changer le nom affiche sans toucher au code (localStorage).</div>

      <div style="margin-top:16px;max-width:520px;display:flex;flex-direction:column;gap:10px">
        <label style="opacity:.8">Nom de l'application</label>
        <input id="brand_app_name" value="${ee(n)}" placeholder="Ex: Innovex Control"
          style="padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,0.12);background:rgba(0,0,0,0.25);color:inherit" />

        <div style="display:flex;gap:10px;margin-top:8px;flex-wrap:wrap">
          <button id="brand_save" style="padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,0.15);background:rgba(183,217,75,0.15);color:inherit;font-weight:800;cursor:pointer">Sauvegarder</button>
          <button id="brand_reset" style="padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,0.15);background:transparent;color:inherit;cursor:pointer">Reset</button>
        </div>

        <div id="brand_status" style="opacity:.8;margin-top:8px"></div>
      </div>
    </div>
  `;const i=e.querySelector("#brand_app_name"),r=e.querySelector("#brand_status"),o=e.querySelector("#brand_save"),a=e.querySelector("#brand_reset"),d=s=>{r&&(r.textContent=s)};o&&(o.onclick=()=>{const s=(i?.value||"").trim();if(!s){d("Nom invalide.");return}const c=D({APP_DISPLAY_NAME:s,APP_SHORT_NAME:s});c.ok?(N(),d("Sauvegarde reussie.")):d("Erreur: "+(c.warnings||[]).join(", "))}),a&&(a.onclick=()=>{M();const s=_();i&&(i.value=s.brand.APP_DISPLAY_NAME||"iCONTROL"),N(),d("Reset applique.")});const l=e.querySelector("#back_settings");l&&(l.onclick=s=>{s.preventDefault(),x("#/settings")})}function ne(e,t){if(e==="login")return W(t);if(e==="dashboard")return z(t);if(e==="settings")return K(t);if(e==="settings_branding")return te(t);t.innerHTML='<div style="max-width:980px;margin:40px auto;padding:0 16px;opacity:.8">Page introuvable.</div>'}const v=_();try{const e=v.brand,t=e.TITLE_SUFFIX&&e.TITLE_SUFFIX.trim()?" "+e.TITLE_SUFFIX.trim():"";document.title=(e.APP_DISPLAY_NAME||"iCONTROL")+t,v.warnings&&v.warnings.length&&console.warn("WARN_BRAND_FALLBACK",v.warnings)}catch(e){console.warn("WARN_BRAND_TITLE_FAILED",String(e))}(function(){try{const e=document.getElementById("app")||document.body;try{if(e.dataset&&e.dataset.uiShell==="UI_SHELL_NAV_V1")return;e.dataset.uiShell="UI_SHELL_NAV_V1"}catch{}const t=V(Y());e.innerHTML="",e.appendChild(t.root),window.__ICONTROL_MOUNT__=t.main;try{const n=v.brand;n&&n.APP_DISPLAY_NAME&&t.setBrandTitle(n.APP_DISPLAY_NAME)}catch{}}catch(e){console.error("UI_SHELL_NAV_V1 mount failed",e)}})();function re(e){const t=$();ne(e,t)}queueMicrotask(()=>{X(e=>re(e))});
