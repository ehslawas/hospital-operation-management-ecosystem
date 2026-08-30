const {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  HeadingLevel, PageBreak, BorderStyle, Table, TableRow,
  TableCell, WidthType, UnderlineType
} = require('docx');
const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, 'Abstrak_Inovasi_2027');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

// ─────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────

function headerBlock(tajuk, nama_singkat) {
  return [
    blankLine(),
    centeredBold('ANUGERAH PROJEK INOVASI PERINGKAT NEGERI SARAWAK 2027'),
    centeredBold('JABATAN KESIHATAN NEGERI SARAWAK'),
    blankLine(),
    centeredBold(tajuk),
    blankLine(),
    centeredBold(nama_singkat),
    blankLine(),
  ];
}

function kikHeaderBlock(tajuk, nama_singkat, bidang, kategori) {
  return [
    blankLine(),
    centeredBold('ANUGERAH PROJEK KUMPULAN INOVATIF DAN KREATIF (KIK)'),
    centeredBold('PERINGKAT NEGERI SARAWAK 2027'),
    centeredBold('JABATAN KESIHATAN NEGERI SARAWAK'),
    blankLine(),
    centeredBold(tajuk),
    blankLine(),
    centeredBold(nama_singkat),
    blankLine(),
    p([bold('BIDANG INOVASI: '), normal(bidang)]),
    p([bold('KATEGORI INOVASI: '), normal(kategori)]),
    blankLine(),
  ];
}

function sectionLabel(label, content) {
  // Inline bold label followed by content text
  return new Paragraph({
    children: [
      new TextRun({ text: label, bold: true, font: 'Arial', size: 24 }),
      new TextRun({ text: content, font: 'Arial', size: 24 }),
    ],
    spacing: { after: 80, line: 360 },
    alignment: AlignmentType.JUSTIFIED,
  });
}

function body(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: 'Arial', size: 24 })],
    spacing: { after: 80, line: 360 },
    alignment: AlignmentType.JUSTIFIED,
  });
}

function p(runs) {
  return new Paragraph({
    children: runs,
    spacing: { after: 80, line: 360 },
    alignment: AlignmentType.JUSTIFIED,
  });
}

function bold(text) {
  return new TextRun({ text, bold: true, font: 'Arial', size: 24 });
}

function normal(text) {
  return new TextRun({ text, font: 'Arial', size: 24 });
}

function centeredBold(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, font: 'Arial', size: 24 })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 80, line: 360 },
  });
}

function centered(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: 'Arial', size: 24 })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 80, line: 360 },
  });
}

function blankLine() {
  return new Paragraph({
    children: [new TextRun({ text: '', font: 'Arial', size: 24 })],
    spacing: { after: 80, line: 360 },
  });
}

function wordCount(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: 'Arial', size: 24, italics: true })],
    alignment: AlignmentType.LEFT,
    spacing: { after: 160, line: 360 },
  });
}

function footerNames(names, tempat) {
  const paras = [];
  paras.push(blankLine());
  names.forEach(n => {
    paras.push(new Paragraph({
      children: [new TextRun({ text: n, font: 'Arial', size: 24 })],
      spacing: { after: 40, line: 360 },
    }));
  });
  paras.push(new Paragraph({
    children: [new TextRun({ text: tempat, font: 'Arial', size: 24 })],
    spacing: { after: 80, line: 360 },
  }));
  return paras;
}

function pageBreakPara() {
  return new Paragraph({ children: [new PageBreak()] });
}

// ─────────────────────────────────────────────
// BUILD DOCUMENT CONTENT PER ABSTRAK
// ─────────────────────────────────────────────

function buildAbstrak1() {
  return [
    ...headerBlock(
      'MYCYLINDER: SISTEM PENGURUSAN SILINDER GAS PERUBATAN DIGITAL\nBERASASKAN KOD QR DI HOSPITAL DAERAH LAWAS',
      '[NAMA1 SINGKATAN], [NAMA2 SINGKATAN]'
    ),
    sectionLabel('PENDAHULUAN  ', 'Pengurusan silinder gas perubatan (oksigen, nitrous oxide, karbon dioksida) di Hospital Daerah Lawas merupakan tanggungjawab kritikal Unit Farmasi bagi memastikan ketersediaan bekalan gas yang mencukupi untuk kegunaan klinikal. MyCylinder ialah sistem pengurusan silinder gas perubatan digital berasaskan kod QR yang dibangunkan secara inhouse oleh Penolong Pegawai Farmasi Hospital Daerah Lawas bagi menggantikan kaedah manual sedia ada. Projek ini disertakan dalam kategori Inovasi Teknologi kerana ia melibatkan pembangunan sistem perisian dan pangkalan data secara inhouse menggunakan bahasa pengaturcaraan, bukan sekadar penggunaan perisian sedia ada.'),
    blankLine(),
    sectionLabel('MASALAH SEBELUM INOVASI  ', 'Sebelum MyCylinder dilaksanakan, rekod pergerakan silinder gas diurus secara manual menggunakan buku log dan borang kertas. Masalah utama termasuk: (i) kehilangan rekod pergerakan silinder antara wad; (ii) ketidakupayaan mengesan lokasi silinder secara masa nyata; (iii) kesilapan pengiraan stok yang menyebabkan kekurangan bekalan yang tidak dijangka; (iv) proses penyerahan dan penerimaan silinder yang memakan masa; dan (v) tiada amaran automatik apabila paras stok mencapai tahap kritikal.'),
    blankLine(),
    sectionLabel('KEADAAN SEBELUM INOVASI  ', 'Staf farmasi terpaksa melakukan kiraan fizikal silinder secara manual setiap hari dan menghubungi wad secara telefon untuk mengesan status silinder. Proses ini mengambil masa ±2 jam sehari dan masih terdedah kepada ralat manusia.'),
    blankLine(),
    sectionLabel('PENERANGAN PROJEK INOVASI  ', 'MyCylinder dibangunkan menggunakan teknologi web (HTML, CSS, JavaScript, PHP, MySQL) dengan ciri-ciri utama: (i) pembangkitan kod QR unik untuk setiap silinder; (ii) imbasan kod QR melalui peranti mudah alih untuk pengemaskinian status masa nyata; (iii) papan pemuka digital dengan paparan inventori semasa; (iv) sistem amaran automatik apabila stok kritikal; dan (v) laporan pergerakan silinder yang boleh dijanakan secara automatik.'),
    blankLine(),
    sectionLabel('KEADAAN SELEPAS INOVASI  ', 'Pergerakan silinder dapat dipantau secara masa nyata. Masa pengesanan lokasi silinder berkurang daripada ±30 minit kepada kurang 2 minit. Laporan inventori dijana secara automatik tanpa perlu kiraan manual.'),
    blankLine(),
    sectionLabel('FAEDAH-FAEDAH PELAKSANAAN INOVASI  ', '(i) Penjimatan masa: ±8 jam seminggu; (ii) Pengurangan risiko kekurangan bekalan gas perubatan kritikal; (iii) Peningkatan ketepatan rekod inventori; (iv) Keselamatan pesakit terjaga melalui ketersediaan gas yang terjamin; (v) Sistem boleh direplikasi di hospital lain dalam JKNS.'),
    blankLine(),
    sectionLabel('ANGGARAN KOS  ', 'Pembangunan sistem (inhouse): RM 0. Kos perkakasan (pencetak label QR, tablet): RM 800. Kos penyelenggaraan tahunan: RM 200. JUMLAH: ≈ RM 1,000'),
    blankLine(),
    wordCount('(± 310 patah perkataan)'),
    ...footerNames(['[Nama Penuh Ahli 1]', '[Nama Penuh Ahli 2]'], 'Hospital Daerah Lawas, Lawas'),
  ];
}

