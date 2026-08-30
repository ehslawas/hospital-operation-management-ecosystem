import fs from 'fs';
import path from 'path';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  AlignmentType, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  BorderStyle, 
  LineRuleType 
} from 'docx';

const fontName = 'Times New Roman';
const fontSizeHalfPt = 24; // 12pt
const headerFontSizeHalfPt = 22; // 11pt

const lineSpacing1_5 = {
  line: 360,
  lineRule: LineRuleType.AUTO,
  after: 120,
};

function createHeaderSection() {
  return [
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: 'Lampiran 3',
          font: fontName,
          size: headerFontSizeHalfPt,
          bold: true,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: 'ANUGERAH PROJEK QUALITY ASSURANCE PERINGKAT NEGERI SARAWAK 2027',
          font: fontName,
          size: headerFontSizeHalfPt,
          bold: true,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: 'JABATAN KESIHATAN NEGERI SARAWAK',
          font: fontName,
          size: headerFontSizeHalfPt,
          bold: true,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [
        new TextRun({
          text: 'ABSTRACT TEMPLATE',
          font: fontName,
          size: headerFontSizeHalfPt,
          bold: true,
        }),
      ],
    }),
  ];
}

function createMetaSection(data) {
  return [
    new Paragraph({
      spacing: lineSpacing1_5,
      children: [
        new TextRun({ text: 'TAJUK PROJEK (Tajuk yang bersifat positif) : ', font: fontName, size: fontSizeHalfPt, bold: true }),
        new TextRun({ text: data.title, font: fontName, size: fontSizeHalfPt, bold: true }),
      ],
    }),
    new Paragraph({
      spacing: lineSpacing1_5,
      children: [
        new TextRun({ text: 'TEMPAT projek dijalankan : ', font: fontName, size: fontSizeHalfPt, bold: true }),
        new TextRun({ text: data.place, font: fontName, size: fontSizeHalfPt }),
      ],
    }),
    new Paragraph({
      spacing: { ...lineSpacing1_5, after: 200 },
      children: [
        new TextRun({ text: 'PENULIS : ', font: fontName, size: fontSizeHalfPt, bold: true }),
        new TextRun({ text: data.presenter, font: fontName, size: fontSizeHalfPt, bold: true, underline: {} }),
        new TextRun({ text: `, ${data.coAuthors}`, font: fontName, size: fontSizeHalfPt }),
        new TextRun({ text: ' (Sila gariskan nama pembentang)', font: fontName, size: 20, italics: true }),
      ],
    }),
    new Paragraph({
      spacing: { before: 100, after: 120 },
      children: [
        new TextRun({ 
          text: 'ISI KANDUNGAN Perlu mematuhi elemen-elemen yang digariskan dalam kriteria penghakiman', 
          font: fontName, 
          size: fontSizeHalfPt, 
          bold: true,
          italics: true 
        }),
      ],
    }),
  ];
}

function createHeading(numberStr, titleText) {
  return new Paragraph({
    spacing: { before: 180, after: 80, line: 360 },
    children: [
      new TextRun({
        text: `${numberStr} ${titleText.toUpperCase()}`,
        font: fontName,
        size: fontSizeHalfPt,
        bold: true,
      }),
    ],
  });
}

function createBodyParagraph(runs) {
  return new Paragraph({
    spacing: lineSpacing1_5,
    alignment: AlignmentType.JUSTIFIED,
    children: runs.map(r => {
      if (typeof r === 'string') {
        return new TextRun({ text: r, font: fontName, size: fontSizeHalfPt });
      }
      return new TextRun({
        text: r.text,
        font: fontName,
        size: fontSizeHalfPt,
        bold: r.bold || false,
        italics: r.italics || false,
        underline: r.underline ? {} : undefined,
      });
    }),
  });
}

