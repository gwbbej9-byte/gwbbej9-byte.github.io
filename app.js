/* playground — Web Crypto / SHA-256, no backend. CBOX v1 matches crypto-box.exe */
(() => {
  const APPS = [
    { id: "crypto-box", title: "crypto-box", tag: "C++20 · AES-256-GCM", pill: "живой файл", real: true, run: "cbox" },
    { id: "cert-lens", title: "cert-lens", tag: "C++20 · X.509", pill: "разбор PEM", real: true, run: "cert" },
    { id: "hdrchain", title: "hdrchain", tag: "C++20 · SHA-256d PoW", pill: "майнит здесь", real: true, run: "hdr" },
    { id: "twinseek", title: "twinseek", tag: "Rust · SHA-256 dupes", pill: "хеш файлов", real: true, run: "twin" },
    { id: "nasmhex", title: "nasmhex", tag: "NASM · hexdump -C", pill: "дамп файла", real: true, run: "hex" },
    { id: "logship", title: "logship", tag: "Go · tail + уровни", pill: "живые логи", real: true, run: "log" },
    { id: "pulsecheck", title: "pulsecheck", tag: "Python · HTTP/TCP", pill: "пробы", real: true, run: "pulse" },
    { id: "winpulse", title: "winpulse", tag: ".NET 8 · процессы", pill: "макет UI", real: false, run: "win" },
    { id: "harborlm", title: "harborlm", tag: "GGUF TUI", pill: "demo TUI", real: false, run: "harbor" },
  ];

  const rail = document.getElementById("rail");
  const bench = document.getElementById("bench");
  const panel = document.getElementById("panel");
  const cmd = document.getElementById("cmd");
  const cmdQ = document.getElementById("cmd-q");
  const cmdList = document.getElementById("cmd-list");
  const cleanups = [];
  function onClose(fn) { cleanups.push(fn); }

  for (const a of APPS) {
    const el = document.createElement("article");
    el.className = "card";
    el.dataset.id = a.id;
    el.innerHTML = `
      <img src="shots/${a.id}.png" alt="${a.title}">
      <div class="body">
        <span class="pill ${a.real ? "" : "mock"}">${a.pill}</span>
        <h2>${a.title}</h2>
        <div class="tag">${a.tag}</div>
        <div class="row">
          <button class="btn go" type="button" data-run="${a.id}">запустить</button>
          <a class="btn" href="https://github.com/gwbbej9-byte/${a.id}">код</a>
          <a class="btn dl" href="downloads/${a.id}.zip" download>скачать</a>
        </div>
      </div>`;
    rail.appendChild(el);
  }

  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches
    && !matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (fine) {
    let raf = 0;
    rail.addEventListener("pointermove", (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        for (const card of rail.querySelectorAll(".card")) {
          const r = card.getBoundingClientRect();
          card.style.setProperty("--mx", `${e.clientX - r.left}px`);
          card.style.setProperty("--my", `${e.clientY - r.top}px`);
        }
      });
    });
  }

  rail.addEventListener("click", (e) => {
    const b = e.target.closest("[data-run]");
    if (b) openApp(b.getAttribute("data-run"));
  });

  function openApp(id) {
    const a = APPS.find((x) => x.id === id);
    if (!a) return;
    while (cleanups.length) cleanups.pop()();
    panel.innerHTML = "";
    const close = document.createElement("button");
    close.className = "close";
    close.type = "button";
    close.textContent = "закрыть";
    close.addEventListener("click", closeBench);
    panel.appendChild(close);
    RUNNERS[a.run](panel, a);
    bench.hidden = false;
    history.replaceState(null, "", `#${id}`);
  }

  function closeBench() {
    while (cleanups.length) cleanups.pop()();
    bench.hidden = true;
    history.replaceState(null, "", location.pathname);
  }
  bench.addEventListener("click", (e) => { if (e.target === bench) closeBench(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!cmd.hidden) { cmd.hidden = true; return; }
      if (!bench.hidden) closeBench();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      openCmd();
    }
  });
  document.getElementById("open-cmd").addEventListener("click", (e) => {
    e.preventDefault();
    openCmd();
  });

  function openCmd() {
    cmd.hidden = false;
    cmdQ.value = "";
    renderCmd("");
    cmdQ.focus();
  }
  cmdQ.addEventListener("input", () => renderCmd(cmdQ.value));
  function renderCmd(q) {
    const n = q.trim().toLowerCase();
    const hits = APPS.filter((a) => !n || a.id.includes(n) || a.tag.toLowerCase().includes(n) || a.pill.includes(n));
    cmdList.innerHTML = "";
    hits.forEach((a, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = `${a.title}  —  ${a.pill}`;
      if (i === 0) b.className = "on";
      b.addEventListener("click", () => { cmd.hidden = true; openApp(a.id); });
      cmdList.appendChild(b);
    });
  }
  cmdQ.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const first = cmdList.querySelector("button");
      if (first) first.click();
    }
  });

  const enc = new TextEncoder();
  const dec = new TextDecoder();

  function el(html) {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content;
  }
  function download(name, bytes, mime) {
    const blob = new Blob([bytes], { type: mime || "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
  function dropZone(onFile, label) {
    const d = document.createElement("div");
    d.className = "drop";
    d.textContent = label || "брось файл сюда или клик";
    const inp = document.createElement("input");
    inp.type = "file";
    inp.hidden = true;
    d.addEventListener("click", () => inp.click());
    d.addEventListener("dragover", (e) => { e.preventDefault(); d.classList.add("over"); });
    d.addEventListener("dragleave", () => d.classList.remove("over"));
    d.addEventListener("drop", (e) => {
      e.preventDefault();
      d.classList.remove("over");
      const f = e.dataTransfer.files[0];
      if (f) onFile(f);
    });
    inp.addEventListener("change", () => { if (inp.files[0]) onFile(inp.files[0]); });
    d.appendChild(inp);
    return d;
  }
  function termBox() {
    const t = document.createElement("div");
    t.className = "term";
    t.textContent = "";
    return t;
  }

  /* —— CBOX v1: magic 4 + ver 1 + salt 16 + nonce 12 + cipher + tag 16 —— */
  const CBOX = {
    MAGIC: new Uint8Array([0x43, 0x42, 0x4f, 0x58]),
    VER: 1,
    SALT: 16,
    NONCE: 12,
    TAG: 16,
    HDR: 33,
    ROUNDS: 210000,
    MAX: 8 * 1024 * 1024,
  };
  async function deriveAes(password, salt) {
    const raw = enc.encode(password);
    if (!raw.length) throw new Error("пустой пароль");
    const base = await crypto.subtle.importKey("raw", raw, "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: CBOX.ROUNDS, hash: "SHA-256" },
      base,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }
  async function cboxEncrypt(plain, password) {
    if (plain.byteLength > CBOX.MAX) throw new Error("в браузере до 8 МиБ; exe ест больше");
    const salt = crypto.getRandomValues(new Uint8Array(CBOX.SALT));
    const nonce = crypto.getRandomValues(new Uint8Array(CBOX.NONCE));
    const aad = new Uint8Array(5);
    aad.set(CBOX.MAGIC, 0);
    aad[4] = CBOX.VER;
    const key = await deriveAes(password, salt);
    const packed = new Uint8Array(await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonce, additionalData: aad, tagLength: 128 },
      key,
      plain
    ));
    const clen = packed.length - CBOX.TAG;
    const out = new Uint8Array(CBOX.HDR + clen + CBOX.TAG);
    out.set(CBOX.MAGIC, 0);
    out[4] = CBOX.VER;
    out.set(salt, 5);
    out.set(nonce, 21);
    out.set(packed.subarray(0, clen), 33);
    out.set(packed.subarray(clen), 33 + clen);
    return out;
  }
  async function cboxDecrypt(blob, password) {
    if (blob.byteLength < CBOX.HDR + CBOX.TAG) throw new Error("обрезанный .cbox");
    if (blob[0] !== 0x43 || blob[1] !== 0x42 || blob[2] !== 0x4f || blob[3] !== 0x58)
      throw new Error("не CBOX");
    if (blob[4] !== CBOX.VER) throw new Error("версия не 1");
    const salt = blob.subarray(5, 21);
    const nonce = blob.subarray(21, 33);
    const clen = blob.byteLength - CBOX.HDR - CBOX.TAG;
    const cipher = blob.subarray(33, 33 + clen);
    const tag = blob.subarray(33 + clen);
    const aad = blob.subarray(0, 5);
    const key = await deriveAes(password, salt);
    const packed = new Uint8Array(clen + CBOX.TAG);
    packed.set(cipher);
    packed.set(tag, clen);
    try {
      return new Uint8Array(await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: nonce, additionalData: aad, tagLength: 128 },
        key,
        packed
      ));
    } catch {
      return new Uint8Array(await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: nonce, tagLength: 128 },
        key,
        packed
      ));
    }
  }

  const RUNNERS = {};

  RUNNERS.cbox = (root) => {
    root.appendChild(el(`
      <h3>crypto-box</h3>
      <p class="sub">формат exe: CBOX v1 · salt 16 · nonce 12 · AES-256-GCM · PBKDF2-HMAC-SHA256 210000 · AAD = magic+ver. .cbox с этой страницы открывается crypto-box.exe и наоборот.</p>
    `));
    const zone = dropZone((f) => { file = f; name.textContent = `${f.name} · ${f.size} байт`; }, "брось любой файл — зашифруется в .cbox");
    const name = document.createElement("div");
    name.className = "stat";
    name.textContent = "файла нет — можно вписать текст ниже";
    const pw = document.createElement("input");
    pw.type = "password";
    pw.autocomplete = "new-password";
    pw.placeholder = "пароль";
    const ta = document.createElement("textarea");
    ta.placeholder = "или вставь текст — уйдёт как note.txt";
    const st = document.createElement("div");
    st.className = "stat";
    let file = null;
    const actions = document.createElement("div");
    actions.className = "actions";
    const bEnc = document.createElement("button");
    bEnc.className = "btn go";
    bEnc.textContent = "зашифровать";
    const bDec = document.createElement("button");
    bDec.className = "btn";
    bDec.textContent = "расшифровать .cbox";
    actions.append(bEnc, bDec);
    root.append(zone, name);
    const field = document.createElement("div");
    field.className = "field";
    const lab = document.createElement("label");
    lab.textContent = "пароль";
    field.append(lab, pw);
    root.append(field, ta, actions, st);

    async function bytes() {
      if (file) return new Uint8Array(await file.arrayBuffer());
      if (ta.value.length) return enc.encode(ta.value);
      throw new Error("нет файла и нет текста");
    }
    bEnc.addEventListener("click", async () => {
      st.textContent = "PBKDF2 210000…";
      try {
        const src = await bytes();
        const t0 = performance.now();
        const out = await cboxEncrypt(src, pw.value);
        const ms = Math.round(performance.now() - t0);
        const base = file ? file.name : "note.txt";
        download(base + ".cbox", out, "application/octet-stream");
        st.textContent = `CBOX ${out.byteLength} байт · ${ms} мс · скачан ${base}.cbox`;
      } catch (err) {
        st.textContent = String(err.message || err);
      }
    });
    bDec.addEventListener("click", async () => {
      st.textContent = "снимаю GCM…";
      try {
        const src = await bytes();
        const t0 = performance.now();
        const out = await cboxDecrypt(src, pw.value);
        const ms = Math.round(performance.now() - t0);
        let outName = file && file.name.endsWith(".cbox") ? file.name.slice(0, -5) : "decrypted.bin";
        if (!outName) outName = "decrypted.bin";
        download(outName, out, "application/octet-stream");
        st.textContent = `plain ${out.byteLength} байт · ${ms} мс · ${outName}`;
      } catch (err) {
        st.textContent = "не открылось: неверный пароль или не CBOX";
      }
    });
  };

  /* hexdump -C as nasmhex: 8-digit offset, gap after 8 bytes, |ascii| */
  function hexdumpC(buf, max) {
    const n = Math.min(buf.length, max || buf.length);
    const lines = [];
    const hex = "0123456789abcdef";
    for (let off = 0; off < n; off += 16) {
      const chunk = buf.subarray(off, Math.min(off + 16, n));
      let h = off.toString(16).padStart(8, "0") + "  ";
      let asc = "";
      for (let i = 0; i < 16; i++) {
        if (i === 8) h += " ";
        if (i < chunk.length) {
          const b = chunk[i];
          h += hex[b >> 4] + hex[b & 15] + " ";
          asc += b >= 0x20 && b <= 0x7e ? String.fromCharCode(b) : ".";
        } else h += "   ";
      }
      lines.push(h + " |" + asc + "|");
    }
    if (n < buf.length) lines.push(`… truncated ${n}/${buf.length}`);
    lines.push(n.toString(16).padStart(8, "0"));
    return lines.join("\n");
  }

  RUNNERS.hex = (root) => {
    root.appendChild(el(`<h3>nasmhex</h3><p class="sub">тот же hexdump -C: 8 hex offset, mid-gap, |ascii|. в zip — Linux ELF без libc.</p>`));
    const t = termBox();
    t.textContent = "брось файл";
    root.appendChild(dropZone(async (f) => {
      const b = new Uint8Array(await f.arrayBuffer());
      t.textContent = hexdumpC(b, 16 * 32);
    }));
    root.appendChild(t);
  };

  async function sha256(buf) {
    return new Uint8Array(await crypto.subtle.digest("SHA-256", buf));
  }
  async function sha256d(buf) {
    return sha256(await sha256(buf));
  }
  function hexOf(u8) {
    return [...u8].map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  RUNNERS.twin = (root) => {
    root.appendChild(el(`<h3>twinseek</h3><p class="sub">SHA-256 как в rust-бинаре. одинаковый хеш — дубликат. несколько файлов за раз.</p>`));
    const t = termBox();
    const d = dropZone(() => {}, "брось пачку файлов");
    d.querySelector("input").multiple = true;
    d.addEventListener("drop", async (e) => {
      e.preventDefault();
      await hashFiles(e.dataTransfer.files);
    }, true);
    d.querySelector("input").addEventListener("change", async (e) => {
      await hashFiles(e.target.files);
    });
    async function hashFiles(list) {
      const map = new Map();
      t.textContent = "считаю…";
      for (const f of list) {
        const buf = new Uint8Array(await f.arrayBuffer());
        const h = hexOf(await sha256(buf));
        if (!map.has(h)) map.set(h, []);
        map.get(h).push(`${f.name} (${f.size})`);
      }
      const lines = [];
      for (const [h, names] of map) {
        const mark = names.length > 1 ? "DUPE" : "uniq";
        lines.push(`${mark}  ${h.slice(0, 16)}…  ${names.join(" | ")}`);
      }
      t.textContent = lines.join("\n") || "пусто";
    }
    root.append(d, t);
  };

  /* compact DER / X.509 */
  function pemToDer(text) {
    const m = text.replace(/\r/g, "").match(/-----BEGIN CERTIFICATE-----([\s\S]+?)-----END CERTIFICATE-----/);
    if (!m) {
      const b = enc.encode(text);
      if (b.length >= 2 && b[0] === 0x30) return b;
      throw new Error("нет PEM и не DER");
    }
    const bin = atob(m[1].replace(/\s+/g, ""));
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function derLen(buf, i) {
    const b = buf[i];
    if (b < 0x80) return { len: b, n: 1 };
    const n = b & 0x7f;
    let len = 0;
    for (let k = 0; k < n; k++) len = (len << 8) | buf[i + 1 + k];
    return { len, n: 1 + n };
  }
  function derNode(buf, i) {
    const tag = buf[i];
    const { len, n } = derLen(buf, i + 1);
    const start = i + 1 + n;
    return { tag, start, end: start + len, hdr: start };
  }
  function derChildren(buf, start, end) {
    const kids = [];
    let i = start;
    while (i < end) {
      const n = derNode(buf, i);
      kids.push(n);
      i = n.end;
    }
    return kids;
  }
  function oidOf(buf, node) {
    const v = buf.subarray(node.start, node.end);
    if (!v.length) return "";
    const parts = [Math.floor(v[0] / 40), v[0] % 40];
    let acc = 0;
    for (let i = 1; i < v.length; i++) {
      acc = (acc << 7) | (v[i] & 0x7f);
      if (!(v[i] & 0x80)) { parts.push(acc); acc = 0; }
    }
    return parts.join(".");
  }
  function strOf(buf, node) {
    const t = node.tag & 0x1f;
    const v = buf.subarray(node.start, node.end);
    if (t === 0x1e) {
      let s = "";
      for (let i = 0; i + 1 < v.length; i += 2) s += String.fromCharCode((v[i] << 8) | v[i + 1]);
      return s;
    }
    return dec.decode(v);
  }
  function intHex(buf, node) {
    return hexOf(buf.subarray(node.start, node.end)).replace(/^00/, "") || "00";
  }
  function parseName(buf, node) {
    const bits = [];
    for (const rdn of derChildren(buf, node.start, node.end)) {
      for (const atv of derChildren(buf, rdn.start, rdn.end)) {
        const kv = derChildren(buf, atv.start, atv.end);
        if (kv.length < 2) continue;
        const oid = oidOf(buf, kv[0]);
        const val = strOf(buf, kv[1]);
        const map = { "2.5.4.3": "CN", "2.5.4.6": "C", "2.5.4.10": "O", "2.5.4.11": "OU" };
        bits.push(`${map[oid] || oid}=${val}`);
      }
    }
    return bits.join(", ");
  }
  function parseTime(buf, node) {
    const s = strOf(buf, node);
    if (s.length === 13 && s.endsWith("Z")) {
      const y = Number(s.slice(0, 2));
      const yy = y < 50 ? 2000 + y : 1900 + y;
      return `${yy}-${s.slice(2, 4)}-${s.slice(4, 6)} ${s.slice(6, 8)}:${s.slice(8, 10)}:${s.slice(10, 12)}Z`;
    }
    if (s.length >= 15) return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)} ${s.slice(8, 10)}:${s.slice(10, 12)}:${s.slice(12, 14)}Z`;
    return s;
  }
  function parseCert(der) {
    const cert = derNode(der, 0);
    const top = derChildren(der, cert.start, cert.end);
    if (!top.length) throw new Error("пустой DER");
    const tbs = top[0];
    let kids = derChildren(der, tbs.start, tbs.end);
    if (kids[0] && kids[0].tag === 0xa0) kids = kids.slice(1);
    const serial = kids[0];
    const issuer = kids[2];
    const validity = kids[3];
    const subject = kids[4];
    const vt = derChildren(der, validity.start, validity.end);
    const out = {
      serial: intHex(der, serial),
      issuer: parseName(der, issuer),
      subject: parseName(der, subject),
      notBefore: parseTime(der, vt[0]),
      notAfter: parseTime(der, vt[1]),
      san: "",
    };
    const last = kids[kids.length - 1];
    if (last && last.tag === 0xa3) {
      const seq = derNode(der, last.start);
      for (const ext of derChildren(der, seq.start, seq.end)) {
        const parts = derChildren(der, ext.start, ext.end);
        if (!parts.length) continue;
        if (oidOf(der, parts[0]) !== "2.5.29.17") continue;
        const octet = parts[parts.length - 1];
        const gseq = derNode(der, octet.start);
        const names = [];
        for (const g of derChildren(der, gseq.start, gseq.end)) {
          names.push(dec.decode(der.subarray(g.start, g.end)));
        }
        out.san = names.join(", ");
      }
    }
    return out;
  }
  const SAMPLE_PEM = `-----BEGIN CERTIFICATE-----
MIIDfTCCAmWgAwIBAgIQHX9CO/6orLBAmdD6KFzVvzANBgkqhkiG9w0BAQsFADA9MQswCQYDVQQG
EwJSVTESMBAGA1UECgwJUG9ydGZvbGlvMRowGAYDVQQDDBFjZXJ0LWxlbnMuZXhhbXBsZTAeFw0y
NjExMTYxNDAxMzFaFw0yODExMTYxNDExMzFaMD0xCzAJBgNVBAYTAlJVMRIwEAYDVQQKDAlQb3J0
Zm9saW8xGjAYBgNVBAMMEWNlcnQtbGVucy5leGFtcGxlMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A
MIIBCgKCAQEAxojQ6xSGkkIWK4SmI8GucFtygjjTpPma1BEPWX0BzZaADpvoWbFfjkDJNFVBc3+6
X3fMy3pvpqQciTCwR3C8+LU1V9qANLS4kGN7+sgifnsh4yg1S8s790aLyWqGWwgP1+bZZ4b0mooY
o/FzwXxwloi8Ikp8UlosLPcUArnepNMnt/g3bCCyRblHJFLhWOY0NfR4xbc/ILU0HvvKX9eaW3Ng
ZFhAs6UN8KjSA6+MLE2sNe5sS+dlHhgOxCHHYSxjUOF7N1FqtWrnI6OhBDscIl/u75gaFRd+Y0Q2
LSXY0vJaIRR06bXEI7Bleu0BFAdGQdb0yqLciNO2No7J8QtkPQIDAQABo3kwdzAOBgNVHQ8BAf8E
BAMCBaAwHQYDVR0lBBYwFAYIKwYBBQUHAwIGCCsGAQUFBwMBMCcGA1UdEQQgMB6CEWNlcnQtbGVu
cy5leGFtcGxlgglsb2NhbGhvc3QwHQYDVR0OBBYEFIzaSGzSUrQ2Cd6lJ3lle1KCo267MA0GCSqG
SIb3DQEBCwUAA4IBAQAcjiPOjeXTDkR3vySRvZkkmjR3j+DnoWdLYzVYcEflP68iWxQy91Rxn8dN
sfCqbNM+pjYqJSpwaC5hzt1mXVit92ro8AxnH9WrBGxnVW9Kcsue8SmxfpWt51p+i59VTN772jWN
3Thc6m/ixn8H8dmRGCEk/t0yvcBSFjPUufomJRV3PgZ+jtGEgdS0i3n9A4lnyQJmu10cTaQDFE1b
5/603Ec4yMuEHQ56GseiIzkn7dLyF+1Zq4PfthOBrd59x0YxeGazmlpOgQw6MCPfy1ySiSCcHz2g
3XUB6NQ5/+ZryvJDECjkuUusEZERTWdAOfd4oqAWdNTay60uDxQSzMwW
-----END CERTIFICATE-----`;

  RUNNERS.cert = (root) => {
    root.appendChild(el(`<h3>cert-lens</h3><p class="sub">PEM/DER в браузере. тот же example.pem, что в репозитории. exe идёт через Crypt32.</p>`));
    const kv = document.createElement("div");
    kv.className = "kv";
    function show(c) {
      kv.innerHTML = `
        <b>subject</b><span>${c.subject}</span>
        <b>issuer</b><span>${c.issuer}</span>
        <b>serial</b><span>${c.serial}</span>
        <b>not before</b><span>${c.notBefore}</span>
        <b>not after</b><span>${c.notAfter}</span>
        <b>SAN</b><span>${c.san || "—"}</span>`;
    }
    const st = document.createElement("div");
    st.className = "stat";
    const zone = dropZone(async (f) => {
      try {
        const text = await f.text();
        let der;
        try { der = pemToDer(text); }
        catch { der = new Uint8Array(await f.arrayBuffer()); }
        show(parseCert(der));
        st.textContent = f.name;
      } catch (e) {
        st.textContent = String(e.message || e);
      }
    }, "брось .pem / .cer / .crt");
    const sample = document.createElement("button");
    sample.className = "btn go";
    sample.textContent = "example.pem";
    sample.addEventListener("click", () => {
      show(parseCert(pemToDer(SAMPLE_PEM)));
      st.textContent = "samples/example.pem · self-signed RSA-2048";
    });
    root.append(zone, sample, kv, st);
    sample.click();
  };

  const EASY_BITS = 0x1f0fffff;
  function wrLe32(p, o, x) {
    p[o] = x & 255; p[o + 1] = (x >> 8) & 255; p[o + 2] = (x >> 16) & 255; p[o + 3] = (x >> 24) & 255;
  }
  function bitsTarget(bits) {
    const t = new Uint8Array(32);
    const exp = bits >>> 24;
    let man = bits & 0x007fffff;
    if (bits & 0x00800000) man = 0;
    const m = [(man >>> 16) & 255, (man >>> 8) & 255, man & 255];
    const pos = 32 - exp;
    for (let i = 0; i < 3; i++) {
      const idx = pos + i;
      if (idx >= 0 && idx < 32) t[idx] = m[i];
    }
    return t;
  }
  function meets(hash, bits) {
    const target = bitsTarget(bits);
    const be = new Uint8Array(32);
    for (let i = 0; i < 32; i++) be[i] = hash[31 - i];
    for (let i = 0; i < 32; i++) {
      if (be[i] < target[i]) return true;
      if (be[i] > target[i]) return false;
    }
    return true;
  }
  async function merkleStrings(txs) {
    let lvl = [];
    for (const t of txs) lvl.push(await sha256d(enc.encode(t)));
    while (lvl.length > 1) {
      if (lvl.length % 2) lvl.push(lvl[lvl.length - 1]);
      const next = [];
      for (let i = 0; i < lvl.length; i += 2) {
        const cat = new Uint8Array(64);
        cat.set(lvl[i], 0);
        cat.set(lvl[i + 1], 32);
        next.push(await sha256d(cat));
      }
      lvl = next;
    }
    return lvl[0];
  }
  async function mineBlock(prev, txs, bits, time) {
    const merkle = await merkleStrings(txs);
    const hdr = new Uint8Array(80);
    wrLe32(hdr, 0, 1);
    hdr.set(prev, 4);
    hdr.set(merkle, 36);
    wrLe32(hdr, 68, time);
    wrLe32(hdr, 72, bits);
    for (let nonce = 0; nonce < 0x100000; nonce++) {
      wrLe32(hdr, 76, nonce);
      const h = await sha256d(hdr);
      if (meets(h, bits)) return { hdr: hdr.slice(), hash: h, nonce, merkle };
    }
    throw new Error("не нашёл nonce");
  }

  RUNNERS.hdr = (root) => {
    root.appendChild(el(`<h3>hdrchain</h3><p class="sub">80-байтовый заголовок как Bitcoin. PoW = SHA-256d, bits 0x1f0fffff — как kEasyBits в exe, майнится за миллисекунды.</p>`));
    const tx = document.createElement("input");
    tx.type = "text";
    tx.value = "coinbase";
    const t = termBox();
    const st = document.createElement("div");
    st.className = "stat";
    const chain = [];
    const actions = document.createElement("div");
    actions.className = "actions";
    const b0 = document.createElement("button");
    b0.className = "btn go";
    b0.textContent = "genesis";
    const b1 = document.createElement("button");
    b1.className = "btn";
    b1.textContent = "append";
    actions.append(b0, b1);
    async function add(genesis) {
      st.textContent = "sha256d…";
      const prev = genesis || !chain.length ? new Uint8Array(32) : chain[chain.length - 1].hash;
      const txs = tx.value.trim() ? [tx.value.trim()] : ["coinbase"];
      const t0 = performance.now();
      const b = await mineBlock(prev, txs, EASY_BITS, Math.floor(Date.now() / 1000) >>> 0);
      chain.push(b);
      const ms = Math.round(performance.now() - t0);
      t.textContent = chain.map((x, i) =>
        `#${i} nonce=${x.nonce}\nhash ${hexOf(x.hash)}\nmerkle ${hexOf(x.merkle)}`
      ).join("\n\n");
      st.textContent = `${chain.length} блок(а) · ${ms} мс`;
    }
    b0.addEventListener("click", () => { chain.length = 0; add(true); });
    b1.addEventListener("click", () => add(false));
    const field = document.createElement("div");
    field.className = "field";
    field.innerHTML = "<label>tx</label>";
    field.appendChild(tx);
    root.append(field, actions, t, st);
  };

  const LVL_RE = [
    [/error|fatal|panic/i, "e", "ERROR"],
    [/warn/i, "w", "WARN"],
    [/info/i, "i", "INFO"],
    [/debug/i, "d", "DEBUG"],
  ];
  RUNNERS.log = (root) => {
    root.appendChild(el(`<h3>logship</h3><p class="sub">краска по уровню как в Go-хвосте. можно бросить свой .log или пустить генератор.</p>`));
    const t = termBox();
    let timer = 0;
    const samples = [
      "INFO  api listening :8080",
      "DEBUG worker 3 picked job 1842",
      "WARN  retry 2/5 upstream 10.0.0.8",
      "ERROR billing timeout after 800ms",
      "INFO  /healthz 200 1ms",
    ];
    function paint(line) {
      const hit = LVL_RE.find((x) => x[0].test(line));
      const span = document.createElement("div");
      span.className = hit ? hit[1] : "";
      span.textContent = line;
      t.appendChild(span);
      while (t.childNodes.length > 80) t.removeChild(t.firstChild);
      t.scrollTop = t.scrollHeight;
    }
    const actions = document.createElement("div");
    actions.className = "actions";
    const go = document.createElement("button");
    go.className = "btn go";
    go.textContent = "хвост";
    const stop = document.createElement("button");
    stop.className = "btn";
    stop.textContent = "стоп";
    go.addEventListener("click", () => {
      if (timer) return;
      timer = setInterval(() => paint(`${new Date().toISOString()} ${samples[Math.floor(Math.random() * samples.length)]}`), 420);
    });
    stop.addEventListener("click", () => { clearInterval(timer); timer = 0; });
    onClose(() => { clearInterval(timer); timer = 0; });
    actions.append(go, stop);
    root.appendChild(dropZone(async (f) => {
      const text = await f.text();
      t.innerHTML = "";
      for (const line of text.split(/\r?\n/).slice(0, 200)) if (line) paint(line);
    }, "брось .log"));
    root.append(actions, t);
  };

  RUNNERS.pulse = (root) => {
    root.appendChild(el(`<h3>pulsecheck</h3><p class="sub">живой GET на api.github.com (CORS). остальные строки — как pulsecheck demo: макет промахов.</p>`));
    const t = termBox();
    const go = document.createElement("button");
    go.className = "btn go";
    go.textContent = "прогнать";
    async function row(name, kind, fn) {
      const t0 = performance.now();
      try {
        const r = await fn();
        const ms = Math.round(performance.now() - t0);
        const ok = r.ok ? "ok" : "e";
        const span = document.createElement("div");
        span.className = ok;
        span.textContent = `${name.padEnd(14)} ${kind.padEnd(4)} ${r.status || "—"}  ${ms}ms`;
        t.appendChild(span);
      } catch {
        const ms = Math.round(performance.now() - t0);
        const span = document.createElement("div");
        span.className = "e";
        span.textContent = `${name.padEnd(14)} ${kind.padEnd(4)} down  ${ms}ms`;
        t.appendChild(span);
      }
    }
    go.addEventListener("click", async () => {
      t.innerHTML = "";
      await row("github-api", "http", async () => {
        const r = await fetch("https://api.github.com/zen", { signal: AbortSignal.timeout(2500) });
        return { ok: r.ok, status: r.status };
      });
      await row("pages", "http", async () => {
        const r = await fetch("index.html", { signal: AbortSignal.timeout(2500) });
        return { ok: r.ok, status: r.status };
      });
      await row("billing", "http", async () => ({ ok: false, status: 500 }));
      await row("redis", "tcp", async () => { throw new Error("down"); });
      await row("metrics", "http", async () => ({ ok: true, status: 200 }));
    });
    root.append(go, t);
  };

  RUNNERS.win = (root) => {
    root.appendChild(el(`<h3>winpulse</h3><p class="sub">браузер не читает процессы Windows — это живой макет UI. exe берёт Win32. скачай zip.</p>`));
    const bars = document.createElement("div");
    bars.className = "bars";
    const procs = [
      { n: "explorer", cpu: 4 }, { n: "dwm", cpu: 8 }, { n: "WinPulse", cpu: 2 },
      { n: "MsMpEng", cpu: 11 }, { n: "chrome", cpu: 22 }, { n: "csrss", cpu: 1 },
    ];
    function paint() {
      bars.innerHTML = "";
      for (const p of procs) {
        p.cpu = Math.max(0, Math.min(80, p.cpu + (Math.random() * 8 - 4)));
        const row = document.createElement("div");
        row.className = "bar-row";
        row.innerHTML = `<span>${p.n}</span><div class="bar"><i style="width:${p.cpu.toFixed(0)}%"></i></div><span>${p.cpu.toFixed(0)}%</span>`;
        bars.appendChild(row);
      }
    }
    paint();
    const id = setInterval(paint, 700);
    onClose(() => clearInterval(id));
    root.appendChild(bars);
  };

  const HARBOR = {
    "ping the quay": "harborlm demo · backend offline · canned replies only",
    "what model is this?": "tinyllama stand-in. mount a GGUF with compose + fetch-tiny.sh",
    hello: "quay is quiet. local GGUF when compose is up; this is demo.",
    hi: "quay is quiet. local GGUF when compose is up; this is demo.",
    ping: "harborlm demo · backend offline · canned replies only",
  };
  RUNNERS.harbor = (root) => {
    root.appendChild(el(`<h3>harborlm</h3><p class="sub">веса в браузер не влезут. это тот же canned demo, что harborlm.exe chat --demo. GGUF — в zip + compose.</p>`));
    const chat = document.createElement("div");
    chat.className = "chat";
    const inp = document.createElement("input");
    inp.type = "text";
    inp.placeholder = "ping the quay";
    function add(text, who) {
      const b = document.createElement("div");
      b.className = `bubble ${who}`;
      b.textContent = text;
      chat.appendChild(b);
      chat.scrollTop = chat.scrollHeight;
    }
    function reply(q) {
      const key = q.trim().toLowerCase();
      if (HARBOR[key]) return HARBOR[key];
      if (key.includes("model")) return HARBOR["what model is this?"];
      return `demo echo · ${q.trim().slice(0, 240)}`;
    }
    inp.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" || !inp.value.trim()) return;
      const q = inp.value;
      inp.value = "";
      add(q, "me");
      setTimeout(() => add(reply(q), "bot"), 180);
    });
    add("quay is quiet. local GGUF when compose is up; this is demo.", "bot");
    root.append(chat, inp);
  };

  const hash = location.hash.replace("#", "");
  if (hash && APPS.some((a) => a.id === hash)) openApp(hash);
})();