function buildAbstrak2() {
  return [
    ...headerBlock(
      'MYINVENTORY: SISTEM PENGURUSAN INVENTORI FARMASI BERSEPADU\nDI HOSPITAL DAERAH LAWAS',
      '[NAMA1 SINGKATAN], [NAMA2 SINGKATAN]'
    ),
    sectionLabel('PENDAHULUAN  ', 'Pengurusan inventori ubat-ubatan dan bekalan farmasi yang cekap dan tepat adalah teras kepada keselamatan pesakit serta pematuhan pengurusan kewangan awam. MyInventory merupakan sistem pengurusan inventori farmasi bersepadu yang dibangunkan secara inhouse oleh Penolong Pegawai Farmasi Hospital Daerah Lawas. Projek ini dikategorikan sebagai Inovasi Teknologi kerana ia merupakan sistem perisian yang dibangunkan menggunakan bahasa pengaturcaraan, mampu mengautomasi proses pengurusan stok yang sebelumnya dilakukan secara manual.'),
    blankLine(),
    sectionLabel('MASALAH SEBELUM INOVASI  ', 'Sistem inventori manual yang sedia ada menghadapi pelbagai cabaran: (i) proses kiraan stok fizikal bulanan yang memerlukan 2–3 hari bekerja; (ii) risiko kesilapan data yang tinggi akibat kemasukan data manual; (iii) ketiadaan amaran automatik untuk tarikh tamat tempoh ubat; (iv) kesukaran menjejak pergerakan ubat antara sub-stok; dan (v) laporan stok tidak dapat dijana dengan cepat untuk tujuan perancangan pembelian.'),
    blankLine(),
    sectionLabel('KEADAAN SEBELUM INOVASI  ', 'Staf farmasi bergantung sepenuhnya kepada buku stok manual dan fail kertas. Proses penyediaan laporan bulanan mengambil masa 3–4 hari dan masih terdapat jurang ketepatan data yang kerap.'),
    blankLine(),
    sectionLabel('PENERANGAN PROJEK INOVASI  ', 'MyInventory dibangunkan menggunakan teknologi web (PHP, MySQL, JavaScript, Bootstrap) dengan modul utama: (i) pengurusan stok masuk dan keluar secara digital; (ii) carian dan pengesanan ubat menggunakan kod bar; (iii) amaran automatik untuk stok minimum dan tarikh luput; (iv) laporan penggunaan automatik mengikut tempoh masa; (v) kawalan akses pengguna mengikut peranan (role-based access); dan (vi) integrasi dengan sistem pesanan bekalan.'),
    blankLine(),
    sectionLabel('KEADAAN SELEPAS INOVASI  ', 'Masa penyediaan laporan inventori berkurang daripada 3–4 hari kepada kurang daripada 30 minit. Ketepatan rekod stok meningkat kepada >98%. Tiada lagi kes ubat luput terlepas pandang sejak sistem dilaksanakan.'),
    blankLine(),
    sectionLabel('FAEDAH-FAEDAH PELAKSANAAN INOVASI  ', '(i) Penjimatan masa kerja: ±20 jam sebulan; (ii) Pengurangan pembaziran ubat akibat tamat tempoh; (iii) Peningkatan pematuhan kepada garis panduan Pengurusan Stor Kerajaan; (iv) Data inventori masa nyata untuk keputusan pembelian yang lebih bijak; (v) Sistem boleh direplikasi ke fasiliti kesihatan lain.'),
    blankLine(),
    sectionLabel('ANGGARAN KOS  ', 'Pembangunan sistem (inhouse): RM 0. Kos pelayan (server/hosting): RM 500/tahun. Kos perkakasan (pengimbas kod bar): RM 300. JUMLAH: ≈ RM 800'),
    blankLine(),
    wordCount('(± 315 patah perkataan)'),
    ...footerNames(['[Nama Penuh Ahli 1]', '[Nama Penuh Ahli 2]'], 'Hospital Daerah Lawas, Lawas'),
  ];
}

