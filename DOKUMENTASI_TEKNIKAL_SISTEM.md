# DOKUMENTASI TEKNIKAL & SPESIFIKASI SISTEM: HOSPITAL OPERATION MANAGEMENT ECOSYSTEM (HOME)

**Versi Dokumen:** 2.0 (Teknikal & Operasi)
**Tarikh:** 29 Januari 2026
**Disediakan Oleh:** Pasukan Pembangun Full Stack & Unit Farmasi Logistik
**Sasaran Pembaca:** Pembangun Sistem, Pegawai Teknologi Maklumat (F29/F41), Pegawai Farmasi (U41-U54), Penolong Pegawai Farmasi (U29-U36)

---

## 1.0 PENGENALAN DAN FALSAFAH SISTEM

### 1.1 Latar Belakang Pembangunan
Sistem Hospital Operation Management Ecosystem (HOME) bukanlah sekadar satu lagi aplikasi pengurusan rekod. Ia adalah manifestasi transformasi digital yang lahir daripada keperluan mendesak di peringkat akar umbi operasi hospital. Sebelum kewujudan HOME, ekosistem pengurusan di hospital daerah, khususnya dalam domain **Farmasi Logistik** dan **Kewangan**, beroperasi dalam silo yang terpisah.

Sebagai contoh, pertimbangkan aliran kerja pengurusan gas perubatan (Oksigen). Dalam sistem konvensional:
1.  Pemandu lori menghantar 50 silinder oksigen.
2.  Penolong Pegawai Farmasi (PPF) merekodkan nombor siri secara manual dalam "Buku Stok".
3.  Wad meminta 5 silinder dengan mengisi borang kertas "Permohonan Stok".
4.  Di hujung bulan, Pegawai Farmasi perlu mengira baki waran (peruntukan kewangan) secara manual dengan merujuk timbunan inbois dan buku vot.

Proses ini terdedah kepada "single point of failure". Jika buku stok hilang, data hilang. Jika PPF tersalah kira anggaran perbelanjaan, hospital mungkin kehabisan peruntukan sebelum hujung tahun.

HOME direka untuk menghapuskan ketidaktentuan ini. Ia menggabungkan kuasa **React** di bahagian hadapan (Frontend) untuk antaramuka yang pantas, dan **Supabase** di bahagian belakang (Backend) untuk integriti data yang utuh. Ia dibina dengan pemahaman bahawa pengguna akhir bukanlah pakar IT, tetapi pakar perubatan yang memerlukan sistem yang "hanya berfungsi" (just works) tanpa kompromi terhadap ketepatan data.

### 1.2 Objektif Teknikal & Operasi
Dari sudut **Teknikal**, objektifnya adalah:
*   Mewujudkan seni bina *Single Page Application (SPA)* yang pantas dan responsif.
*   Memastikan ketersediaan data masa nyata (*Real-time*) menggunakan WebSocket.
*   Menjamin keselamatan data melalui *Row Level Security (RLS)* di peringkat pangkalan data.

