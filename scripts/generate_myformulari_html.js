// scripts/generate_myformulari_html.js
import fs from 'fs'
import path from 'path'

const ROOT_DIR = process.cwd()
const IMAGES_DIR = path.join(ROOT_DIR, 'docs', 'manuals', 'images')
const OUTPUT_HTML = path.join(ROOT_DIR, 'docs', 'manuals', 'PANDUAN_LENGKAP_PENGGUNA_MYFORMULARI_KKM.html')

function getBase64Image(filename, mime = 'image/png') {
  const p = path.join(IMAGES_DIR, filename)
  if (fs.existsSync(p)) {
    const data = fs.readFileSync(p)
    return `data:${mime};base64,${data.toString('base64')}`
  }
  return ''
}

const b64Jata = getBase64Image('jata_malaysia.png', 'image/png')
const s01 = getBase64Image('01_hub_formulari_submenu.png')
const s02 = getBase64Image('02_formulari_dashboard_search.png')
const s03 = getBase64Image('03_drug_detail_overview.png')
const s04 = getBase64Image('04_drug_detail_pregnancy_safety.png')
const s05 = getBase64Image('05_ham_list_page.png')
const s06 = getBase64Image('06_lasa_list_tallman.png')
const s07 = getBase64Image('07_iv_dilution_protocols.png')
const s08 = getBase64Image('08_nag_antimicrobial_guidelines.png')
const s09 = getBase64Image('09_drug_quota_monitoring.png')
const s10 = getBase64Image('10_drug_alternatives_matrix.png')
const s11 = getBase64Image('11_interaction_checker_modal.png')