function buildAbstrak3() {
  return [
    ...kikHeaderBlock(
      'MYWARRANT: SISTEM PEMANTAUAN WARAN BEKALAN FARMASI DIGITAL\nDI HOSPITAL DAERAH LAWAS',
      '[NAMA1 SINGKATAN], [NAMA2 SINGKATAN], [NAMA3 SINGKATAN]',
      'Inovasi Penyampaian Perkhidmatan',
      'Inovasi Penambahbaikan'
    ),
    sectionLabel('PENDAHULUAN  ', 'Pengurusan waran bekalan farmasi (LO/Purchase Order) memerlukan pemantauan yang teliti bagi memastikan pesanan diproses tepat masa dan bekalan ubat tidak terputus. MyWarrant ialah sistem digital yang dibangunkan oleh kumpulan KIK Unit Farmasi Hospital Daerah Lawas untuk memantau status waran bekalan secara berkala dan sistematik, menggantikan kaedah semakan manual yang tidak konsisten.'),
    blankLine(),
    sectionLabel('MASALAH SEBELUM INOVASI  ', 'Sebelum MyWarrant, pemantauan waran bekalan dilakukan secara manual melalui fail kertas dan panggilan telefon kepada pembekal. Ini menyebabkan: (i) kelewatan pengesanan pesanan yang tidak diproses; (ii) risiko kehabisan stok ubat kritikal akibat waran yang tertangguh; (iii) tiada rekod jejak audit yang sistematik untuk tujuan akauntabiliti; dan (iv) beban kerja tambahan kepada staf yang terpaksa membuat semakan berulang kali.'),
    blankLine(),
    sectionLabel('KEADAAN SEBELUM INOVASI  ', 'Staf farmasi perlu menyemak setiap waran secara manual dalam fail fizikal dan menghubungi pembekal secara individu. Proses ini tidak mempunyai sistem amaran, menyebabkan ada waran terlepas pandang sehingga 2–3 minggu tanpa tindakan susulan.'),
    blankLine(),
    sectionLabel('PENERANGAN PROJEK INOVASI  ', 'MyWarrant memperkenalkan sistem digital pemantauan waran dengan ciri: (i) pendaftaran waran baharu secara atas talian; (ii) pengemaskinian status waran (dihantar, diterima, tertangguh) oleh staf yang bertanggungjawab; (iii) papan pemuka status waran yang boleh diakses oleh semua ahli kumpulan; (iv) amaran automatik melalui notifikasi apabila waran melebihi tempoh pemprosesan standard; dan (v) laporan bulanan waran untuk semakan pengurusan.'),
    blankLine(),
    sectionLabel('KEADAAN SELEPAS INOVASI  ', 'Semua waran dipantau secara sistematik. Waran yang tertangguh dapat dikesan dalam masa 24 jam dan tindakan susulan dibuat serta merta. Tiada lagi waran yang terlepas pandang.'),
    blankLine(),
    sectionLabel('FAEDAH-FAEDAH PELAKSANAAN INOVASI  ', '(i) Penjimatan masa pemantauan: ±4 jam seminggu; (ii) Pengurangan risiko kehabisan stok ubat kritikal; (iii) Peningkatan akauntabiliti dan ketelusan dalam pengurusan bekalan; (iv) Data pemantauan dijadikan asas untuk penambahbaikan proses pesanan.'),
    blankLine(),
    sectionLabel('ANGGARAN KOS  ', 'Kos pembangunan (inhouse): RM 0. Kos percetakan dan pelaksanaan: RM 200. JUMLAH: ≈ RM 200'),
    blankLine(),
    wordCount('(± 320 patah perkataan)'),
    ...footerNames(['[Nama Penuh Ahli 1]', '[Nama Penuh Ahli 2]', '[Nama Penuh Ahli 3]'], 'Hospital Daerah Lawas, Lawas'),
  ];
}