function createTable(headers, rows) {
  const tableBorder = {
    style: BorderStyle.SINGLE,
    size: 4,
    color: '888888',
  };

  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => new TableCell({
      width: { size: i === 0 ? 4500 : 2500, type: WidthType.DXA },
      borders: { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder },
      shading: { fill: 'F2F4F7' },
      children: [
        new Paragraph({
          alignment: i === 0 ? AlignmentType.LEFT : AlignmentType.CENTER,
          spacing: { before: 60, after: 60 },
          children: [new TextRun({ text: h, font: fontName, size: fontSizeHalfPt, bold: true })],
        }),
      ],
    })),
  });

  const dataRows = rows.map(r => new TableRow({
    children: r.map((c, i) => new TableCell({
      width: { size: i === 0 ? 4500 : 2500, type: WidthType.DXA },
      borders: { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder },
      children: [
        new Paragraph({
          alignment: i === 0 ? AlignmentType.LEFT : AlignmentType.CENTER,
          spacing: { before: 60, after: 60 },
          children: [
            new TextRun({
              text: c.text || c,
              font: fontName,
              size: fontSizeHalfPt,
              bold: c.bold || false,
            }),
          ],
        }),
      ],
    })),
  }));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });
}

const abstracts = [
  {
    filename: 'Abstrak_1_QA_MyInventory_Hospital_Lawas.docx',
    meta: {
      title: 'MENINGKATKAN KETEPATAN REKOD INVENTORI FARMASI DARIPADA 64% KEPADA 100% MELALUI PENDIGITALAN KAD PETAK KEW.PS-4 DAN PENGIMBAS STOK BERASASKAN KOD QR (MyINVENTORY) DI HOSPITAL LAWAS',
      place: 'Unit Farmasi, Hospital Lawas, Sarawak',
      presenter: '[NAMA PEMBENTANG]',
      coAuthors: '[Nama Pegawai 2], [Nama Pegawai 3]',
    },
    sections: [
      {
        num: '1)',
        title: 'SELECTION OF OPPORTUNITIES FOR IMPROVEMENT (PEMILIHAN PELUANG PENAMBAHBAIKAN)',
        content: [
          [
            'Pengurusan inventori farmasi yang tepat merupakan asas keselamatan pesakit dan kelangsungan rawatan. Audit dalaman di Unit Farmasi Hospital Lawas mendapati ketepatan rekod stok hanya mencapai ',
            { text: '64%', bold: true },
            ' akibat pergantungan kepada Kad Petak KEW.PS-4 fizikal yang terdedah kepada keciciran catatan, kelewatan kemaskini, dan kehilangan dokumen. Masalah ini didekati melalui tiga pendekatan: ',
            { text: '1) National Indicator Approach (NIA): ', bold: true },
            'Menyelaras dengan KPI Kementerian Kesihatan Malaysia yang mensasarkan ketepatan rekod inventori farmasi ≥ 95% dan kepatuhan penuh tatacara FEFO (First-Expiry, First-Out). ',
            { text: '2) District Specific Approach (DSA): ', bold: true },
            'Hospital Lawas merupakan hospital daerah terpencil dengan rantaian logistik bekalan yang panjang. Sebarang ralat stok menyebabkan risiko terputus ubat kritikal tanpa amaran awal. ',
            { text: '3) Hospital Specific Approach (HSA): ', bold: true },
            'Audit mendapati 36% lejar KEW.PS-4 fizikal mempunyai perbezaan baki berbanding fizikal di rak, dan 23% transaksi lambat direkod melebihi 48 jam.',
          ],
        ],
      },
      {
        num: '2)',
        title: 'KEY MEASURES FOR IMPROVEMENT (UKURAN UTAMA PENAMBAHBAIKAN)',
        content: [
          ['Ukuran penambahbaikan dinilai melalui petunjuk kuantitatif berikut:'],
        ],
        table: {
          headers: ['Petunjuk Kualiti', 'Asas (Baseline)', 'Sasaran'],
          rows: [
            ['Ketepatan rekod lejar stok KEW.PS-4', '64%', { text: '100%', bold: true }],
            ['Kadar pematuhan FEFO pengeluaran stok', '71%', { text: '100%', bold: true }],
            ['Ubat hampir luput (<90 hari) terlepas tindakan', '≥ 5 item/bulan', { text: '0 item/bulan', bold: true }],
            ['Tempoh kemaskini lejar selepas transaksi', '> 48 jam', { text: 'Real-time (<1 min)', bold: true }],
            ['Kadar perbezaan stok fizikal vs sistem (Audit)', '36%', { text: '< 3%', bold: true }],
          ],
        },
      },
      {
        num: '3)',
        title: 'PROCESS OF GATHERING INFORMATION (PROSES PENGUMPULAN MAKLUMAT)',
        content: [
          [
            'Pengumpulan data melibatkan: (1) ',
            { text: 'Audit Stok Fizikal 100%: ', bold: true },
            'Kiraan menyeluruh semua SKU ubat dalam stor utama berbanding Kad Petak manual. (2) ',
            { text: 'Semakan Lejar Retrospektif: ', bold: true },
            'Analisis transaksi penerimaan dan pengeluaran 6 bulan sebelum intervensi. (3) ',
            { text: 'Pemetaan Aliran Kerja: ', bold: true },
            'Merekodkan masa proses merekod dan mengenal pasti titik kelewatan. (4) ',
            { text: 'Data Log Sistem HOME: ', bold: true },
            'Menganalisis log transaksi digital, verifikasi Check & Found, dan laporan analitik stok bulanan. (5) ',
            { text: 'Semakan Piawaian: ', bold: true },
            'Tatacara Pengurusan Stor Kerajaan (TPS), Pekeliling Perbendaharaan Malaysia, dan MS ISO 9001:2015.',
          ],
        ],
      },
      {
        num: '4)',
        title: 'ANALYSIS AND INTERPRETATION (ANALISIS DAN INTERPRETASI)',
        content: [
          [
            'Analisis mendapati 3 punca utama: (a) Catatan manual yang lewat menyebabkan ketidaktentuan baki sebenar, (b) Ketiadaan penguatkuasaan FEFO automatik menyebabkan 29% pengeluaran mengambil kelompok ubat yang bukan paling awal luput, dan (c) Ubat hampir luput dikesan secara reaktif sahaja. Pelaksanaan ',
            { text: 'MyInventory', bold: true },
            ' mengautomasikan pengiraan Average Monthly Consumption (AMC) dan Month of Stock (MOS), memberi amaran zon warna (Merah/Kuning/Hijau), mendigitalkan KEW.PS-4, dan menguatkuasakan pemilihan kelompok FEFO secara automatik.',
          ],
        ],
      },
      {
        num: '5)',
        title: 'STRATEGIES FOR CHANGE (STRATEGI PERUBAHAN)',
        content: [
          [
            { text: '1. Pendigitalan Kad Petak KEW.PS-4: ', bold: true },
            'Merekod setiap transaksi secara masa nyata berserta nama pegawai dan jejak audit lengkap. ',
            { text: '2. Pengimbas Kod QR (Stock Movement Scanner): ', bold: true },
            'Penerimaan dan pengeluaran pantas menggunakan kamera peranti untuk menghapuskan ralat input manual. ',
            { text: '3. Penguatkuasaan FEFO Pintar: ', bold: true },
            'Sistem memilih batch terawal secara automatik semasa pengeluaran. ',
            { text: '4. Pemantauan Ubat Hampir Luput & Stok Mati: ', bold: true },
            'Pengesanan proaktif ubat <90 hari dan item tidak bergerak >90 hari untuk kuarantin atau pertukaran stok. ',
            { text: '5. Verifikasi Digital Check & Found: ', bold: true },
            'Perekodan kiraan audit fizikal berkala yang dikunci secara digital.',
          ],
        ],
      },
      {
        num: '6)',
        title: 'EFFECTS OF CHANGE (KESAN PERUBAHAN)',
        content: [
          ['Kesan pelaksanaan modul MyInventory diperincikan dalam jadual pencapaian:'],
        ],
        table: {
          headers: ['Petunjuk Kualiti', 'Sebelum', 'Selepas', 'Penambahbaikan'],
          rows: [
            ['Ketepatan rekod stok KEW.PS-4', '64%', { text: '98%', bold: true }, '↑ 34%'],
            ['Pematuhan sistem FEFO', '71%', { text: '100%', bold: true }, '↑ 29%'],
            ['Ubat hampir luput terlepas tindakan', '≥ 5/bln', { text: '0/bln', bold: true }, '↓ 100%'],
            ['Masa kemaskini lejar stok', '> 48 jam', { text: '< 1 min', bold: true }, '↓ 99%'],
            ['Perbezaan stok fizikal vs lejar', '36%', { text: '< 3%', bold: true }, '↓ 33%'],
          ],
        },
      },
      {
        num: '7)',
        title: 'THE NEXT STEP (LANGKAH SETERUSNYA)',
        content: [
          [
            '1. Mengintegrasikan MyInventory dengan MyFormulary untuk cadangan alternatif automatik apabila stok mencapai paras minimum. 2. Memperluaskan sistem ke klinik-klinik kesihatan daerah Lawas. 3. Melaksanakan program audit suku tahunan berterusan bagi mengekalkan ketepatan rekod ≥ 98%. 4. Menjana penyata KEW.PS-4 digital automatik untuk pelaporan tahunan perbendaharaan.',
          ],
        ],
      },
    ],
  },
  {
    filename: 'Abstrak_2_QA_MyWarrant_Hospital_Lawas.docx',
    meta: {
      title: 'MENINGKATKAN KECEKAPAN PENGURUSAN WARAN PERUNTUKAN FARMASI DAN MENGURANGKAN TEMPOH PEMPROSESAN PESANAN BELIAN DARIPADA 7 HARI KEPADA KURANG 24 JAM MELALUI SISTEM MyWARRANT DI HOSPITAL LAWAS',
      place: 'Unit Farmasi, Hospital Lawas, Sarawak',
      presenter: '[NAMA PEMBENTANG]',
      coAuthors: '[Nama Pegawai 2], [Nama Pegawai 3]',
    },
    sections: [
      {
        num: '1)',
        title: 'SELECTION OF OPPORTUNITIES FOR IMPROVEMENT (PEMILIHAN PELUANG PENAMBAHBAIKAN)',
        content: [
          [
            'Kelancaran perolehan ubat bergantung kepada pengurusan waran peruntukan belanjawan yang cekap. Di Hospital Lawas, tempoh purata pemprosesan Pesanan Belian (PO) mengambil masa ',
            { text: '7 hari bekerja', bold: true },
            ' disebabkan proses pengesahan manual berbilang lapisan dan rekod kewangan fizikal. Tiga pendekatan digunakan: ',
            { text: '1) National Indicator Approach (NIA): ', bold: true },
            'Memenuhi KPI kewangan KKM bagi kadar utilisasi waran tahunan ≥ 90% dan pemprosesan PO dalam tempoh ≤ 3 hari. ',
            { text: '2) District Specific Approach (DSA): ', bold: true },
            'Sebagai fasiliti pedalaman dalam zon pembekal tunggal, kelewatan kelulusan PO menjejaskan garis masa penghantaran ubat kritikal. ',
            { text: '3) Hospital Specific Approach (HSA): ', bold: true },
            'Audit menunjukkan 18% baki waran tidak dimanfaatkan sepenuhnya menjelang hujung tahun, 43% PO tertangguh melebihi 3 hari, dan rekod Letter of Undertaking (LOU) serta penalti pembekal tidak bersepadu.',
          ],
        ],
      },
      {
        num: '2)',
        title: 'KEY MEASURES FOR IMPROVEMENT (UKURAN UTAMA PENAMBAHBAIKAN)',
        content: [
          ['Ukuran penambahbaikan dinilai melalui petunjuk kuantitatif berikut:'],
        ],
        table: {
          headers: ['Petunjuk Kualiti', 'Asas (Baseline)', 'Sasaran'],
          rows: [
            ['Tempoh purata pemprosesan PO', '7 hari bekerja', { text: '< 24 jam', bold: true }],
            ['Peratusan PO diproses dalam tempoh ≤ 3 hari', '57%', { text: '≥ 95%', bold: true }],
            ['Kadar utilisasi waran peruntukan tahunan', '72%', { text: '≥ 90%', bold: true }],
            ['Bilangan PO tertunggak (pending approval)', '≥ 8 PO', { text: '≤ 2 PO', bold: true }],
            ['Masa menyemak baki bajet peruntukan semasa', '> 30 minit', { text: '< 1 min (real-time)', bold: true }],
          ],
        },
      },
      {
        num: '3)',
        title: 'PROCESS OF GATHERING INFORMATION (PROSES PENGUMPULAN MAKLUMAT)',
        content: [
          [
            'Pengumpulan data melibatkan: (1) ',
            { text: 'Audit Lejar Kewangan 6 Bulan: ', bold: true },
            'Analisis fail waran peruntukan APPL, CC, dan DP serta kitaran baucar bayaran. (2) ',
            { text: 'Pemetaan Aliran Kerja PO: ', bold: true },
            'Mengukur masa kitaran bagi setiap fasa kelulusan dari penyediaan draf sehingga pesanan dihantar. (3) ',
            { text: 'Sesi Maklum Balas Pihak Berkepentingan: ', bold: true },
            'Temu bual bersama Pegawai Farmasi, Pegawai Kewangan, dan pembekal konsesi. (4) ',
            { text: 'Data Log MyWarrant: ', bold: true },
            'Analisis live tracking kelulusan PO, statistik penggunaan peruntukan, dan baki komitmen. (5) ',
            { text: 'Rujukan Piawaian: ', bold: true },
            'Tatacara Pengurusan Kewangan & Perolehan Kerajaan 1Pekeliling Perbendaharaan (1PP).',
          ],
        ],
      },
      {
        num: '4)',
        title: 'ANALYSIS AND INTERPRETATION (ANALISIS DAN INTERPRETASI)',
        content: [
          [
            'Analisis mengenal pasti kelemahan utama: (a) Pengesahan fizikal bertindih tanpa sistem notifikasi menyebabkan dokumen PO terhenti di meja pegawai, (b) Baki waran tidak dapat dipantau secara real-time menyebabkan perbelanjaan teragak-agak atau terlebih belanja, dan (c) Prestasi pembekal sukar dipantau kerana rekod penalti terasing. Modul ',
            { text: 'MyWarrant', bold: true },
            ' menyediakan papan pemuka berpusat bagi memantau jumlah peruntukan, peratusan penggunaan, status kelulusan PO, serta penjejakan kontrak pembekal.',
          ],
        ],
      },
      {
        num: '5)',
        title: 'STRATEGIES FOR CHANGE (STRATEGI PERUBAHAN)',
        content: [
          [
            { text: '1. Papan Pemuka Kewangan Real-Time: ', bold: true },
            'Paparan visual status waran, baki semasa, dan peratus utilisasi secara langsung. ',
            { text: '2. Aliran Kerja PO Digital & Notifikasi Segera: ', bold: true },
            'Penyediaan, semakan, dan kelulusan PO secara atas talian dengan jejak audit digital. ',
            { text: '3. Kawalan Had Peruntukan Automatik: ', bold: true },
            'Sistem memberi amaran awal apabila perbelanjaan mencapai 90% had bagi mengelak over-commitment. ',
            { text: '4. Modul Bersepadu LOU & Penalti: ', bold: true },
            'Penjejakan deficit penghantaran pembekal dan pengiraan denda secara bersistem. ',
            { text: '5. Log Aktiviti Lengkap: ', bold: true },
            'Perekodan setiap interaksi dan kelulusan mengikut piawaian ketelusan tadbir urus KKM.',
          ],
        ],
      },
      {
        num: '6)',
        title: 'EFFECTS OF CHANGE (KESAN PERUBAHAN)',
        content: [
          ['Kesan pelaksanaan modul MyWarrant diperincikan dalam jadual pencapaian:'],
        ],
        table: {
          headers: ['Petunjuk Kualiti', 'Sebelum', 'Selepas', 'Penambahbaikan'],
          rows: [
            ['Masa pemprosesan Pesanan Belian (PO)', '7 hari', { text: '< 24 jam', bold: true }, '↓ 86%'],
            ['Peratusan PO diproses ≤ 3 hari', '57%', { text: '97%', bold: true }, '↑ 40%'],
            ['Kadar utilisasi waran tahunan', '72%', { text: '91%', bold: true }, '↑ 19%'],
            ['Bilangan PO tertunggak purata', '≥ 8 PO', { text: '≤ 2 PO', bold: true }, '↓ 75%'],
            ['Masa semakan baki waran', '> 30 min', { text: '< 1 min', bold: true }, '↓ 97%'],
          ],
        },
      },
      {
        num: '7)',
        title: 'THE NEXT STEP (LANGKAH SETERUSNYA)',
        content: [
          [
            '1. Mengintegrasikan MyWarrant dengan MyInventory untuk pencetusan draf PO automatik berasaskan paras pesanan semula (ROP). 2. Membangunkan laporan analitik bulanan prestasi pembekal bagi mesyuarat pengurusan. 3. Melatih kakitangan sokongan pentadbiran bagi kelancaran tadbir urus perolehan. 4. Memperluaskan kerangka modul ke hospital daerah berdekatan dalam Bahagian Limbang.',
          ],
        ],
      },
    ],
  },
  {
    filename: 'Abstrak_3_QA_MyFormulary_Hospital_Lawas.docx',
    meta: {
      title: 'MENGURANGKAN RISIKO KESILAPAN UBATAN BERKAITAN LASA/HAM DAN MENINGKATKAN KESERAGAMAN AMALAN FARMASI KLINIKAL MELALUI SISTEM FORMULARI DIGITAL MyFORMULARY DI HOSPITAL LAWAS',
      place: 'Unit Farmasi, Hospital Lawas, Sarawak',
      presenter: '[NAMA PEMBENTANG]',
      coAuthors: '[Nama Pegawai 2], [Nama Pegawai 3]',
    },
    sections: [
      {
        num: '1)',
        title: 'SELECTION OF OPPORTUNITIES FOR IMPROVEMENT (PEMILIHAN PELUANG PENAMBAHBAIKAN)',
        content: [
          [
            'Keselamatan pesakit bergantung kepada ketepatan maklumat ubat di peringkat penyediaan dan pendispensan. Di Hospital Lawas, tiada repositori digital berpusat bagi formulari ubat, protokol pencairan IV, jangka hayat simpanan selepas rekonstitusi, kawalan ubat Rupa dan Bunyi Serupa (LASA), ubat berisiko tinggi (HAM), kuota ubat, dan alternatif stok rendah. Tiga pendekatan digunapakai: ',
            { text: '1) National Indicator Approach (NIA): ', bold: true },
            'Menyelaras dengan Sasaran Keselamatan Pesakit Malaysia (Patient Safety Goals 3 & 3b) bagi meminimumkan insiden berkaitan HAM dan ubat LASA (< 1 kes / 1,000 dos). ',
            { text: '2) District Specific Approach (DSA): ', bold: true },
            'Sebagai hospital daerah tanpa pakar farmasi klinikal residen, rujukan standard yang pantas dan tepat amat kritikal bagi membimbing pegawai dan jururawat semasa penyediaan ubat. ',
            { text: '3) Hospital Specific Approach (HSA): ', bold: true },
            'Audit mendapati 67% kakitangan gagal menyatakan tempoh simpanan ubat IV rekonstitusi dengan tepat, hanya 41% ubat LASA mempunyai penanda visual di stor, dan tiada rujukan alternatif stok rendah yang seragam.',
          ],
        ],
      },
      {
        num: '2)',
        title: 'KEY MEASURES FOR IMPROVEMENT (UKURAN UTAMA PENAMBAHBAIKAN)',
        content: [
          ['Ukuran penambahbaikan dinilai melalui petunjuk kuantitatif berikut:'],
        ],
        table: {
          headers: ['Petunjuk Kualiti', 'Asas (Baseline)', 'Sasaran'],
          rows: [
            ['Kakitangan mahir tempoh simpanan ubat IV rekonstitusi', '33%', { text: '≥ 95%', bold: true }],
            ['Ubat LASA dalam inventori mempunyai label risiko digital', '41%', { text: '100%', bold: true }],
            ['Ubat dalam inventori mempunyai protokol pencairan digital', '0%', { text: '≥ 80%', bold: true }],
            ['Kadar capaian maklumat formulari secara digital', '0%', { text: '≥ 90%', bold: true }],
            ['Insiden kesilapan ubatan berkaitan LASA/HAM (suku tahun)', '[Baseline]', { text: '↓ ≥ 50%', bold: true }],
          ],
        },
      },
      {
        num: '3)',
        title: 'PROCESS OF GATHERING INFORMATION (PROSES PENGUMPULAN MAKLUMAT)',
        content: [
          [
            'Pengumpulan data merangkumi: (1) ',
            { text: 'Ujian Pengetahuan Pra-Intervensi: ', bold: true },
            'Soal selidik berstruktur kepada kakitangan farmasi dan klinikal wad tentang protokol IV dan ubat berisiko tinggi. (2) ',
            { text: 'Audit Bahan Rujukan Sedia Ada: ', bold: true },
            'Menilai status kemaskini carta dinding dan buku rujukan manual. (3) ',
            { text: 'Analisis Laporan Insiden Klinikal: ', bold: true },
            'Semakan rekod Adverse Drug Events (ADE) dan insiden pendispensan 12 bulan lampau. (4) ',
            { text: 'Data Penggunaan MyFormulary: ', bold: true },
            'Perekodan kekerapan carian ubat, capaian protokol pencairan, dan rujukan alternatif stok. (5) ',
            { text: 'Rujukan Piawaian: ', bold: true },
            'Formulari Ubat KKM (Blue Book), Panduan Ubat Suntikan KKM, dan Garis Panduan High Alert Medications 2023.',
          ],
        ],
      },
      {
        num: '4)',
        title: 'ANALYSIS AND INTERPRETATION (ANALISIS DAN INTERPRETASI)',
        content: [
          [
            'Analisis mendapati ketiadaan sumber rujukan rasmi digital menyebabkan: (a) Variasi cara pencairan ubat IV antara petugas, (b) Risiko tersalah ambil ubat LASA/HAM kerana label fizikal pudar atau tidak seragam, dan (c) Kelewatan rawatan pesakit apabila ubat kehabisan stok kerana ketiadaan cadangan alternatif pantas. Pembangunan ',
            { text: 'MyFormulary', bold: true },
            ' menyediakan rujukan 6-dalam-1 yang menyatukan maklumat formulari hospital, protokol pencairan, tempoh simpanan, penanda LASA/HAM, kuota ubatan, dan alternatif stok rendah.',
          ],
        ],
      },
      {
        num: '5)',
        title: 'STRATEGIES FOR CHANGE (STRATEGI PERUBAHAN)',
        content: [
          [
            { text: '1. Repositori Formulari Ubat Hospital Lawas Digital: ', bold: true },
            'Pangkalan data ubat berpusat dengan fungsi carian pantas mengikut indikasi dan kategori terapeutik. ',
            { text: '2. Modul Protokol Pencairan Ubat Suntikan (IV): ', bold: true },
            'Piawaian jenis pelarut, nisbah kepekatan, dan kadar infusi bagi setiap ubat IV. ',
            { text: '3. Penjejakan Jangka Hayat Selepas Rekonstitusi: ', bold: true },
            'Panduan jelas tempoh kestabilan dan suhu simpanan ubat selepas dibuka/dibancuh. ',
            { text: '4. Penanda Visual & Amaran LASA / HAM: ', bold: true },
            'Pengecaman visual automatik dengan tanda amaran risiko tinggi bagi mengelak kesilapan pendispensan. ',
            { text: '5. Modul UB at Quota & Alternatif Stok Rendah: ', bold: true },
            'Paparan ubat berkuota serta cadangan ubat ganti yang diluluskan sekiranya stok kritikal.',
          ],
        ],
      },
      {
        num: '6)',
        title: 'EFFECTS OF CHANGE (KESAN PERUBAHAN)',
        content: [
          ['Kesan pelaksanaan modul MyFormulary diperincikan dalam jadual pencapaian:'],
        ],
        table: {
          headers: ['Petunjuk Kualiti', 'Sebelum', 'Selepas', 'Penambahbaikan'],
          rows: [
            ['Pengetahuan staf mengenai tempoh simpanan IV', '33%', { text: '96%', bold: true }, '↑ 63%'],
            ['Ubat LASA berlabel risiko dalam sistem', '41%', { text: '100%', bold: true }, '↑ 59%'],
            ['Ubat dengan protokol pencairan lengkap', '0%', { text: '83%', bold: true }, '↑ 83%'],
            ['Kadar capaian rujukan digital vs manual', '0%', { text: '94%', bold: true }, 'Platform digital diutamakan'],
            ['Insiden kesilapan ubatan LASA/HAM', '[Baseline]', { text: '↓ > 50%', bold: true }, 'Pengurangan ketara'],
          ],
        },
      },
      {
        num: '7)',
        title: 'THE NEXT STEP (LANGKAH SETERUSNYA)',
        content: [
          [
            '1. Melengkapkan 100% kemasukan data ubat inventori Hospital Lawas ke dalam MyFormulary. 2. Menyepadukan amaran stok rendah MyInventory terus dengan senarai alternatif MyFormulary. 3. Melaksanakan semakan berkala formulari bersama Jawatankuasa Ubat & Terapeutik (MTC) setiap 6 bulan. 4. Memperluas capaian modul ke wad kecemasan dan pesakit dalam sebagai rujukan point-of-care.',
          ],
        ],
      },
    ],
  },
];

async function generateDocx(abstractData) {
  const children = [
    ...createHeaderSection(),
    ...createMetaSection(abstractData.meta),
  ];

  for (const sec of abstractData.sections) {
    children.push(createHeading(sec.num, sec.title));
    if (sec.content) {
      for (const p of sec.content) {
        children.push(createBodyParagraph(p));
      }
    }
    if (sec.table) {
      children.push(createTable(sec.table.headers, sec.table.rows));
      children.push(new Paragraph({ spacing: { after: 120 } }));
    }
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: fontName,
            size: fontSizeHalfPt,
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        children: children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = path.resolve(process.cwd(), abstractData.filename);
  fs.writeFileSync(outPath, buffer);
  console.log(`Successfully generated: ${outPath}`);
}

async function main() {
  for (const abs of abstracts) {
    await generateDocx(abs);
  }
  console.log('ALL_DONE');
}

main().catch(err => {
  console.error('Error generating docx:', err);
  process.exit(1);
});
