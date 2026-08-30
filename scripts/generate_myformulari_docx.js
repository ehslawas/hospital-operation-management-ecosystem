// scripts/generate_myformulari_docx.js
import fs from 'fs'
import path from 'path'
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  ImageRun,
  HeadingLevel,
  AlignmentType,
  WidthType,
  ShadingType,
  BorderStyle,
  PageBreak,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
  convertInchesToTwip
} from 'docx'

const ROOT_DIR = process.cwd()
const IMAGES_DIR = path.join(ROOT_DIR, 'docs', 'manuals', 'images')
const OUTPUT_DOCX = path.join(ROOT_DIR, 'docs', 'manuals', 'PANDUAN_LENGKAP_PENGGUNA_MYFORMULARI_KKM.docx')

function getImageBuffer(filename) {
  const p = path.join(IMAGES_DIR, filename)
  if (fs.existsSync(p)) {
    return fs.readFileSync(p)
  }
  console.warn(`Warning: Image ${filename} not found at ${p}`)
  return null
}

const COLOR_PRIMARY = '1E3A8A' // KKM Navy Blue
const COLOR_SECONDARY = '6D28D9' // Violet Purple
const COLOR_EMERALD = '047857' // Green
const COLOR_ROSE = 'BE123C' // Red
const COLOR_AMBER = 'B45309' // Amber
const COLOR_TEXT = '1F2937' // Dark Gray
const COLOR_MUTED = '4B5563' // Medium Gray
const COLOR_BG_ROSE = 'FFF1F2'
const COLOR_BG_BLUE = 'EFF6FF'
const COLOR_BG_AMBER = 'FEFCE8'
const COLOR_BG_EMERALD = 'F0FDF4'

function createH1(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 180 },
    run: { font: 'Segoe UI', size: 32, bold: true, color: COLOR_PRIMARY }
  })
}

function createH2(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 260, after: 120 },
    run: { font: 'Segoe UI', size: 24, bold: true, color: COLOR_SECONDARY }
  })
}

function createH3(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 180, after: 90 },
    run: { font: 'Segoe UI', size: 20, bold: true, color: COLOR_TEXT }
  })
}

function createP(text, options = {}) {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        font: 'Segoe UI',
        size: options.size || 21,
        color: options.color || COLOR_TEXT,
        bold: options.bold || false,
        italics: options.italics || false
      })
    ],
    spacing: { before: options.spacingBefore || 60, after: options.spacingAfter || 100 },
    alignment: options.alignment || AlignmentType.LEFT
  })
}

function createBullet(text, boldPrefix = '') {
  const children = []
  if (boldPrefix) {
    children.push(new TextRun({ text: boldPrefix + ' ', font: 'Segoe UI', size: 21, bold: true, color: COLOR_TEXT }))
  }
  children.push(new TextRun({ text, font: 'Segoe UI', size: 21, color: COLOR_TEXT }))

  return new Paragraph({
    children,
    bullet: { level: 0 },
    spacing: { before: 30, after: 50 }
  })
}

function createCallout(title, text, type = 'info') {
  let bgColor = COLOR_BG_BLUE
  let borderColor = COLOR_PRIMARY
  let titleColor = COLOR_PRIMARY

  if (type === 'danger' || type === 'ham') {
    bgColor = COLOR_BG_ROSE
    borderColor = COLOR_ROSE
    titleColor = COLOR_ROSE
  } else if (type === 'warning' || type === 'lasa') {
    bgColor = COLOR_BG_AMBER
    borderColor = COLOR_AMBER
    titleColor = COLOR_AMBER
  } else if (type === 'success' || type === 'nag') {
    bgColor = COLOR_BG_EMERALD
    borderColor = COLOR_EMERALD
    titleColor = COLOR_EMERALD
  }

  const border = { style: BorderStyle.SINGLE, size: 16, color: borderColor }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: bgColor, type: ShadingType.CLEAR },
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              left: border
            },
            margins: { top: 140, bottom: 140, left: 200, right: 180 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: title, font: 'Segoe UI', size: 21, bold: true, color: titleColor })
                ],
                spacing: { after: 40 }
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: text, font: 'Segoe UI', size: 19, color: COLOR_TEXT })
                ],
                spacing: { after: 0 }
              })
            ]
          })
        ]
      })
    ]
  })
}