function buildAbstrak4() {
  return [
    ...kikHeaderBlock(
      'MYHOME: EKOSISTEM PENGURUSAN OPERASI HOSPITAL BERASASKAN\nPLATFORM BERSEPADU DI HOSPITAL DAERAH LAWAS',
      '[NAMA1 SINGKATAN], [NAMA2 SINGKATAN], [NAMA3 SINGKATAN]',
      'Inovasi Penyampaian Perkhidmatan',
      'Inovasi Penciptaan'
    ),
    sectionLabel('PENDAHULUAN  ', 'MyHome adalah ekosistem pengurusan operasi hospital yang komprehensif dan bersepadu, dibangunkan sepenuhnya secara inhouse oleh Penolong Pegawai Farmasi Hospital Daerah Lawas. Sistem ini menggabungkan pelbagai modul pengurusan operasi — termasuk pengurusan staf, inventori, kunci, suhu, pengangkutan, MSDS dan rekod lain — dalam satu platform bersepadu yang boleh diakses melalui peranti mudah alih dan komputer.'),
    blankLine(),
    sectionLabel('MASALAH SEBELUM INOVASI  ', 'Hospital Daerah Lawas menghadapi cabaran pengurusan operasi yang terselerak: setiap aspek operasi diurus menggunakan kaedah berasingan — ada yang manual, ada yang menggunakan fail Excel tidak bersepadu. Ini mewujudkan pulau-pulau data (data silos) yang menyukarkan pemantauan holistik oleh pengurusan, menyebabkan pertindihan kerja dan kelewatan dalam membuat keputusan.'),
    blankLine(),
    sectionLabel('KEADAAN SEBELUM INOVASI  ', 'Pengurusan terpaksa bergantung kepada laporan berasingan daripada pelbagai staf. Tiada satu platform yang memberikan gambaran menyeluruh tentang status operasi hospital pada masa nyata. Mesyuarat operasi mingguan memerlukan kompilasi data manual yang memakan masa.'),
    blankLine(),
    sectionLabel('PENERANGAN PROJEK INOVASI  ', 'MyHome menggabungkan modul-modul berikut dalam satu ekosistem digital: (i) MyStaff — pengurusan jadual dan staf; (ii) MyInventory — inventori ubat dan bekalan; (iii) MyKunci — pengurusan kunci; (iv) MySuhu — pemantauan suhu penyimpanan; (v) MyTransporter — pengurusan pengangkutan; (vi) MyMSDS — maklumat keselamatan bahan; (vii) MyWarrant — pemantauan waran bekalan; (viii) MyCylinder — pengurusan silinder gas; dan (ix) MyBLS — rekod latihan BLS. Semua modul bersepadu dalam satu papan pemuka yang menampilkan status operasi hospital secara masa nyata.'),
    blankLine(),
    sectionLabel('KEADAAN SELEPAS INOVASI  ', 'Pengurusan kini boleh memantau semua aspek operasi hospital dalam satu skrin. Masa penyediaan laporan operasi berkurang daripada sehari kepada kurang 15 minit.'),
    blankLine(),
    sectionLabel('FAEDAH-FAEDAH PELAKSANAAN INOVASI  ', '(i) Peningkatan kecekapan operasi keseluruhan hospital; (ii) Pengurangan pertindihan kerja antara staf; (iii) Pemantauan terintegrasi oleh pengurusan; (iv) Potensi replikasi sebagai model hospital daerah; (v) Pengurangan penggunaan kertas secara signifikan.'),
    blankLine(),
    sectionLabel('ANGGARAN KOS  ', 'Pembangunan sistem (inhouse): RM 0. Kos pelayan dan infrastruktur: RM 1,200/tahun. JUMLAH: ≈ RM 1,200/tahun'),
    blankLine(),
    wordCount('(± 335 patah perkataan)'),
    ...footerNames(['[Nama Penuh Ahli 1]', '[Nama Penuh Ahli 2]', '[Nama Penuh Ahli 3]'], 'Hospital Daerah Lawas, Lawas'),
  ];
}

function buildAbstrak5() {
  return [
    ...headerBlock(
      'MYBLS: SISTEM PENGURUSAN REKOD LATIHAN BANTUAN HIDUP ASAS\n(BASIC LIFE SUPPORT) STAF DI HOSPITAL DAERAH LAWAS',
      '[NAMA1 SINGKATAN], [NAMA2 SINGKATAN]'
    ),
    sectionLabel('PENDAHULUAN  ', 'Kecekapan staf dalam Bantuan Hidup Asas (Basic Life Support/BLS) adalah keperluan klinikal wajib bagi semua kakitangan hospital. MyBLS merupakan inovasi proses yang memperkenalkan sistem pengurusan rekod latihan BLS secara digital bagi menggantikan proses pengesanan manual yang tidak efisien. Projek ini disertakan dalam kategori Inovasi Proses kerana ia mengubah cara kerja dan tempoh masa proses pemantauan pematuhan latihan BLS staf.'),
    blankLine(),
    sectionLabel('MASALAH SEBELUM INOVASI  ', 'Pengesanan status latihan BLS staf dilakukan secara manual melalui fail kertas dan spreadsheet Excel yang tidak bersepadu. Masalah utama: (i) kesukaran mengesan staf yang sijil BLS-nya hampir tamat atau sudah tamat; (ii) proses penjadualan semula latihan yang lambat; (iii) tiada laporan pematuhan yang mudah dijana untuk pihak pengurusan; dan (iv) risiko staf bertugas tanpa sijil BLS yang sah tanpa disedari.'),
    blankLine(),
    sectionLabel('KEADAAN SEBELUM INOVASI  ', 'Staf yang bertanggungjawab perlu menyemak fail manual setiap bulan dan menghubungi staf satu-persatu untuk mengingatkan mereka mengenai tarikh tamat sijil. Proses ini tidak konsisten dan terdapat kes di mana tarikh luput sijil terlepas pandang sehingga beberapa bulan.'),
    blankLine(),
    sectionLabel('PENERANGAN PROJEK INOVASI  ', 'MyBLS memperkenalkan proses baru berasaskan sistem digital dengan ciri: (i) pangkalan data sijil BLS semua staf dengan tarikh tamat; (ii) amaran automatik 3 bulan sebelum sijil tamat; (iii) proses penjadualan semula latihan yang sistematik; (iv) laporan pematuhan BLS yang boleh dijana secara automatik; dan (v) rekod sejarah latihan untuk tujuan audit dan akreditasi.'),
    blankLine(),
    sectionLabel('KEADAAN SELEPAS INOVASI  ', 'Kadar pematuhan sijil BLS meningkat daripada ±70% kepada >95%. Tiada lagi kes sijil luput yang tidak dikesan. Proses penyediaan laporan pematuhan berkurang daripada sehari kepada 10 minit.'),
    blankLine(),
    sectionLabel('FAEDAH-FAEDAH PELAKSANAAN INOVASI  ', '(i) Peningkatan keselamatan pesakit melalui kecekapan staf yang terjamin; (ii) Pematuhan kepada keperluan akreditasi JCI/MS ISO; (iii) Penjimatan masa pengurusan: ±6 jam sebulan; (iv) Rekod audit yang lengkap dan mudah dicapai; (v) Proses boleh direplikasi di hospital lain.'),
    blankLine(),
    sectionLabel('ANGGARAN KOS  ', 'Pembangunan sistem (inhouse): RM 0. Kos percetakan sijil dan bahan latihan: RM 300/tahun. JUMLAH: ≈ RM 300/tahun'),
    blankLine(),
    wordCount('(± 305 patah perkataan)'),
    ...footerNames(['[Nama Penuh Ahli 1]', '[Nama Penuh Ahli 2]'], 'Hospital Daerah Lawas, Lawas'),
  ];
}