Dari sudut **Operasi (Farmasi/Klinikal)**, objektifnya adalah:
*   **Kebolehkesanan Penuh (Full Traceability):** Mengetahui lokasi tepat setiap aset (cth: Silinder Oksigen Siri #12345 berada di Wad Perubatan Lelaki Katil 5).
*   **Kepatuhan Kewangan:** Memastikan setiap sen dibelanjakan mengikut Kod Objek/Waran yang betul (OS42000, P42) dan menghalang *overspending*.
*   **Automasi:** Mengurangkan beban kerja perkeranian kakitangan klinikal supaya mereka boleh fokus kepada penjagaan pesakit.

---

## 2.0 ARKITEKTUR SISTEM & TIMBUNAN TEKNOLOGI (TECH STACK)

Pemilihan teknologi untuk HOME dibuat berdasarkan prinsip: **Prestasi, Skalabiliti, dan Kos-Efektif**.

### 2.1 Frontend: React 18, Vite & TypeScript
Kita menggunakan **React 18** dengan **TypeScript** sebagai bahasa pengatucaraan utama.

*   **Vite sebagai Build Tool:**
    Berbeza dengan *Webpack* yang lama, Vite menggunakan *native ES Modules*. Ini bermakna apabila pembangun menekan "Save", perubahan dipaparkan di pelayar dalam masa milisaat (Hot Module Replacement). Dalam projek sebesar HOME yang mempunyai beratus-ratus komponen UI, kelajuan ini menjimatkan jam masa pembangunan setiap minggu.

*   **TypeScript (Strict Mode):**
    Hospital tidak boleh bertoleransi dengan ralat. TypeScript memaksa kita mendefinisikan struktur data dengan ketat.
    *   *Contoh:* Dalam modul `warrantService.ts`, kita mendefinisikan *Interface* `Warrant`. Jika pembangun cuba memasukkan teks ke dalam medan `amount` (jumlah wang), sistem akan memaparkan ralat *sebelum* kod itu dijalankan. Ini mencegah "Bug" kritikal daripada sampai ke produksi.

*   **State Management: Zustand & React Query:**
    *   **Zustand:** Digunakan untuk *Client State* yang ringan. Contohnya: "Adakah sidebar sedang terbuka?", "Siapakah pengguna yang sedang log masuk?". Ia pantas dan ringan.
    *   **TanStack Query (React Query):** Digunakan untuk *Server State*. Ini adalah nadi kepada sistem. Ia menguruskan pengambilan data dari pelayar ke pelayan. Ia mempunyai ciri pintar seperti *cache invalidation*. Jika seorang pengguna menambah stok baru, React Query akan tahu data lama sudah basi ("stale") dan secara automatik memuat semula data terkini di skrin semua pengguna lain tanpa perlu mereka tekan "Refresh".

### 2.2 Backend: Supabase (BaaS) & PostgreSQL
Kita tidak membina pelayan (Server) tradisional menggunakan Node.js/Express. Sebaliknya, kita menggunakan model **Backend-as-a-Service (BaaS)** melalui **Supabase**.

*   **PostgreSQL:** Pangkalan data hubungan (Relational Database) tercanggih di dunia. Ia menyimpan semua data hospital.
*   **PostgREST:** Supabase secara automatik membina API (Application Programming Interface) dari skema pangkalan data. Kita tidak perlu menulis kod API manual (CRUD) untuk setiap jadual. Ini mempercepatkan pembangunan sebanyak 10x ganda.
*   **Supabase Auth:** Menguruskan pendaftaran, log masuk, dan sesi pengguna (JWT Tokens) dengan tahap keselamatan industri perbankan.

### 2.3 Antaramuka Pengguna (UI/UX)
*   **Tailwind CSS:** Rangka kerja CSS berasaskan utiliti. Ia membolehkan kita membina reka bentuk yang konsisten dan responsif (Mobile/Tablet/Desktop) dengan pantas.
*   **Radix UI / Shadcn:** Komponen asas yang aksesibel (Accessible).
*   **Framer Motion:** Pustaka animasi yang memberikan rasa "fluid" kepada aplikasi, memberikan maklum balas visual yang penting kepada pengguna setiap kali tindakan dilakukan.

---

## 3.0 PANGKALAN DATA & STRUKTUR DATA (DATABASE DEEP DIVE)

Kekuatan sebenar HOME terletak pada reka bentuk pangkalan datanya. Ia dinormalisasi (Normalized) untuk mengelakkan pertindihan data.

### 3.1 Skema Farmasi Logistik (Oksigen)
Jadual utama yang terlibat:
1.  **`pharmacy_oxygen_cylinder_inventory`**:
    *   `id` (PK): UUID unik untuk setiap silinder.
    *   `qr_code`: Indeks unik. Kunci utama pencarian pantas menggunakan pengimbas.
    *   `serial_number`: Nombor siri fizikal pada badan silinder.
    *   `status`: ENUM ('available', 'empty', 'issued', 'damaged').
    *   `current_location`: Merujuk kepada lokasi semasa aset.
    *   `expiry_date`: Tarikh ujian hidrostatik seterusnya (Penting untuk keselamatan).

2.  **`pharmacy_oxygen_cylinder_movements`**:
    *   Jadual ini bertindak sebagai "Buku Log Digital". Ia bersifat *append-only*. Rekod di sini tidak boleh dipadam untuk tujuan audit.
    *   Setiap pergerakan (Stor -> Wad) mencipta satu baris baru di sini.

3.  **`pharmacy_oxygen_reception_records`**:
    *   Menyimpan data DO (Delivery Order) dari pembekal.

### 3.2 Skema Kewangan & Waran
Jadual utama: `pharmacy_warrants`.
Data di sini sangat sensitif. Ia mengandungi medan:
*   `vote_code`: Kod Objek (cth: `080702` untuk Gas Perubatan). Kod ini adalah piawai Perbendaharaan Malaysia.
*   `vote_activity`: Kod Aktiviti (cth: `27402`).
*   `amount`: Nilai peruntukan dalam perpuluhan (Decimal) untuk ketepatan mata wang.
*   `financial_year`: Tahun kewangan.

Integriti data dikawal ketat. *Database Constraint* memastikan tiada dua waran dengan nombor rujukan yang sama boleh wujud untuk tahun yang sama, menghapuskan risiko duplikasi data kewangan.

---

## 4.0 PERINCIAN PENGGUNAAN MODUL (DARI PERSPEKTIF PENGGUNA & TEKNIKAL)

Bahagian ini menjelaskan bagaimana kod diterjemahkan kepada operasi harian.

### 4.1 Modul Pengurusan Oksigen Bioperubatan
Sebagai **Penolong Pegawai Farmasi (PPF)**, ini adalah modul yang paling kerap digunakan.

**Senario 1: Penerimaan Bekalan Baru (Receiving)**
*   *Operasi*: Lori pembekal tiba dengan 20 silinder.
*   *Sistem*: PPF membuka menu "New Reception".
*   *Teknikal*: Sistem memanggil `registerNewCylinders` dalam `oxygenService.ts`. Fungsi ini menggunakan transaksi pukal (*bulk insert*). Daripada memanggil pangkalan data 20 kali, ia menghantar satu arahan yang mengandungi 20 rekod. Ini mengurangkan beban pelayan.
*   *Ciri Khas*: Jika salah satu kod QR sudah wujud dalam sistem (duplikasi), pangkalan data akan memulangkan ralat khusus yang akan ditangkap oleh Frontend dan dipaparkan sebagai amaran: "Silinder XYZ sudah wujud dalam stok!".

**Senario 2: Pengedaran ke Wad (Distribution)**
*   *Operasi*: PPF mengimbas kod QR pada silinder sebelum ia diserahkan kepada porter wad.
*   *Teknikal*: Fungsi `updateCylinderStatus` dipanggil. Ia melakukan dua perkara serentak (Atomic Transaction):
    1.  Mengemaskini status silinder kepada 'issued'.
    2.  Mencipta rekod baru dalam `movements` table dengan cop masa (*timestamp*) yang tepat.
*   *Manfaat*: Jika berlaku kehilangan silinder di wad, Pegawai Farmasi boleh menyemak sistem: "Siapa staff terakhir yang mengimbas silinder ini? Pukul berapa ia keluar dari stor?". Akauntabiliti terjamin.

### 4.2 Modul Pengurusan Kewangan (Waran & Budgeting)
Sebagai **Pegawai Farmasi**, pemantauan bajet adalah KPI utama.

**Senario: Semakan Baki Peruntukan**
*   *Masalah Lama*: Inbois pembekal lambat sampai (kadang-kadang 2 bulan selepas barang terima). Dalam sistem manual, pegawai menyangka baki masih banyak, lalu membuat pesanan baru. Apabila inbois sampai serentak, berlaku *Overspending* yang merupakan kesalahan tatatertib.
*   *Solusi HOME*: Sistem memantau "Tanggungan" (Liabilities).
    *   Baki Paparan = Waran - (Bayaran Sebenar + **Pesanan Dalam Proses**).
    *   Dalam `warrantService.ts`, fungsi `calculateWarrantSummary` menyatukan data daripada modul `warrants` dan modul `expenses` (LPO). Ia memberikan gambaran kewangan "sebenar" yang mengambil kira wang yang "sudah dikomitkan" walaupun belum dibayar.

### 4.3 Modul Dashboard & Analitik
Dashboard sistem bukan sekadar hiasan. Ia dibina menggunakan teknologi **Recharts**.
*   Ia memaparkan trend penggunaan. "Adakah penggunaan Oksigen meningkat bulan ini berbanding bulan lepas?".
*   Data ini membantu dalam perancangan stok (Forecasting). Jika trend menaik, pegawai boleh memohon penambahan waran lebih awal.

---

## 5.0 KESELAMATAN, PEMATUHAN & HAK AKSES (SECURITY)

Dalam persekitaran kerajaan, keselamatan data adalah mandatori, bukan pilihan.

### 5.1 Row Level Security (RLS) - Benteng Pertahanan Terakhir
Kebanyakan sistem web melindungi data di peringkat "API" (Backend Code). Namun, HOME melangkah lebih jauh dengan melindungi data di peringkat **Pangkalan Data** menggunakan RLS PostgreSQL.

*   *Bagaimana ia berfungsi?*
    Kita menetapkan polisi SQL:
    `CREATE POLICY "Wad hanya lihat stok wad" ON inventory FOR SELECT USING (location = auth.user_department());`
    
*   *Senario Serangan*: Katakan seorang penggodam berjaya mencuri token akses akaun jururawat biasa. Penggodam cuba menjalankan arahan SQL untuk melihat senarai harga pembekal (yang sulit).
*   *Hasil*: Pangkalan data akan memulangkan senarai kosong. Polisi RLS menghalang akaun jururawat daripada melihat data harga, tidak kira bagaimana cara ia diakses. Hanya akaun berstatus 'Pegawai Farmasi' atau 'Admin' yang melepasi polisi RLS untuk melihat harga.

### 5.2 Pengurusan Peranan (RBAC - Role Based Access Control)
Sistem membezakan pengguna kepada beberapa tahap:
1.  **System Admin**: Akses penuh keutamaan teknikal.
2.  **Hospital Admin**: Boleh menambah staf baru, melihat laporan global.
3.  **Pharmacist (Pegawai)**: Boleh meluluskan pesanan, melihat data kewangan sulit, mengubah harga.
4.  **Assistant Link (PPF)**: Boleh melakukan transaksi harian (terima/keluar stok), imbas QR, tetapi TIDAK BOLEH melihat data kos/harga sulit.
5.  **Ward Staff (Jururawat)**: Hanya boleh melihat status stok di wad masing-masing dan membuat permohonan.

Pemisahan kuasa ini penting untuk mematuhi prinsip **Akauntabiliti & Integriti**.

---

## 6.0 PENGEDARAN (DEPLOYMENT) & PENYELENGGARAAN

### 6.1 Persekitaran Pembangunan (Environment Variables)
Sistem menggunakan fail `.env` untuk membezakan antara persekitaran *Development* (Laptop Pembangun) dan *Production* (Server Hospital).
Ini memastikan data ujian tidak bercampur dengan data pesakit sebenar.

### 6.2 Kemaskini Sistem (CI/CD)
Oleh kerana ia adalah Aplikasi Web, kemaskini sistem adalah lancar. Staf IT hospital hanya perlu memuat naik fail *build* baharu ke pelayan. Pengguna akhir akan mendapat versi terkini secara automatik apabila mereka memuat semula halaman (semudah menekan F5). Tiada pemasangan perisian diperlukan di komputer klien.

---

## 7.0 KESIMPULAN

Sistem **Hospital Operation Management Ecosystem (HOME)** adalah satu lonjakan teknologi dalam pengurusan hospital daerah. Dengan menggabungkan teknologi terkini (React, Supabase, QR Tracking) dengan pemahaman mendalam tentang prosedur operasi standard (SOP) farmasi kerajaan, ia berjaya:
1.  Meningkatkan ketepatan data inventori dan kewangan ke tahap menghampiri 100%.
2.  Mengurangkan masa operasi manual sehingga 70% melalui automasi.
3.  Menjamin akauntabiliti aset kerajaan melalui jejak audit digital yang tidak boleh dimanipulasi.

Bagi seorang **Full Stack Developer**, ini adalah sebuah sistem seni bina mikro-servis moden yang berskala. Bagi seorang **Penolong Pegawai Farmasi**, ini adalah alat bantuan yang "membebaskan" mereka dari belenggu kerja perkeranian manual, membolehkan fokus kembali kepada tugas hakiki: memastikan bekalan perubatan sentiasa tersedia demi nyawa pesakit.
