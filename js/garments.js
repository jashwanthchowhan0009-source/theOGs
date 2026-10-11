/* Flat garment illustrations used as placeholder product imagery.
   Swap for real photography by setting `image` on a product in data.js. */
(function () {
  let uid = 0;

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const f = (c) => Math.max(0, Math.min(255, Math.round(c + (amt < 0 ? c * amt : (255 - c) * amt))));
    const r = f(n >> 16), g = f((n >> 8) & 255), b = f(n & 255);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function isLight(hex) {
    const n = parseInt(hex.slice(1), 16);
    const r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    return (r * 299 + g * 587 + b * 114) / 1000 > 150;
  }

  const shapes = {
    tee(c, d, ink, print) {
      return `
        <path d="M82 38 L58 47 L20 80 L44 116 L66 103 L66 252 Q120 260 174 252 L174 103 L196 116 L220 80 L182 47 L158 38 Q120 64 82 38 Z" fill="${c}" stroke="${d}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M82 38 Q120 64 158 38" fill="none" stroke="${d}" stroke-width="5" stroke-linecap="round"/>
        <path d="M66 103 L66 120 M174 103 L174 120" stroke="${d}" stroke-width="1.5" opacity=".5"/>
        <path d="M44 116 L52 104 M196 116 L188 104" stroke="${d}" stroke-width="1.5" opacity=".6"/>
        ${print ? `<text x="120" y="128" text-anchor="middle" font-family="Archivo, Arial Black, sans-serif" font-weight="900" font-size="30" fill="${ink}" letter-spacing="-1">${print}</text>` : ""}`;
    },
    hoodie(c, d, ink, print) {
      return `
        <path d="M78 54 L52 64 Q30 94 24 200 L22 238 L50 240 L58 132 L66 112 L66 254 Q120 262 174 254 L174 112 L182 132 L190 240 L218 238 L216 200 Q210 94 188 64 L162 54 Z" fill="${c}" stroke="${d}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M84 56 Q78 14 120 12 Q162 14 156 56 Q140 76 120 76 Q100 76 84 56 Z" fill="${c}" stroke="${d}" stroke-width="2"/>
        <path d="M96 52 Q96 26 120 24 Q144 26 144 52 Q132 64 120 64 Q108 64 96 52 Z" fill="${shade(c, -0.35)}"/>
        <path d="M110 74 L108 112 M130 74 L132 112" stroke="${d}" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M84 186 L156 186 L166 228 L74 228 Z" fill="none" stroke="${d}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M66 240 L174 240" stroke="${d}" stroke-width="1.5" opacity=".6"/>
        ${print ? `<text x="120" y="152" text-anchor="middle" font-family="Archivo, Arial Black, sans-serif" font-weight="900" font-size="24" fill="${ink}">${print}</text>` : ""}`;
    },
    jacket(c, d, ink, print) {
      return `
        <path d="M80 40 L52 52 Q30 90 24 200 L22 238 L50 240 L58 132 L66 112 L66 252 L174 252 L174 112 L182 132 L190 240 L218 238 L216 200 Q210 90 188 52 L160 40 Z" fill="${c}" stroke="${d}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M80 40 L104 30 L120 58 L136 30 L160 40 L140 70 L120 58 L100 70 Z" fill="${shade(c, -0.2)}" stroke="${d}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M120 58 L120 252" stroke="${d}" stroke-width="2.5"/>
        <rect x="66" y="238" width="108" height="14" fill="${shade(c, -0.25)}"/>
        <path d="M22 230 L50 232 M190 232 L218 230" stroke="${shade(c, -0.25)}" stroke-width="10"/>
        <path d="M80 160 L104 160 M136 160 L160 160" stroke="${d}" stroke-width="2" stroke-linecap="round"/>
        ${print ? `<text x="90" y="112" text-anchor="middle" font-family="Archivo, Arial Black, sans-serif" font-weight="900" font-size="20" fill="${ink}">${print}</text>` : ""}`;
    },
    cargo(c, d) {
      return `
        <path d="M70 22 L170 22 L184 266 L134 266 L122 102 L118 102 L106 266 L56 266 Z" fill="${c}" stroke="${d}" stroke-width="2" stroke-linejoin="round"/>
        <rect x="70" y="22" width="100" height="16" fill="${shade(c, -0.15)}" stroke="${d}" stroke-width="2"/>
        <path d="M120 38 L120 86" stroke="${d}" stroke-width="2"/>
        <path d="M80 38 Q86 64 70 72 M160 38 Q154 64 170 72" fill="none" stroke="${d}" stroke-width="2"/>
        <rect x="60" y="132" width="34" height="44" rx="3" fill="${shade(c, -0.08)}" stroke="${d}" stroke-width="2"/>
        <rect x="146" y="132" width="34" height="44" rx="3" fill="${shade(c, -0.08)}" stroke="${d}" stroke-width="2"/>
        <path d="M60 144 L94 144 M146 144 L180 144" stroke="${d}" stroke-width="2"/>
        <path d="M58 254 L106 254 M134 254 L182 254" stroke="${d}" stroke-width="2" opacity=".5"/>`;
    },
    cap(c, d, ink, print) {
      return `
        <path d="M48 178 Q46 72 120 66 Q194 72 192 178 Z" fill="${c}" stroke="${d}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M120 66 L120 178 M84 74 Q74 120 80 178 M156 74 Q166 120 160 178" fill="none" stroke="${d}" stroke-width="1.5" opacity=".6"/>
        <path d="M28 182 Q120 156 212 182 Q206 212 120 206 Q34 212 28 182 Z" fill="${shade(c, -0.18)}" stroke="${d}" stroke-width="2"/>
        <circle cx="120" cy="66" r="6" fill="${shade(c, -0.25)}"/>
        ${print ? `<text x="120" y="140" text-anchor="middle" font-family="Archivo, Arial Black, sans-serif" font-weight="900" font-size="30" fill="${ink}">${print}</text>` : ""}`;
    },
    tote(c, d, ink, print) {
      return `
        <path d="M88 108 Q88 40 120 40 Q152 40 152 108" fill="none" stroke="${shade(c, -0.2)}" stroke-width="9" stroke-linecap="round"/>
        <path d="M58 104 L182 104 L188 256 L52 256 Z" fill="${c}" stroke="${d}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M58 116 L182 116" stroke="${d}" stroke-width="1.5" opacity=".5"/>
        ${print ? `<text x="120" y="194" text-anchor="middle" font-family="Archivo, Arial Black, sans-serif" font-weight="900" font-size="34" fill="${ink}" letter-spacing="-1">${print}</text>` : ""}`;
    }
  };

  /** Returns an SVG string for a garment of `type` in `color`. */
  window.garmentSVG = function (type, color, opts) {
    opts = opts || {};
    const id = "g" + ++uid;
    const d = shade(color, -0.32);
    const ink = opts.ink || (isLight(color) ? "#16161A" : "#F2F1EC");
    const body = (shapes[type] || shapes.tee)(color, d, ink, opts.print);
    return `<svg class="garment" viewBox="0 0 240 280" role="img" aria-label="${opts.label || type}">
      <defs>
        <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#fff" stop-opacity=".22"/>
          <stop offset=".55" stop-color="#fff" stop-opacity="0"/>
          <stop offset="1" stop-color="#000" stop-opacity=".18"/>
        </linearGradient>
        <mask id="${id}m"><g fill="#fff" stroke="#fff">${body}</g></mask>
      </defs>
      <ellipse cx="120" cy="270" rx="78" ry="7" fill="#000" opacity=".12"/>
      ${body}
      <rect width="240" height="280" fill="url(#${id})" mask="url(#${id}m)"/>
    </svg>`;
  };
})();