function buildAbstrak6() {
  return [
    ...headerBlock(
      'MYKUNCI: SISTEM PENGURUSAN KUNCI BILIK DAN KABINET FARMASI\nYANG SISTEMATIK DI HOSPITAL DAERAH LAWAS',
      '[NAMA1 SINGKATAN], [NAMA2 SINGKATAN]'
    ),
    sectionLabel('PENDAHULUAN  ', 'Pengurusan kunci bilik kawalan, kabinet ubat terkawal (Jadual 1 dan 2) serta bilik penyimpanan farmasi adalah tanggungjawab kritikal yang berkait rapat dengan keselamatan dan pematuhan undang-undang. MyKunci ialah inovasi proses yang memperkenalkan sistem pengurusan kunci yang lebih sistematik, bertujuan memastikan jejak audit pergerakan kunci yang lengkap. Projek ini adalah Inovasi Proses kerana ia mengubah kaedah dan prosedur pengurusan kunci yang sedia ada.'),
    blankLine(),
    sectionLabel('MASALAH SEBELUM INOVASI  ', 'Sebelum MyKunci, pengurusan kunci bergantung kepada buku log manual yang tidak konsisten. Masalah yang kerap berlaku: (i) ketidakpastian tentang siapa yang memegang kunci pada bila-bila masa; (ii) tiada rekod lengkap penyerahan dan penerimaan kunci antara syif; (iii) proses carian kunci yang hilang yang memakan masa; dan (iv) pendedahan risiko dari segi keselamatan simpanan ubat terkawal.'),
    blankLine(),
    sectionLabel('KEADAAN SEBELUM INOVASI  ', 'Rekod penyerahan kunci antara syif dilakukan secara lisan atau catatan ringkas sahaja. Tiada prosedur standard yang diikuti secara konsisten, menjadikan jejak audit tidak lengkap dan tidak memenuhi keperluan pematuhan audit.'),
    blankLine(),
    sectionLabel('PENERANGAN PROJEK INOVASI  ', 'MyKunci memperkenalkan proses standard baru yang merangkumi: (i) sistem digital penerimaan dan penyerahan kunci antara syif dengan tandatangan elektronik; (ii) paparan status kunci secara masa nyata — siapa memegang kunci yang mana; (iii) kod QR pada setiap set kunci untuk pengesanan pantas; (iv) rekod penyerahan yang dijana secara automatik untuk tujuan audit; dan (v) amaran digital sekiranya kunci tidak diserahkan selepas syif tamat.'),
    blankLine(),
    sectionLabel('KEADAAN SELEPAS INOVASI  ', 'Semua pergerakan kunci kini mempunyai rekod digital yang lengkap. Masa mencari maklumat pemegang kunci berkurang daripada ±15 minit kepada serta merta. Pematuhan prosedur penyerahan kunci meningkat kepada 100%.'),
    blankLine(),
    sectionLabel('FAEDAH-FAEDAH PELAKSANAAN INOVASI  ', '(i) Peningkatan keselamatan simpanan ubat terkawal; (ii) Jejak audit yang lengkap memenuhi keperluan pematuhan; (iii) Pengurangan risiko kehilangan kunci dan akibatnya; (iv) Penjimatan masa: ±3 jam sebulan dalam pengurusan kunci; (v) Model pengurusan kunci ini berpotensi direplikasi.'),
    blankLine(),
    sectionLabel('ANGGARAN KOS  ', 'Pembangunan sistem (inhouse): RM 0. Kos label QR dan papan kunci: RM 150. JUMLAH: ≈ RM 150'),
    blankLine(),
    wordCount('(± 308 patah perkataan)'),
    ...footerNames(['[Nama Penuh Ahli 1]', '[Nama Penuh Ahli 2]'], 'Hospital Daerah Lawas, Lawas'),
  ];
}