const htmlContent = `<!DOCTYPE html>
<html lang="ms">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Panduan Pengguna Rasmi MyFormulari KKM - Hospital Lawas</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
    
    @page {
      size: A4;
      margin: 20mm;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background-color: #f8fafc;
      margin: 0;
      padding: 40px 20px;
    }

    .container {
      max-width: 960px;
      margin: 0 auto;
      background: #ffffff;
      padding: 50px 60px;
      border-radius: 24px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
      border: 1px solid #e2e8f0;
    }

    .cover-header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 30px;
      border-bottom: 2px solid #e2e8f0;
    }

    .jata-logo {
      width: 100px;
      height: auto;
      margin-bottom: 16px;
    }

    .org-title {
      font-size: 16px;
      font-weight: 800;
      color: #1e3a8a;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin: 0 0 4px 0;
    }

    .org-sub {
      font-size: 14px;
      font-weight: 600;
      color: #64748b;
      margin: 0 0 24px 0;
    }

    .doc-type {
      font-size: 13px;
      font-weight: 700;
      color: #7c3aed;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 8px;
    }

    .main-title {
      font-size: 32px;
      font-weight: 900;
      color: #0f172a;
      line-height: 1.2;
      margin: 0 0 12px 0;
    }

    .sub-title {
      font-size: 15px;
      color: #475569;
      max-width: 760px;
      margin: 0 auto;
      font-style: italic;
    }

    .meta-box {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 16px;
      padding: 20px 24px;
      margin: 30px 0;
      font-size: 13.5px;
    }

    .meta-box h4 {
      margin: 0 0 12px 0;
      color: #1e3a8a;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 16px;
    }

    .meta-item strong {
      color: #334155;
    }

    h2 {
      font-size: 22px;
      font-weight: 800;
      color: #1e3a8a;
      border-left: 5px solid #7c3aed;
      padding-left: 12px;
      margin-top: 48px;
      margin-bottom: 18px;
    }

    h3 {
      font-size: 17px;
      font-weight: 700;
      color: #4338ca;
      margin-top: 24px;
      margin-bottom: 12px;
    }

    p, li {
      font-size: 14.5px;
      color: #334155;
    }

    ul, ol {
      padding-left: 24px;
      margin-bottom: 20px;
    }

    li {
      margin-bottom: 8px;
    }

    .callout {
      border-radius: 12px;
      padding: 16px 20px;
      margin: 24px 0;
      font-size: 14px;
    }

    .callout-danger {
      background: #fff1f2;
      border-left: 5px solid #e11d48;
      color: #9f1239;
    }

    .callout-warning {
      background: #fefce8;
      border-left: 5px solid #ca8a04;
      color: #854d0e;
    }

    .callout-success {
      background: #f0fdf4;
      border-left: 5px solid #16a34a;
      color: #166534;
    }

    .callout-info {
      background: #eff6ff;
      border-left: 5px solid #2563eb;
      color: #1e40af;
    }

    .callout-title {
      font-weight: 800;
      margin-bottom: 6px;
      text-transform: uppercase;
      font-size: 12.5px;
      letter-spacing: 0.05em;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 24px 0;
      font-size: 13.5px;
    }

    th {
      background-color: #1e3a8a;
      color: #ffffff;
      font-weight: 700;
      text-align: left;
      padding: 10px 14px;
      border: 1px solid #1e3a8a;
    }

    td {
      padding: 10px 14px;
      border: 1px solid #e2e8f0;
    }

    tr:nth-child(even) {
      background-color: #f8fafc;
    }

    .img-container {
      margin: 28px 0;
      text-align: center;
    }

    .img-container img {
      max-width: 100%;
      height: auto;
      border-radius: 12px;
      border: 1px solid #cbd5e1;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
    }

    .img-caption {
      font-size: 13px;
      color: #475569;
      font-weight: 600;
      font-style: italic;
      margin-top: 8px;
    }

    .sign-table {
      margin-top: 40px;
      border: none;
    }

    .sign-table td {
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      padding: 18px;
      vertical-align: top;
    }

    .sign-title {
      font-weight: 800;
      color: #1e3a8a;
      font-size: 13px;
      margin-bottom: 24px;
    }

    .sign-dots {
      color: #94a3b8;
      margin-bottom: 8px;
    }

    .sign-role {
      font-weight: 700;
      color: #0f172a;
      font-size: 12.5px;
    }

    .sign-dept {
      color: #64748b;
      font-size: 11.5px;
    }

    @media print {
      body {
        background: transparent;
        padding: 0;
      }
      .container {
        border: none;
        box-shadow: none;
        padding: 0;
        max-width: 100%;
      }
    }
  </style>
</head>
<body>

<div class="container">

  <!-- COVER HEADER -->
  <div class="cover-header">
    ${b64Jata ? `<img src="${b64Jata}" class="jata-logo" alt="Jata Negara Malaysia">` : ''}
    <div class="org-title">Kementerian Kesihatan Malaysia</div>
    <div class="org-sub">Hospital Lawas, Sarawak</div>
    <div class="doc-type">Panduan Pengguna Lengkap & Standard Operating Procedure (SOP)</div>
    <h1 class="main-title">MODUL MYFORMULARI (H.O.M.E.)</h1>
    <div class="sub-title">
      Panduan Bergambar 100% Antaramuka Sebenar Sistem: Carian FUKKM, Pengendalian HAM/LASA, Protokol Bancuhan IV, Garis Panduan NAG 2024, dan Kawalan Kuota Hospital
    </div>
  </div>

  <!-- META BOX -->
  <div class="meta-box">
    <h4>Maklumat Kawalan Dokumen & Sistem</h4>
    <div class="meta-grid">
      <div class="meta-item"><strong>Sistem Induk:</strong> Hospital Operation Management Ecosystem (H.O.M.E.)</div>
      <div class="meta-item"><strong>Modul:</strong> MyFormulari (Pengkatalogan & Keselamatan Ubat)</div>
      <div class="meta-item"><strong>Edisi Rujukan:</strong> FUKKM Edisi Ke-4 & NAG 2024</div>
      <div class="meta-item"><strong>Fasiliti:</strong> Jabatan Farmasi & Semua Wad Klinikal, Hospital Lawas</div>
      <div class="meta-item"><strong>Status Tangkapan Skrin:</strong> 100% Antaramuka Sebenar Sistem</div>
      <div class="meta-item"><strong>Sasaran Pengguna:</strong> Pakar Perubatan, Pegawai Perubatan (MO), Pegawai Farmasi, Jururawat, PPP</div>
    </div>
  </div>

  <!-- BAB 1 -->
  <h2>BAB 1: PENGENALAN SISTEM MYFORMULARI</h2>
  <p>
    Modul <strong>MyFormulari</strong> merupakan pusat sehenti klinikal bagi rujukan ubat, keselamatan preskripsi, dan protokol farmaseutikal di bawah Hospital Operation Management Ecosystem (H.O.M.E.) Hospital Lawas. Sistem ini mematuhi sepenuhnya piawaian Formulari Ubat KKM (FUKKM Edisi Ke-4) dan Garis Panduan Keselamatan Ubat Kebangsaan.
  </p>

  <h3>1.1 Objektif Utama Modul</h3>
  <ul>
    <li><strong>Rujukan Rasmi FUKKM:</strong> Menyediakan maklumat ubat rasmi KKM yang tepat, pantas, dan lengkap kepada doktor, ahli farmasi, dan jururawat.</li>
    <li><strong>Keselamatan Pesakit:</strong> Mencegah kesilapan pemberian ubat melalui amaran visual High Alert Medication (HAM) dan huruf TALL-Man bagi Look-Alike Sound-Alike (LASA).</li>
    <li><strong>Kawalan Preskriber:</strong> Memastikan ubat dipreskrib mengikut kategori kuasa yang sah (A*, A, A/KK, B, C, C+).</li>
    <li><strong>Standard Protokol IV:</strong> Menyeragamkan kaedah bancuhan serbuk vial, pelarutan IV, kepekatan maksima sekatan cecair, dan keserasian tiub Y-site.</li>
    <li><strong>Panduan NAG 2024:</strong> Menyokong program Antimicrobial Stewardship (AMS) dengan panduan empirik mengikut sistem badan dan semakan 72 jam.</li>
  </ul>

  <div class="callout callout-danger">
    <div class="callout-title">⚠️ Dasar Keselamatan Hospital Lawas</div>
    Semua anggota klinikal dimestikan membuat semakan dos, laluan, dan keserasian infusi dalam MyFormulari sebelum sebarang ubat suntikan atau berisiko tinggi diberikan kepada pesakit.
  </div>

  <!-- BAB 2 -->
  <h2>BAB 2: NAVIGASI MODULE HUB & SUB-MENU KLINIKAL</h2>
  <p>
    Pengguna boleh mengakses MyFormulari daripada Module Hub utama dengan mengklik kad berlabel "MyFormulari". Sistem akan membuka Sub-Menu Pilihan Modul Klinikal yang membahagikan ciri-ciri utama kepada 7 kad fungsi khusus:
  </p>
  <ul>
    <li><strong>Carian & Pengkatalogan Formulari:</strong> Carian menyeluruh mengikut nama generik, jenama, kod ATC, indikasi, dan kategori preskriber.</li>
    <li><strong>Senarai Ubat Berisiko Tinggi (HAM):</strong> Daftar ubat berisiko tinggi beserta SOP Semakan Berganda (IDC).</li>
    <li><strong>Daftar Ubat LASA & TALL-Man:</strong> Senarai pasangan ubat rupa serupa / bunyi serupa dengan penonjolan huruf TALL-man.</li>
    <li><strong>Pusat Protokol Rekonstitusi & Pelarutan IV:</strong> Panduan bancuhan aseptik, pelarut yang serasi, kepekatan maksima sekatan cecair, dan keserasian Y-site.</li>
    <li><strong>Garis Panduan Antimikrobial (NAG 2024):</strong> Rejimen empirik lini pertama & kedua mengikut sistem badan dan kriteria tukar IV-ke-Oral.</li>
    <li><strong>Pemantauan Kuota & Amaran Stok:</strong> Pengesanan baki kuota bulanan fasiliti dan amaran stok rendah.</li>
    <li><strong>Matriks Ubat Alternatif:</strong> Matriks ubat pengganti setara kelas semasa ketiadaan stok.</li>
  </ul>

  <div class="img-container">
    <img src="${s01}" alt="Sub-Menu MyFormulari di Module Hub">
    <div class="img-caption">Paparan Sebenar Sistem: Sub-Menu MyFormulari di Module Hub — Menampilkan 4 Kad Metrik Utama dan 7 Pilihan Sub-Modul Klinikal</div>
  </div>

  <!-- BAB 3 -->
  <h2>BAB 3: PAPAN PEMUKA CARIAN & PENAPISAN FUKKM</h2>
  <p>
    Halaman Papan Pemuka Carian (<code>/formulari/dashboard</code>) membolehkan anggota klinikal mencari dan menapis lebih 1,420 ubat berdaftar dengan pantas.
  </p>
  <h3>3.1 Panduan Penggunaan Bar Carian & Penapis</h3>
  <ol>
    <li><strong>Kotak Carian Pintar:</strong> Taip mana-mana nama generik (contoh: "ceftriaxone", "amoxicillin", "furosemide") atau nama jenama dagang.</li>
    <li><strong>Penapis Preskriber:</strong> Pilih kategori preskriber yang diingini (SEMUA, A*, A, A/KK, B, C, C+) untuk menyaring kelayakan preskripsi.</li>
    <li><strong>Suis Penapis Keselamatan:</strong> Tandakan penapis khas untuk melihat ubat HAM sahaja, ubat LASA sahaja, antibiotik NAG sahaja, atau ubat yang berstatus stok rendah.</li>
    <li><strong>Suis Mod Paparan (Table / Grid):</strong> Klik butang ikon di penjuru kanan atas untuk bertukar antara paparan jadual data atau grid kad visual.</li>
  </ol>

  <table>
    <thead>
      <tr>
        <th style="width: 12%;">Kategori</th>
        <th style="width: 38%;">Pangkat / Kelayakan Preskriber</th>
        <th style="width: 28%;">Tahap Kawalan</th>
        <th style="width: 22%;">Contoh Ubat</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>A*</strong></td>
        <td>Pakar Perunding Kanan / Sub-Kepakaran</td>
        <td>Kawalan Tertinggi (Specialist Only)</td>
        <td>Meropenem, Linezolid, Chemotherapy</td>
      </tr>
      <tr>
        <td><strong>A</strong></td>
        <td>Semua Pegawai Perubatan Pakar</td>
        <td>Kawalan Pakar Disiplin</td>
        <td>Ceftriaxone, Enoxaparin, Amiodarone</td>
      </tr>
      <tr>
        <td><strong>A/KK</strong></td>
        <td>Pakar Hospital & Pakar Family Medicine (FMS)</td>
        <td>Pakar Hospital & Klinik Kesihatan</td>
        <td>Insulin Glargine, Telmisartan</td>
      </tr>
      <tr>
        <td><strong>B</strong></td>
        <td>Semua Pegawai Perubatan (MO)</td>
        <td>Preskripsi Am Doktor</td>
        <td>Amoxicillin/Clav, Metformin, Amlodipine</td>
      </tr>
      <tr>
        <td><strong>C</strong></td>
        <td>Pegawai Perubatan, PPP & Jururawat</td>
        <td>Rawatan Asas / Dispensari</td>
        <td>Paracetamol, ORS, Chlorpheniramine</td>
      </tr>
      <tr>
        <td><strong>C+</strong></td>
        <td>Penggunaan Protokol Kecemasan Khas</td>
        <td>Kecemasan / Kebenaran Khas</td>
        <td>Adrenaline (Anafilaksis), IV Normal Saline</td>
      </tr>
    </tbody>
  </table>

  <div class="img-container">
    <img src="${s02}" alt="Papan Pemuka Carian & Senarai Formulari">
    <div class="img-caption">Paparan Sebenar Sistem: Papan Pemuka Carian & Pengkatalogan Formulari Ubat (FUKKM Edisi Ke-4) Hospital Lawas</div>
  </div>

  <!-- BAB 4 -->
  <h2>BAB 4: MONOGRAF KLINIKAL UBAT TERPERINCI</h2>
  <p>
    Mengklik mana-mana ubat akan membuka Monograf Klinikal Lengkap (<code>/formulari/drug/:id</code>). Monograf ini disusun secara sistematik ke dalam 8 tab interaktif.
  </p>

  <div class="img-container">
    <img src="${s03}" alt="Monograf Ceftriaxone">
    <div class="img-caption">Paparan Sebenar Sistem: Monograf Klinikal Ubat (Ceftriaxone Sodium 1g Injection) — Tab Ringkasan, Indikasi & Kategori Preskriber</div>
  </div>

  <h3>4.1 Panduan Keselamatan Kehamilan & Penyusuan Ibu</h3>
  <p>
    Tab Kehamilan & Penyusuan memberikan status Crystal Clear (BOLEH / WASPADA / DILARANG) bagi mengelakkan risiko teratogenik kepada janin dan bayi:
  </p>

  <div class="img-container">
    <img src="${s04}" alt="Tab Kehamilan & Penyusuan">
    <div class="img-caption">Paparan Sebenar Sistem: Tab Kehamilan & Penyusuan — Status Keselamatan Trimester, Nasihat Pemantauan Bayi & Alternatif Selamat</div>
  </div>

  <!-- BAB 5 -->
  <h2>BAB 5: PENGENDALIAN UBAT BERISIKO TINGGI (HAM)</h2>
  <p>
    Halaman Senarai Ubat Berisiko Tinggi (<code>/formulari/ham</code>) menyenaraikan semua ubat yang memerlukan kawalan rapi bagi mengelakkan kemudaratan maut kepada pesakit.
  </p>

  <div class="img-container">
    <img src="${s05}" alt="Senarai Ubat Berisiko Tinggi HAM">
    <div class="img-caption">Paparan Sebenar Sistem: Halaman Senarai Ubat Berisiko Tinggi (HAM) — Menampilkan 4 Prinsip Keselamatan KKM & Daftar Ubat</div>
  </div>

  <!-- BAB 6 -->
  <h2>BAB 6: DAFTAR UBAT LASA & PROTOKOL TALL-MAN LETTERING</h2>
  <p>
    Halaman Daftar Ubat LASA (<code>/formulari/lasa</code>) memaparkan pasangan ubat rupa serupa / bunyi serupa dengan penonjolan huruf TALL-man untuk mengelakkan kesilapan pendispensan di farmasi dan wad.
  </p>

  <div class="img-container">
    <img src="${s06}" alt="Daftar Ubat LASA & TALL-Man">
    <div class="img-caption">Paparan Sebenar Sistem: Daftar Pasangan Ubat LASA & Panduan Huruf TALL-Man Lettering KKM</div>
  </div>

  <!-- BAB 7 -->
  <h2>BAB 7: PUSAT PROTOKOL REKONSTITUSI & PELARUTAN IV</h2>
  <p>
    Halaman Protokol Pelarutan IV (<code>/formulari/dilution</code>) menyediakan rujukan lengkap bancuhan ubat suntikan aseptik, pelarut serasi, isipadu sesaran serbuk, dan keserasian tiub Y-site.
  </p>

  <div class="img-container">
    <img src="${s07}" alt="Protokol Pelarutan IV">
    <div class="img-caption">Paparan Sebenar Sistem: Pusat Protokol Rekonstitusi, Pelarutan IV & Keserasian Y-Site</div>
  </div>

  <!-- BAB 8 -->
  <h2>BAB 8: GARIS PANDUAN ANTIMIKROBIAL KEBANGSAAN (NAG 2024)</h2>
  <p>
    Halaman Garis Panduan NAG (<code>/formulari/antimicrobial</code>) memaparkan rejimen empirik mengikut sistem badan (Respiratori, Urinari, Kulit, CNS, Intra-Abdominal, Sepsis, Profilaksis Surgeri SAP) dan protokol semakan 72 jam AMS.
  </p>

  <div class="img-container">
    <img src="${s08}" alt="Garis Panduan NAG 2024">
    <div class="img-caption">Paparan Sebenar Sistem: Garis Panduan Antimikrobial Kebangsaan (NAG 2024) Mengikut Sistem Badan</div>
  </div>

  <!-- BAB 9 -->
  <h2>BAB 9: PEMANTAUAN KUOTA FASILITI & AMARAN STOK</h2>
  <p>
    Halaman Pemantauan Kuota (<code>/formulari/quota</code>) membolehkan pihak farmasi menjejak peratusan penggunaan kuota bulanan, paras amaran stok rendah, serta unjuran baki hari sebelum stok habis.
  </p>

  <div class="img-container">
    <img src="${s09}" alt="Pemantauan Kuota Ubat">
    <div class="img-caption">Paparan Sebenar Sistem: Halaman Pemantauan Kuota Bulanan Fasiliti & Amaran Stok Rendah</div>
  </div>

  <!-- BAB 10 -->
  <h2>BAB 10: MATRIKS UBAT ALTERNATIF & SEMAKAN INTERAKSI</h2>
  <p>
    Halaman Matriks Ubat Alternatif (<code>/formulari/alternatives</code>) menyarankan ubat pengganti setara terapeutik yang diluluskan KKM semasa berlaku gangguan bekalan.
  </p>

  <div class="img-container">
    <img src="${s10}" alt="Matriks Ubat Alternatif">
    <div class="img-caption">Paparan Sebenar Sistem: Matriks Ubat Alternatif & Cadangan Penggantian Terapeutik KKM</div>
  </div>

  <h3>10.1 Alat Semak Interaksi Ubat (Drug Interaction Modal)</h3>
  <div class="img-container">
    <img src="${s11}" alt="Semak Interaksi Ubat Modal">
    <div class="img-caption">Paparan Sebenar Sistem: Modal Semakan Interaksi Ubat — Mengesan Interaksi Ubat Berbahaya Secara Automatik</div>
  </div>

  <!-- SIGNATURE BLOCKS -->
  <h2>PENGESAHAN & KELULUSAN DOKUMEN</h2>
  <table class="sign-table">
    <tr>
      <td style="width: 33.3%;">
        <div class="sign-title">Disediakan Oleh:</div>
        <div class="sign-dots">...................................................</div>
        <div class="sign-role">PEGAWAI FARMASI KLINIKAL (UF48/UF52)</div>
        <div class="sign-dept">Jabatan Farmasi, Hospital Lawas</div>
      </td>
      <td style="width: 33.3%;">
        <div class="sign-title">Disemak & Disahkan Oleh:</div>
        <div class="sign-dots">...................................................</div>
        <div class="sign-role">KETUA UNIT FARMASI (UF54)</div>
        <div class="sign-dept">Hospital Lawas, Sarawak</div>
      </td>
      <td style="width: 33.3%;">
        <div class="sign-title">Diluluskan Oleh:</div>
        <div class="sign-dots">...................................................</div>
        <div class="sign-role">PENGARAH HOSPITAL (GRED UTAMA/UD54)</div>
        <div class="sign-dept">Hospital Lawas, Sarawak</div>
      </td>
    </tr>
  </table>

</div>

</body>
</html>
`

fs.writeFileSync(OUTPUT_HTML, htmlContent, 'utf-8')
console.log(`HTML manual with real screenshots successfully generated at: ${OUTPUT_HTML} (${htmlContent.length} bytes)`)