function createDocTable(headers, rows, colWidths = []) {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => new TableCell({
      shading: { fill: COLOR_PRIMARY, type: ShadingType.CLEAR },
      margins: { top: 100, bottom: 100, left: 120, right: 120 },
      width: colWidths[i] ? { size: colWidths[i], type: WidthType.PERCENTAGE } : undefined,
      children: [
        new Paragraph({
          children: [
            new TextRun({ text: h, font: 'Segoe UI', size: 19, bold: true, color: 'FFFFFF' })
          ],
          alignment: AlignmentType.CENTER
        })
      ]
    }))
  })

  const bodyRows = rows.map((row, rIdx) => new TableRow({
    children: row.map((cell, cIdx) => new TableCell({
      shading: { fill: rIdx % 2 === 1 ? 'F9FAFB' : 'FFFFFF', type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' },
        left: { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' },
        right: { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' }
      },
      width: colWidths[cIdx] ? { size: colWidths[cIdx], type: WidthType.PERCENTAGE } : undefined,
      children: [
        new Paragraph({
          children: [
            new TextRun({ text: cell, font: 'Segoe UI', size: 18, color: COLOR_TEXT })
          ]
        })
      ]
    }))
  }))

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...bodyRows]
  })
}

function createRealImageBox(imageBuffer, caption, width = 580, height = 330) {
  if (!imageBuffer) return [new Paragraph({ text: `[Tangkapan Skrin: ${caption}]` })]

  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new ImageRun({
          data: imageBuffer,
          transformation: { width, height }
        })
      ],
      spacing: { before: 160, after: 60 }
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Paparan Sebenar Sistem: ${caption}`,
          font: 'Segoe UI',
          size: 17,
          italics: true,
          bold: true,
          color: COLOR_MUTED
        })
      ],
      spacing: { before: 20, after: 180 }
    })
  ]
}

async function buildDocument() {
  console.log('Reading real screenshot assets...')
  const imgJata = getImageBuffer('jata_malaysia.png')
  const s01 = getImageBuffer('01_hub_formulari_submenu.png')
  const s02 = getImageBuffer('02_formulari_dashboard_search.png')
  const s03 = getImageBuffer('03_drug_detail_overview.png')
  const s04 = getImageBuffer('04_drug_detail_pregnancy_safety.png')
  const s05 = getImageBuffer('05_ham_list_page.png')
  const s06 = getImageBuffer('06_lasa_list_tallman.png')
  const s07 = getImageBuffer('07_iv_dilution_protocols.png')
  const s08 = getImageBuffer('08_nag_antimicrobial_guidelines.png')
  const s09 = getImageBuffer('09_drug_quota_monitoring.png')
  const s10 = getImageBuffer('10_drug_alternatives_matrix.png')
  const s11 = getImageBuffer('11_interaction_checker_modal.png')

  console.log('Constructing comprehensive Word document with real screenshots...')

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Segoe UI', size: 21, color: COLOR_TEXT }
        }
      }
    },
    sections: [
      // ══════════════════════════════════════════════════════════════════
      // COVER PAGE
      // ══════════════════════════════════════════════════════════════════
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
              right: convertInchesToTwip(1)
            }
          }
        },
        children: [
          new Paragraph({ spacing: { before: 100, after: 60 } }),
          ...(imgJata
            ? [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new ImageRun({
                      data: imgJata,
                      transformation: { width: 110, height: 88 }
                    })
                  ],
                  spacing: { before: 60, after: 160 }
                })
              ]
            : []),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'KEMENTERIAN KESIHATAN MALAYSIA',
                font: 'Segoe UI',
                size: 26,
                bold: true,
                color: COLOR_PRIMARY
              })
            ],
            spacing: { after: 50 }
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'HOSPITAL LAWAS, SARAWAK',
                font: 'Segoe UI',
                size: 22,
                bold: true,
                color: COLOR_MUTED
              })
            ],
            spacing: { after: 260 }
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'PANDUAN PENGGUNA LENGKAP & STANDARD OPERATING PROCEDURE (SOP)',
                font: 'Segoe UI',
                size: 22,
                bold: true,
                color: COLOR_SECONDARY
              })
            ],
            spacing: { after: 80 }
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'MODUL MYFORMULARI (H.O.M.E.)',
                font: 'Segoe UI',
                size: 38,
                bold: true,
                color: COLOR_PRIMARY
              })
            ],
            spacing: { after: 120 }
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'Panduan Bergambar Terperinci Antaramuka Sebenar Sistem: Carian FUKKM, Pengendalian HAM/LASA, Protokol Bancuhan IV, Garis Panduan NAG 2024, dan Pengurusan Kuota',
                font: 'Segoe UI',
                size: 19,
                italics: true,
                color: COLOR_MUTED
              })
            ],
            spacing: { after: 360 }
          }),

          // Metadata Table Box
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 8, color: COLOR_PRIMARY },
                      bottom: { style: BorderStyle.SINGLE, size: 8, color: COLOR_PRIMARY },
                      left: { style: BorderStyle.SINGLE, size: 8, color: COLOR_PRIMARY },
                      right: { style: BorderStyle.SINGLE, size: 8, color: COLOR_PRIMARY }
                    },
                    margins: { top: 140, bottom: 140, left: 200, right: 200 },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: 'MAKLUMAT KAWALAN DOKUMEN & SISTEM', bold: true, color: COLOR_PRIMARY, size: 19 })
                        ],
                        spacing: { after: 80 }
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: '• Sistem Induk: ', bold: true }),
                          new TextRun({ text: 'Hospital Operation Management Ecosystem (H.O.M.E.)' })
                        ],
                        spacing: { after: 30 }
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: '• Modul Klinikal: ', bold: true }),
                          new TextRun({ text: 'MyFormulari (Pengkatalogan & Keselamatan Ubat)' })
                        ],
                        spacing: { after: 30 }
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: '• Pangkalan Data: ', bold: true }),
                          new TextRun({ text: 'Formulari Ubat KKM (FUKKM Edisi Ke-4) & NAG 2024' })
                        ],
                        spacing: { after: 30 }
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: '• Fasiliti: ', bold: true }),
                          new TextRun({ text: 'Jabatan Farmasi & Semua Wad Klinikal, Hospital Lawas' })
                        ],
                        spacing: { after: 30 }
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: '• Status Tangkapan Skrin: ', bold: true }),
                          new TextRun({ text: '100% Antaramuka Sebenar Sistem MyFormulari' })
                        ],
                        spacing: { after: 30 }
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: '• Sasaran Pengguna: ', bold: true }),
                          new TextRun({ text: 'Pakar Perubatan, Pegawai Perubatan (MO), Pegawai Farmasi, Jururawat, PPP' })
                        ]
                      })
                    ]
                  })
                ]
              })
            ]
          }),

          new Paragraph({ children: [new PageBreak()] })
        ]
      },

      // ══════════════════════════════════════════════════════════════════
      // MAIN CONTENT SECTION
      // ══════════════════════════════════════════════════════════════════
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
              right: convertInchesToTwip(1)
            }
          }
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'H.O.M.E. — Panduan Pengguna Rasmi Modul MyFormulari | KKM Hospital Lawas',
                    font: 'Segoe UI',
                    size: 15,
                    color: COLOR_MUTED
                  })
                ]
              })
            ]
          })
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.SPACE_BETWEEN,
                children: [
                  new TextRun({
                    text: 'Kementerian Kesihatan Malaysia — Dokumen Kawalan Dalaman',
                    font: 'Segoe UI',
                    size: 15,
                    color: COLOR_MUTED
                  }),
                  new TextRun({
                    text: '   |   Halaman ',
                    font: 'Segoe UI',
                    size: 15,
                    color: COLOR_MUTED
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: 'Segoe UI',
                    size: 15,
                    bold: true,
                    color: COLOR_PRIMARY
                  }),
                  new TextRun({
                    text: ' daripada ',
                    font: 'Segoe UI',
                    size: 15,
                    color: COLOR_MUTED
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    font: 'Segoe UI',
                    size: 15,
                    bold: true,
                    color: COLOR_PRIMARY
                  })
                ]
              })
            ]
          })
        },
        children: [
          createH1('JADUAL KANDUNGAN PANDUAN PENGGUNA'),
          createDocTable(
            ['Bab', 'Topik & Pengisian Modul', 'Paparan Sebenar Sistem'],
            [
              ['BAB 1', 'Pengenalan & Objektif Sistem MyFormulari', 'Visi & Dasar KKM'],
              ['BAB 2', 'Navigasi Module Hub & Pilihan Menu Klinikal', 'Sub-Menu MyFormulari Hub'],
              ['BAB 3', 'Papan Pemuka Carian FUKKM & Kategori Preskriber', 'Papan Pemuka & Bar Carian'],
              ['BAB 4', 'Monograf Klinikal Ubat Terperinci & 8 Tab Klinikal', 'Monograf Ceftriaxone & Tab Status'],
              ['BAB 5', 'Pengendalian Ubat Berisiko Tinggi (HAM) & SOP IDC', 'Senarai Ubat HAM & Lencana Merah'],
              ['BAB 6', 'Daftar Ubat LASA & Protokol TALL-Man Lettering', 'Daftar Pasangan LASA & Pengasingan'],
              ['BAB 7', 'Pusat Protokol Rekonstitusi & Pelarutan Infusi IV', 'Protokol Pelarutan & Y-Site'],
              ['BAB 8', 'Garis Panduan Antimikrobial Kebangsaan (NAG 2024)', 'Panduan NAG & Sistem Badan'],
              ['BAB 9', 'Pemantauan Kuota Bulanan Fasiliti & Amaran Stok', 'Penjejak Kuota & Amaran Baki'],
              ['BAB 10', 'Matriks Ubat Alternatif & Semakan Interaksi Ubat', 'Matriks Gantian & Modal Interaksi']
            ],
            [12, 58, 30]
          ),
          createP(''),

          // ─────────────────────────────────────────────────────────────
          // BAB 1
          // ─────────────────────────────────────────────────────────────
          createH1('BAB 1: PENGENALAN SISTEM MYFORMULARI'),
          createP(
            'Modul MyFormulari merupakan pusat sehenti klinikal bagi rujukan ubat, keselamatan preskripsi, dan protokol farmaseutikal di bawah Hospital Operation Management Ecosystem (H.O.M.E.) Hospital Lawas. Sistem ini mematuhi sepenuhnya piawaian Formulari Ubat KKM (FUKKM Edisi Ke-4) dan Garis Panduan Keselamatan Ubat Kebangsaan.'
          ),
          createH2('1.1 Objektif Utama Modul'),
          createBullet('Menyediakan maklumat ubat rasmi KKM yang tepat, pantas, dan lengkap kepada doktor, ahli farmasi, dan jururawat.', '1. Rujukan Rasmi FUKKM:'),
          createBullet('Mencegah kesilapan pemberian ubat melalui amaran visual High Alert Medication (HAM) dan huruf TALL-Man bagi Look-Alike Sound-Alike (LASA).', '2. Keselamatan Pesakit:'),
          createBullet('Memastikan ubat dipreskrib mengikut kategori kuasa yang sah (A*, A, A/KK, B, C, C+).', '3. Kawalan Preskriber:'),
          createBullet('Menyeragamkan kaedah bancuhan serbuk vial, pelarutan IV, kepekatan maksima sekatan cecair, dan keserasian sambungan tiub Y-site.', '4. Standard Protokol IV:'),
          createBullet('Menyokong program Antimicrobial Stewardship (AMS) dengan panduan empirik mengikut sistem badan dan semakan 72 jam.', '5. Panduan NAG 2024:'),

          createCallout(
            'DASAR KESELAMATAN HOSPITAL LAWAS',
            'Semua anggota klinikal dimestikan membuat semakan dos, laluan, dan keserasian infusi dalam MyFormulari sebelum sebarang ubat suntikan atau berisiko tinggi diberikan kepada pesakit.',
            'danger'
          ),
          createP(''),

          // ─────────────────────────────────────────────────────────────
          // BAB 2
          // ─────────────────────────────────────────────────────────────
          createH1('BAB 2: NAVIGASI MODULE HUB & SUB-MENU KLINIKAL'),
          createP(
            'Pengguna boleh mengakses MyFormulari daripada Module Hub utama dengan mengklik kad berlabel "MyFormulari". Sistem akan membuka Sub-Menu Pilihan Modul Klinikal yang membahagikan ciri-ciri utama kepada 7 kad fungsi khusus.'
          ),
          createH2('2.1 Kad Pilihan Modul Klinikal MyFormulari'),
          createBullet('Carian menyeluruh mengikut nama generik, jenama, kod ATC, indikasi, dan kategori preskriber.', '1. Carian & Pengkatalogan Formulari:'),
          createBullet('Daftar ubat berisiko tinggi (elektrolit pekat, insulin, inotrop, opioid, NMBA) beserta SOP Semakan Berganda (IDC).', '2. Senarai Ubat Berisiko Tinggi (HAM):'),
          createBullet('Senarai pasangan ubat rupa serupa / bunyi serupa dengan penonjolan huruf TALL-man dan panduan pengasingan storan.', '3. Daftar Ubat LASA & TALL-Man:'),
          createBullet('Panduan bancuhan aseptik, pelarut yang serasi, kepekatan maksima sekatan cecair, dan keserasian Y-site.', '4. Pusat Protokol Rekonstitusi & Pelarutan IV:'),
          createBullet('Rejimen empirik lini pertama & kedua mengikut sistem badan, profilaksis surgeri (SAP), dan kriteria tukar IV-ke-Oral.', '5. Garis Panduan Antimikrobial (NAG 2024):'),
          createBullet('Pengesanan baki kuota bulanan fasiliti, amaran stok rendah, dan anggaran baki hari penggunaan ubat.', '6. Pemantauan Kuota & Amaran Stok:'),
          createBullet('Matriks ubat pengganti setara kelas atau lini kedua semasa berlaku ketiadaan bekalan.', '7. Matriks Ubat Alternatif:'),

          ...createRealImageBox(
            s01,
            'Sub-Menu MyFormulari di Module Hub — Menampilkan 4 Kad Metrik Utama dan 7 Pilihan Sub-Modul Klinikal'
          ),

          // ─────────────────────────────────────────────────────────────
          // BAB 3
          // ─────────────────────────────────────────────────────────────
          createH1('BAB 3: PAPAN PEMUKA CARIAN & PENAPISAN FUKKM'),
          createP(
            'Halaman Papan Pemuka Carian (/formulari/dashboard) membolehkan anggota klinikal mencari dan menapis lebih 1,420 ubat berdaftar dengan pantas.'
          ),
          createH2('3.1 Panduan Penggunaan Bar Carian & Penapis'),
          createBullet('Taip mana-mana nama generik (contoh: "ceftriaxone", "amoxicillin", "furosemide") atau nama jenama dagang.', '1. Kotak Carian Pintar:'),
          createBullet('Pilih kategori preskriber yang diingini (SEMUA, A*, A, A/KK, B, C, C+) untuk menyaring kelayakan preskripsi.', '2. Penapis Preskriber:'),
          createBullet('Tandakan penapis khas untuk melihat ubat HAM sahaja, ubat LASA sahaja, antibiotik NAG sahaja, atau ubat yang berstatus stok rendah.', '3. Suis Penapis Keselamatan:'),
          createBullet('Klik butang ikon di penjuru kanan atas untuk bertukar antara paparan jadual data atau grid kad visual.', '4. Suis Mod Paparan (Table / Grid):'),

          createH2('3.2 Matriks Kuasa Preskriber KKM'),
          createDocTable(
            ['Kategori', 'Pangkat / Kelayakan Preskriber', 'Tahap Kawalan', 'Contoh Ubat'],
            [
              ['A*', 'Pakar Perunding Kanan / Sub-Kepakaran', 'Kawalan Tertinggi (Specialist Only)', 'Meropenem, Linezolid, Chemotherapy'],
              ['A', 'Semua Pegawai Perubatan Pakar', 'Kawalan Pakar Disiplin', 'Ceftriaxone, Enoxaparin, Amiodarone'],
              ['A/KK', 'Pakar Hospital & Pakar Family Medicine (FMS)', 'Pakar Hospital & Klinik Kesihatan', 'Insulin Glargine, Telmisartan'],
              ['B', 'Semua Pegawai Perubatan (MO)', 'Preskripsi Am Doktor', 'Amoxicillin/Clav, Metformin, Amlodipine'],
              ['C', 'Pegawai Perubatan, PPP & Jururawat', 'Rawatan Asas / Dispensari', 'Paracetamol, ORS, Chlorpheniramine'],
              ['C+', 'Penggunaan Protokol Kecemasan Khas', 'Kecemasan / Kebenaran Khas', 'Adrenaline (Anafilaksis), IV Normal Saline']
            ],
            [12, 38, 28, 22]
          ),
          createP(''),

          ...createRealImageBox(
            s02,
            'Papan Pemuka Carian & Pengkatalogan Formulari Ubat (FUKKM Edisi Ke-4) Hospital Lawas'
          ),

          // ─────────────────────────────────────────────────────────────
          // BAB 4
          // ─────────────────────────────────────────────────────────────
          createH1('BAB 4: MONOGRAF KLINIKAL UBAT TERPERINCI'),
          createP(
            'Mengklik mana-mana ubat akan membuka Monograf Klinikal Lengkap (/formulari/drug/:id). Monograf ini disusun secara sistematik ke dalam 8 tab interaktif:'
          ),
          createBullet('Menampilkan kod rasmi KKM, kod ATC, skim perolehan (APPL/CCDP/LP), kategori racun, indikasi klinikal, dan kontraindikasi.', 'Tab 1: Ringkasan & Indikasi:'),
          createBullet('Dos dewasa, dos pediatrik (mg/kg), laluan pentadbiran, kesan sampingan, dan kalkulator Cockcroft-Gault CrCl terbina dalam.', 'Tab 2: Dos & Pentadbiran:'),
          createBullet('Status Kehamilan (BOLEH / WASPADA / DILARANG) dengan penerangan trimester, kategori FDA (A/B/C/D/X), status penyusuan ibu, dan alternatif selamat.', 'Tab 3: Kehamilan & Penyusuan:'),
          createBullet('Amaran keselamatan pesakit, status HAM, dan pasangan keliru LASA.', 'Tab 4: Amaran & Keselamatan HAM/LASA:'),
          createBullet('Kaedah bancuhan vial serbuk, pelarut yang serasi, kepekatan maksima, dan keserasian tiub Y-site.', 'Tab 5: Pelarutan IV & Bancuhan:'),
          createBullet('Suhu penyimpanan rasmi, jangka hayat asal, kestabilan selepas dibancuh, dan polisi Multi-Dose Vial (28 hari).', 'Tab 6: Jangka Hayat & Storan:'),
          createBullet('Tingkatan sekatan NAG (Free/Restricted/Reserve), kriteria tukar IV-ke-Oral, dan semakan 72 jam AMS.', 'Tab 7: Panduan NAG (Antimikrobial):'),
          createBullet('Cadangan ubat pengganti setara terapeutik sekiranya ubat mengalami kehabisan bekalan.', 'Tab 8: Ubat Alternatif:'),

          ...createRealImageBox(
            s03,
            'Monograf Klinikal Ubat (Ceftriaxone Sodium 1g Injection) — Tab Ringkasan, Indikasi & Kategori Preskriber'
          ),

          createH2('4.1 Panduan Keselamatan Kehamilan & Penyusuan Ibu'),
          createP(
            'Tab Kehamilan & Penyusuan memberikan status Crystal Clear yang mudah difahami oleh preskriber bagi mengelakkan risiko teratogenik kepada janin dan bayi:'
          ),

          ...createRealImageBox(
            s04,
            'Tab Kehamilan & Penyusuan — Status Keselamatan Trimester, Nasihat Pemantauan Bayi & Alternatif Selamat'
          ),

          // ─────────────────────────────────────────────────────────────
          // BAB 5
          // ─────────────────────────────────────────────────────────────
          createH1('BAB 5: PENGENDALIAN UBAT BERISIKO TINGGI (HAM)'),
          createP(
            'Halaman Senarai Ubat Berisiko Tinggi (/formulari/ham) menyenaraikan semua ubat yang memerlukan kawalan rapi bagi mengelakkan kemudaratan maut kepada pesakit.'
          ),
          createH2('5.1 4 Prinsip Wajib Pengendalian HAM di Wad & Unit'),
          createBullet('Semua ampul, botol infusi, dan picagari HAM mesti dilekatkan pelekat merah menyala berlabel "HIGH ALERT MEDICATION".', '1. Label Merah Mandatori:'),
          createBullet('Elektrolit pekat dan NMBA DILARANG disimpan di meja rawatan terbuka. Mesti disimpan dalam laci/loker berkunci khas.', '2. Pengasingan Storan Berkunci:'),
          createBullet('Dua jururawat berdaftar atau seorang doktor dan jururawat WAJIB menyemak secara bebas: Nama Pesakit, Nama Ubat, Dos, Kiraan Kepekatan, dan Had Laju Pam Infusi.', '3. Independent Double Check (IDC):'),
          createBullet('Dilarang membancuh ubat HAM lebih awal tanpa arahan khusus pesakit tertentu bagi mengelakkan kekeliruan picagari.', '4. Larangan Bancuhan Awal:'),

          ...createRealImageBox(
            s05,
            'Halaman Senarai Ubat Berisiko Tinggi (HAM) — Menampilkan 4 Prinsip Keselamatan KKM & Daftar Ubat'
          ),

          // ─────────────────────────────────────────────────────────────
          // BAB 6
          // ─────────────────────────────────────────────────────────────
          createH1('BAB 6: DAFTAR UBAT LASA & PROTOKOL TALL-MAN LETTERING'),
          createP(
            'Halaman Daftar Ubat LASA (/formulari/lasa) memaparkan pasangan ubat rupa serupa / bunyi serupa dengan penonjolan huruf TALL-man untuk mengelakkan kesilapan pendispensan di farmasi dan wad.'
          ),
          createH2('6.1 Contoh Pasangan LASA & Pengasingan Storan'),
          createBullet('DOBUTamine (Inotropik) vs DOPAmine (Vasopresor / Inotropik) — Disimpan di laci berasingan dengan penanda warna.', '• DOBUTamine vs DOPAmine:'),
          createBullet('hydrALAZINE (Vasodilator) vs hydrOXYzine (Antihistamin Sedatif) — Bekas storan warna berbeza.', '• hydrALAZINE vs hydrOXYzine:'),
          createBullet('predniSONE vs predniSOLONE — Perbezaan formulasi dan potensi steroid.', '• predniSONE vs predniSOLONE:'),

          ...createRealImageBox(
            s06,
            'Daftar Pasangan Ubat LASA & Panduan Huruf TALL-Man Lettering KKM'
          ),

          // ─────────────────────────────────────────────────────────────
          // BAB 7
          // ─────────────────────────────────────────────────────────────
          createH1('BAB 7: PUSAT PROTOKOL REKONSTITUSI & PELARUTAN IV'),
          createP(
            'Halaman Protokol Pelarutan IV (/formulari/dilution) menyediakan rujukan lengkap bancuhan ubat suntikan aseptik, pelarut yang serasi (Water for Injection, Normal Saline 0.9%, Dextrose 5%), isipadu sesaran serbuk, kepekatan maksima sekatan cecair, dan keserasian tiub Y-site.'
          ),

          ...createRealImageBox(
            s07,
            'Pusat Protokol Rekonstitusi, Pelarutan IV & Keserasian Y-Site'
          ),

          // ─────────────────────────────────────────────────────────────
          // BAB 8
          // ─────────────────────────────────────────────────────────────
          createH1('BAB 8: GARIS PANDUAN ANTIMIKROBIAL KEBANGSAAN (NAG 2024)'),
          createP(
            'Halaman Garis Panduan NAG (/formulari/antimicrobial) memaparkan rejimen antibiotik empirik lini pertama dan kedua mengikut sistem badan (Respiratori, Saluran Kencing, Kulit & Tisu Lembut, Sistem Saraf, Intra-Abdominal, Sepsis, dan Profilaksis Surgeri SAP).'
          ),
          createH2('8.1 Protokol Semakan 72 Jam Antimicrobial Stewardship (AMS)'),
          createBullet('Mulakan antibiotik empirik berspektrum sesuai dan hantar spesimen kultur sebelum dos pertama.', 'Hari 0:'),
          createBullet('Semak keputusan awal pewarnaan Gram dan kultur darah/urin.', '24 - 48 Jam:'),
          createBullet('Lakukan penilaian semula mandatori: De-eskalasi kepada antibiotik berspektrum sempit, laras dos renal, atau tukar kepada antibiotik oral sekiranya pesakit stabil.', '72 Jam (Mandatori):'),

          ...createRealImageBox(
            s08,
            'Garis Panduan Antimikrobial Kebangsaan (NAG 2024) Mengikut Sistem Badan'
          ),

          // ─────────────────────────────────────────────────────────────
          // BAB 9
          // ─────────────────────────────────────────────────────────────
          createH1('BAB 9: PEMANTAUAN KUOTA FASILITI & AMARAN STOK'),
          createP(
            'Halaman Pemantauan Kuota (/formulari/quota) membolehkan pihak farmasi dan pentadbiran hospital menjejak peratusan penggunaan kuota bulanan ubat, paras amaran stok rendah, serta unjuran baki hari sebelum stok habis.'
          ),

          ...createRealImageBox(
            s09,
            'Halaman Pemantauan Kuota Bulanan Fasiliti & Amaran Stok Rendah'
          ),

          // ─────────────────────────────────────────────────────────────
          // BAB 10
          // ─────────────────────────────────────────────────────────────
          createH1('BAB 10: MATRIKS UBAT ALTERNATIF & SEMAKAN INTERAKSI'),
          createP(
            'Sekiranya berlaku gangguan bekalan ubat, halaman Matriks Ubat Alternatif (/formulari/alternatives) menyarankan ubat pengganti setara terapeutik yang diluluskan KKM.'
          ),

          ...createRealImageBox(
            s10,
            'Matriks Ubat Alternatif & Cadangan Penggantian Terapeutik KKM'
          ),

          createH2('10.1 Alat Semak Interaksi Ubat (Drug Interaction Modal)'),
          createP(
            'Butang "Semak Interaksi Ubat" pada bahagian atas Papan Pemuka membolehkan pengguna memilih 2 atau lebih ubat untuk mengesan interaksi berbahaya secara automatik:'
          ),

          ...createRealImageBox(
            s11,
            'Modal Semakan Interaksi Ubat — Mengesan Interaksi Ubat Berbahaya Secara Automatik'
          ),

          // ─────────────────────────────────────────────────────────────
          // PENGESAHAN DOKUMEN
          // ─────────────────────────────────────────────────────────────
          createH1('PENGESAHAN & KELULUSAN DOKUMEN'),
          createP('Dokumen Panduan Pengguna Rasmi MyFormulari ini disahkan untuk kegunaan operasi klinikal Hospital Lawas:'),
          createP(''),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 6, color: COLOR_PRIMARY },
                      bottom: { style: BorderStyle.SINGLE, size: 6, color: COLOR_PRIMARY },
                      left: { style: BorderStyle.SINGLE, size: 6, color: COLOR_PRIMARY },
                      right: { style: BorderStyle.SINGLE, size: 6, color: COLOR_PRIMARY }
                    },
                    margins: { top: 140, bottom: 140, left: 160, right: 160 },
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: 'Disediakan Oleh:', bold: true, size: 19, color: COLOR_PRIMARY })],
                        spacing: { after: 100 }
                      }),
                      new Paragraph({
                        children: [new TextRun({ text: '........................................................', color: COLOR_MUTED })],
                        spacing: { after: 50 }
                      }),
                      new Paragraph({
                        children: [new TextRun({ text: 'PEGAWAI FARMASI KLINIKAL (UF48/UF52)', bold: true, size: 17 })],
                        spacing: { after: 30 }
                      }),
                      new Paragraph({
                        children: [new TextRun({ text: 'Jabatan Farmasi, Hospital Lawas', size: 17, color: COLOR_MUTED })]
                      })
                    ]
                  }),
                  new TableCell({
                    shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 6, color: COLOR_PRIMARY },
                      bottom: { style: BorderStyle.SINGLE, size: 6, color: COLOR_PRIMARY },
                      left: { style: BorderStyle.SINGLE, size: 6, color: COLOR_PRIMARY },
                      right: { style: BorderStyle.SINGLE, size: 6, color: COLOR_PRIMARY }
                    },
                    margins: { top: 140, bottom: 140, left: 160, right: 160 },
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: 'Disemak & Disahkan Oleh:', bold: true, size: 19, color: COLOR_PRIMARY })],
                        spacing: { after: 100 }
                      }),
                      new Paragraph({
                        children: [new TextRun({ text: '........................................................', color: COLOR_MUTED })],
                        spacing: { after: 50 }
                      }),
                      new Paragraph({
                        children: [new TextRun({ text: 'KETUA UNIT FARMASI (UF54)', bold: true, size: 17 })],
                        spacing: { after: 30 }
                      }),
                      new Paragraph({
                        children: [new TextRun({ text: 'Hospital Lawas, Sarawak', size: 17, color: COLOR_MUTED })]
                      })
                    ]
                  }),
                  new TableCell({
                    shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 6, color: COLOR_PRIMARY },
                      bottom: { style: BorderStyle.SINGLE, size: 6, color: COLOR_PRIMARY },
                      left: { style: BorderStyle.SINGLE, size: 6, color: COLOR_PRIMARY },
                      right: { style: BorderStyle.SINGLE, size: 6, color: COLOR_PRIMARY }
                    },
                    margins: { top: 140, bottom: 140, left: 160, right: 160 },
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: 'Diluluskan Oleh:', bold: true, size: 19, color: COLOR_PRIMARY })],
                        spacing: { after: 100 }
                      }),
                      new Paragraph({
                        children: [new TextRun({ text: '........................................................', color: COLOR_MUTED })],
                        spacing: { after: 50 }
                      }),
                      new Paragraph({
                        children: [new TextRun({ text: 'PENGARAH HOSPITAL (GRED UTAMA/UD54)', bold: true, size: 17 })],
                        spacing: { after: 30 }
                      }),
                      new Paragraph({
                        children: [new TextRun({ text: 'Hospital Lawas, Sarawak', size: 17, color: COLOR_MUTED })]
                      })
                    ]
                  })
                ]
              })
            ]
          })
        ]
      }
    ]
  })

  console.log('Packing Word document buffer with real screenshots...')
  const buffer = await Packer.toBuffer(doc)
  fs.writeFileSync(OUTPUT_DOCX, buffer)
  console.log(`Document successfully updated at: ${OUTPUT_DOCX} (${buffer.length} bytes)`)
}

buildDocument().catch(err => {
  console.error('Error generating document:', err)
  process.exit(1)
})