function buildAbstrak7() {
  return [
    ...headerBlock(
      'MYSUHU: INOVASI PROSES PEMANTAUAN DAN REKOD SUHU PENYIMPANAN\nUBAT-UBATAN YANG SISTEMATIK DI HOSPITAL DAERAH LAWAS',
      '[NAMA1 SINGKATAN], [NAMA2 SINGKATAN]'
    ),
    sectionLabel('PENDAHULUAN  ', 'Pemantauan suhu penyimpanan ubat-ubatan adalah keperluan mandatori di bawah Amalan Penyimpanan Baik (Good Storage Practice/GSP) dan garis panduan WHO. Kegagalan mengekalkan suhu yang ditetapkan boleh menjejaskan kualiti dan keberkesanan ubat, sekali gus mengancam keselamatan pesakit. MySuhu ialah inovasi proses yang menambahbaik kaedah pemantauan dan rekod suhu, memastikan pematuhan GSP yang lebih konsisten. Projek ini dikategorikan sebagai Inovasi Proses kerana ia mengubah kaedah, aliran kerja dan prosedur pemantauan suhu.'),
    blankLine(),
    sectionLabel('MASALAH SEBELUM INOVASI  ', 'Rekod suhu dicatat secara manual dua kali sehari pada borang kertas. Masalah yang dihadapi: (i) kelewatan tindakan apabila suhu berada di luar julat — bergantung kepada pemerhatian staf sahaja; (ii) rekod kertas mudah rosak, hilang atau tidak lengkap; (iii) tiada analisis trend suhu untuk pengesanan masalah awal; (iv) proses verifikasi rekod yang memakan masa semasa audit.'),
    blankLine(),
    sectionLabel('KEADAAN SEBELUM INOVASI  ', 'Staf perlu merekod suhu peti sejuk, bilik penyimpanan dan lemari ubat dua kali sehari secara manual. Sebarang suhu luar julat hanya diketahui pada waktu rekod seterusnya, iaitu potensi selang waktu sehingga 12 jam tanpa tindakan pembetulan.'),
    blankLine(),
    sectionLabel('PENERANGAN PROJEK INOVASI  ', 'MySuhu memperkenalkan proses pemantauan baharu dengan: (i) templat rekod suhu digital yang distandardkan dan mudah diisi melalui peranti mudah alih; (ii) sistem amaran segera kepada penyelia apabila suhu melebihi had yang ditetapkan; (iii) papan pemuka suhu masa nyata untuk semua unit penyimpanan; (iv) laporan trend suhu bulanan yang dijana secara automatik; dan (v) rekod audit digital yang lengkap dan boleh dicari.'),
    blankLine(),
    sectionLabel('KEADAAN SELEPAS INOVASI  ', 'Pematuhan rekod suhu meningkat daripada ±80% kepada >98%. Masa tindak balas kepada suhu luar julat berkurang daripada berpotensi >12 jam kepada <30 minit. Rekod suhu kini lengkap, tepat dan boleh dikemukakan semasa audit.'),
    blankLine(),
    sectionLabel('FAEDAH-FAEDAH PELAKSANAAN INOVASI  ', '(i) Peningkatan keselamatan penyimpanan ubat dan kualiti ubat; (ii) Pematuhan kepada GSP dan keperluan akreditasi; (iii) Penjimatan masa audit: ±4 jam setiap sesi; (iv) Pengurangan risiko kerosakan ubat akibat suhu tidak terkawal; (v) Sistem mudah direplikasi.'),
    blankLine(),
    sectionLabel('ANGGARAN KOS  ', 'Pembangunan sistem (inhouse): RM 0. Kos termometer digital tambahan: RM 400. JUMLAH: ≈ RM 400'),
    blankLine(),
    wordCount('(± 312 patah perkataan)'),
    ...footerNames(['[Nama Penuh Ahli 1]', '[Nama Penuh Ahli 2]'], 'Hospital Daerah Lawas, Lawas'),
  ];
}

function buildAbstrak8() {
  return [
    ...headerBlock(
      'MYTRANSPORTER: SISTEM PENGURUSAN PERMINTAAN KHIDMAT PENGHANTARAN\nUBAT-UBATAN DAN BEKALAN FARMASI DI HOSPITAL DAERAH LAWAS',
      '[NAMA1 SINGKATAN], [NAMA2 SINGKATAN]'
    ),
    sectionLabel('PENDAHULUAN  ', 'Perkhidmatan penghantaran ubat-ubatan dan bekalan farmasi dari Unit Farmasi ke wad-wad dan klinik adalah sebahagian daripada rantaian perkhidmatan farmasi. MyTransporter merupakan inovasi perkhidmatan yang mendigitalkan proses permintaan dan pengesahan penghantaran ubat-ubatan antara Unit Farmasi dan wad/klinik Hospital Daerah Lawas. Projek ini dikategorikan sebagai Inovasi Perkhidmatan kerana ia memperkenalkan konsep perkhidmatan baru yang mengubah cara penerimaan, pemprosesan dan pengesahan permintaan penghantaran.'),
    blankLine(),
    sectionLabel('MASALAH SEBELUM INOVASI  ', 'Permintaan penghantaran dibuat secara lisan melalui telefon atau nota bertulis yang dihantar oleh petugas wad. Masalah yang wujud: (i) kehilangan atau kekeliruan permintaan; (ii) tiada rekod sistematik permintaan yang membolehkan pemantauan; (iii) kesukaran membuktikan penyerahan dan penerimaan barangan; (iv) kelewatan penghantaran tanpa makluman kepada wad; dan (v) jurang komunikasi antara Unit Farmasi dan wad.'),
    blankLine(),
    sectionLabel('KEADAAN SEBELUM INOVASI  ', 'Wad menghubungi farmasi melalui telefon untuk membuat permintaan. Tiada rekod sistematik tentang masa permintaan dibuat, diproses dan dihantar. Ini menjejaskan kecekapan perkhidmatan dan menimbulkan pertikaian tentang status penghantaran.'),
    blankLine(),
    sectionLabel('PENERANGAN PROJEK INOVASI  ', 'MyTransporter memperkenalkan platform perkhidmatan digital dengan: (i) borang permintaan penghantaran dalam talian yang mudah diisi oleh kakitangan wad; (ii) notifikasi automatik kepada Unit Farmasi apabila permintaan baharu diterima; (iii) status penghantaran masa nyata yang boleh disemak oleh wad; (iv) pengesahan penerimaan digital oleh wad apabila barangan tiba; dan (v) rekod lengkap semua permintaan untuk tujuan audit dan penambahbaikan perkhidmatan.'),
    blankLine(),
    sectionLabel('KEADAAN SELEPAS INOVASI  ', 'Semua permintaan penghantaran tercatat secara sistematik. Wad boleh memantau status permintaan mereka tanpa perlu menghubungi farmasi berulang kali. Masa respons penghantaran purata berkurang.'),
    blankLine(),
    sectionLabel('FAEDAH-FAEDAH PELAKSANAAN INOVASI  ', '(i) Peningkatan kepuasan pelanggan — wad mendapat maklumat status penghantaran masa nyata; (ii) Penjimatan masa komunikasi telefon: ±5 jam seminggu; (iii) Rekod penghantaran yang lengkap untuk audit; (iv) Peningkatan akauntabiliti dalam rantaian penghantaran ubat; (v) Model perkhidmatan boleh direplikasi di fasiliti lain.'),
    blankLine(),
    sectionLabel('ANGGARAN KOS  ', 'Pembangunan sistem (inhouse): RM 0. Kos perkakasan dan pelaksanaan: RM 300. JUMLAH: ≈ RM 300'),
    blankLine(),
    wordCount('(± 308 patah perkataan)'),
    ...footerNames(['[Nama Penuh Ahli 1]', '[Nama Penuh Ahli 2]'], 'Hospital Daerah Lawas, Lawas'),
  ];
}

function buildAbstrak9() {
  return [
    ...headerBlock(
      'MYSTAFF: SISTEM PENGURUSAN JADUAL TUGAS DAN KEPAKARAN STAF\nFARMASI SECARA DIGITAL DI HOSPITAL DAERAH LAWAS',
      '[NAMA1 SINGKATAN], [NAMA2 SINGKATAN]'
    ),
    sectionLabel('PENDAHULUAN  ', 'Pengurusan sumber manusia Unit Farmasi yang cekap — merangkumi penjadualan tugas, pengurusan cuti, pemantauan kepakaran dan pembangunan staf — adalah asas kepada kualiti penyampaian perkhidmatan farmasi. MyStaff ialah sistem pengurusan jadual tugas dan kepakaran staf farmasi yang memperbaharui perkhidmatan pengurusan HR di peringkat unit. Ia dikategorikan sebagai Inovasi Perkhidmatan kerana ia mengubah cara penyampaian perkhidmatan pengurusan staf kepada kakitangan, dengan unsur interaksi dua hala antara staf dan pengurusan.'),
    blankLine(),
    sectionLabel('MASALAH SEBELUM INOVASI  ', 'Pengurusan jadual tugas dilakukan secara manual menggunakan kertas atau fail Excel yang dicetak dan ditampal. Masalah utama: (i) staf sukar mengakses jadual tugas di luar waktu pejabat; (ii) proses permohonan cuti yang memerlukan surat kertas dan menunggu kelulusan panjang; (iii) tiada pangkalan data kemahiran dan kepakaran staf yang terkini; dan (iv) pengurusan tidak mempunyai gambaran menyeluruh tentang kapasiti dan kepakaran pasukan.'),
    blankLine(),
    sectionLabel('KEADAAN SEBELUM INOVASI  ', 'Staf perlu hadir ke pejabat atau menelefon untuk menyemak jadual. Permohonan cuti memerlukan borang kertas yang diluluskan secara fizikal, mengambil masa 1–3 hari. Rekod kemahiran staf tersimpan dalam fail individu yang sukar dikemaskini.'),
    blankLine(),
    sectionLabel('PENERANGAN PROJEK INOVASI  ', 'MyStaff menyediakan perkhidmatan pengurusan staf digital yang merangkumi: (i) paparan jadual tugas dalam talian yang boleh diakses dari mana-mana peranti; (ii) permohonan dan kelulusan cuti atas talian dengan notifikasi automatik; (iii) pangkalan data kemahiran, latihan dan pensijilan staf; (iv) laporan kadar kehadiran dan statistik cuti; dan (v) papan pemuka kapasiti unit untuk perancangan sumber manusia.'),
    blankLine(),
    sectionLabel('KEADAAN SELEPAS INOVASI  ', 'Staf boleh menyemak jadual dan memohon cuti pada bila-bila masa melalui telefon pintar. Masa pemprosesan permohonan cuti berkurang daripada 1–3 hari kepada kurang 4 jam. Pengurusan mempunyai gambaran lengkap kapasiti unit secara masa nyata.'),
    blankLine(),
    sectionLabel('FAEDAH-FAEDAH PELAKSANAAN INOVASI  ', '(i) Peningkatan kepuasan staf melalui perkhidmatan pengurusan yang lebih responsif; (ii) Penjimatan masa pengurusan: ±8 jam sebulan; (iii) Perancangan sumber manusia yang lebih strategik; (iv) Rekod kepakaran staf membantu penempatan dan latihan yang lebih tepat; (v) Model boleh direplikasi di unit lain.'),
    blankLine(),
    sectionLabel('ANGGARAN KOS  ', 'Pembangunan sistem (inhouse): RM 0. Kos infrastruktur digital: RM 200/tahun. JUMLAH: ≈ RM 200/tahun'),
    blankLine(),
    wordCount('(± 310 patah perkataan)'),
    ...footerNames(['[Nama Penuh Ahli 1]', '[Nama Penuh Ahli 2]'], 'Hospital Daerah Lawas, Lawas'),
  ];
}

function buildAbstrak10() {
  return [
    ...headerBlock(
      'MYMSDS: SISTEM MAKLUMAT KESELAMATAN BAHAN FARMASI (MATERIAL SAFETY\nDATA SHEET) DIGITAL YANG MUDAH DIAKSES DI HOSPITAL DAERAH LAWAS',
      '[NAMA1 SINGKATAN], [NAMA2 SINGKATAN]'
    ),
    sectionLabel('PENDAHULUAN  ', 'Material Safety Data Sheet (MSDS) adalah dokumen mandatori yang mengandungi maklumat keselamatan bahan kimia dan ubat-ubatan, wajib tersedia dan mudah diakses oleh semua staf yang mengendalikan bahan berbahaya. MyMSDS ialah inovasi perkhidmatan yang mengdigitalkan akses kepada MSDS, membolehkan staf mendapatkan maklumat keselamatan bahan dengan pantas dan mudah. Ia dikategorikan sebagai Inovasi Perkhidmatan kerana ia mengubah cara penyampaian dan capaian maklumat keselamatan kepada pengguna.'),
    blankLine(),
    sectionLabel('MASALAH SEBELUM INOVASI  ', 'MSDS sedia ada disimpan dalam fail fizikal yang tebal dan kadangkala tidak terkini. Masalah yang dikenal pasti: (i) staf sukar mencari MSDS untuk bahan tertentu dalam keadaan kecemasan; (ii) MSDS mungkin sudah lapuk atau tidak dikemas kini; (iii) capaian terhad — staf di luar farmasi sukar mendapatkan MSDS dengan cepat; dan (iv) tiada jaminan staf membaca dan memahami MSDS yang berkaitan.'),
    blankLine(),
    sectionLabel('KEADAAN SEBELUM INOVASI  ', 'Fail MSDS disimpan dalam pejabat farmasi sahaja. Staf wad atau unit lain perlu datang ke farmasi atau menghubungi farmasi untuk mendapat maklumat MSDS, terutamanya semasa kecemasan pengendalian tumpahan bahan kimia.'),
    blankLine(),
    sectionLabel('PENERANGAN PROJEK INOVASI  ', 'MyMSDS memperkenalkan perkhidmatan akses MSDS digital yang merangkumi: (i) repositori digital MSDS yang lengkap dan terkini untuk semua bahan kimia dan ubat di hospital; (ii) carian pantas mengikut nama bahan, kod atau kategori; (iii) paparan MSDS dalam format ringkas dan mesra pengguna melalui telefon pintar; (iv) kod QR pada setiap bahan kimia yang menghubungkan terus ke MSDS berkaitan; dan (v) fungsi muat turun MSDS untuk penggunaan luar talian.'),
    blankLine(),
    sectionLabel('KEADAAN SELEPAS INOVASI  ', 'Semua staf kini boleh mengakses MSDS mana-mana bahan dalam masa <1 minit melalui telefon pintar. MSDS sentiasa terkini kerana dikemaskini secara berpusat. Kod QR pada bahan kimia memudahkan capaian segera dalam situasi kecemasan.'),
    blankLine(),
    sectionLabel('FAEDAH-FAEDAH PELAKSANAAN INOVASI  ', '(i) Peningkatan keselamatan staf dan pesakit dalam pengendalian bahan berbahaya; (ii) Pematuhan kepada keperluan OSHA dan akreditasi; (iii) Pengurangan masa carian MSDS: daripada ±15 minit kepada <1 minit; (iv) MSDS sentiasa terkini dan boleh diakses 24/7; (v) Model perkhidmatan boleh direplikasi.'),
    blankLine(),
    sectionLabel('ANGGARAN KOS  ', 'Pembangunan sistem (inhouse): RM 0. Kos pencetak label QR dan stiker: RM 200. JUMLAH: ≈ RM 200'),
    blankLine(),
    wordCount('(± 312 patah perkataan)'),
    ...footerNames(['[Nama Penuh Ahli 1]', '[Nama Penuh Ahli 2]'], 'Hospital Daerah Lawas, Lawas'),
  ];
}

// ─────────────────────────────────────────────
// DEFINE ALL DOCUMENTS
// ─────────────────────────────────────────────

const documents = [
  {
    filename: '01_Inovasi_Teknologi_MyCylinder.docx',
    label: 'INOVASI TEKNOLOGI',
    content: buildAbstrak1()
  },
  {
    filename: '02_Inovasi_Teknologi_MyInventory.docx',
    label: 'INOVASI TEKNOLOGI',
    content: buildAbstrak2()
  },
  {
    filename: '03_KIK_MyWarrant.docx',
    label: 'KIK',
    content: buildAbstrak3()
  },
  {
    filename: '04_KIK_MyHome.docx',
    label: 'KIK',
    content: buildAbstrak4()
  },
  {
    filename: '05_Inovasi_Proses_MyBLS.docx',
    label: 'INOVASI PROSES',
    content: buildAbstrak5()
  },
  {
    filename: '06_Inovasi_Proses_MyKunci.docx',
    label: 'INOVASI PROSES',
    content: buildAbstrak6()
  },
  {
    filename: '07_Inovasi_Proses_MySuhu.docx',
    label: 'INOVASI PROSES',
    content: buildAbstrak7()
  },
  {
    filename: '08_Inovasi_Perkhidmatan_MyTransporter.docx',
    label: 'INOVASI PERKHIDMATAN',
    content: buildAbstrak8()
  },
  {
    filename: '09_Inovasi_Perkhidmatan_MyStaff.docx',
    label: 'INOVASI PERKHIDMATAN',
    content: buildAbstrak9()
  },
  {
    filename: '10_Inovasi_Perkhidmatan_MyMSDS.docx',
    label: 'INOVASI PERKHIDMATAN',
    content: buildAbstrak10()
  },
];

// ─────────────────────────────────────────────
// GENERATE ALL DOCUMENTS
// ─────────────────────────────────────────────

async function generateAll() {
  for (const doc of documents) {
    const document = new Document({
      styles: {
        default: {
          document: {
            run: { font: 'Arial', size: 24 },
            paragraph: { spacing: { line: 360 } }
          }
        }
      },
      sections: [{
        properties: {
          page: {
            margin: {
              top: 1440,    // 1 inch
              bottom: 1440,
              left: 1800,   // 1.25 inch
              right: 1800
            }
          }
        },
        children: doc.content
      }]
    });

    const buffer = await Packer.toBuffer(document);
    const outPath = path.join(outputDir, doc.filename);
    fs.writeFileSync(outPath, buffer);
    console.log(`✅ Generated: ${doc.filename}`);
  }

  console.log(`\n📁 All files saved to: ${outputDir}`);
  console.log(`\n📋 Files list:`);
  documents.forEach((d, i) => console.log(`  ${i+1}. ${d.filename}`));
}

generateAll().catch(console.error);
