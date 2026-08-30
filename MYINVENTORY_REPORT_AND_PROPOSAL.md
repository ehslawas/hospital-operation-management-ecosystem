# LAPORAN TEKNIKAL MODUL MYINVENTORY & KERTAS KERJA CADANGAN PELAKSANAAN DIGITAL KEW.PS-4

---

# BAHAGIAN 1: LAPORAN LENGKAP MODUL MYINVENTORY

## 1.0 Pengenalan & Ringkasan Eksekutif
Modul **MyInventory** merupakan sub-sistem pengurusan inventori dan stor perubatan pintar yang dibangunkan khusus dalam ekosistem pengurusan operasi hospital. Modul ini direka cipta untuk mentransformasikan pengurusan stok farmasi dan stor bekalan perubatan daripada kaedah manual yang terdedah kepada ralat aritmetik dan kehilangan rekod, kepada sistem digital berketepatan tinggi berasaskan kod QR dan pematuhan peraturan kerajaan.

Sistem ini merekodkan pergerakan masuk (penerimaan), pergerakan keluar (pengeluaran), pelarasan baki, pemantauan tarikh luput mengikut prinsip **FEFO (*First-Expiry, First-Out*)**, serta menjana lejar **KEW.PS-4 (Kad Petak)** secara automatik dalam masa-nyata (*real-time*).

```
                            ┌────────────────────────────────────────┐
                            │          MODUL MYINVENTORY             │
                            └───────────────────┬────────────────────┘
                                                │
         ┌────────────────────────┬─────────────┴────────────┬────────────────────────┐
         ▼                        ▼                          ▼                        ▼
┌─────────────────┐      ┌─────────────────┐        ┌─────────────────┐      ┌─────────────────┐
│  DASHBOARD KPI  │      │  PENGIMBAS QR   │        │ LEJAR KEW.PS-4  │      │ VERIFIKASI STOR │
│  & AMARAN STOK  │      │  & LOG GERAKAN  │        │ (CETAKAN RASMI) │      │  (KEW.PS-14)    │
└─────────────────┘      └─────────────────┘        └─────────────────┘      └─────────────────┘
```

---

## 2.0 Senibina Sistem & Ciri-Ciri Utama

### 2.1 Pematuhan Format Piawai KEW.PS-4 (Kementerian Kewangan Malaysia)
Modul ini mengekalkan 100% struktur data standard yang ditetapkan oleh Pekeliling Pengurusan Stor Kerajaan:
* **Bahagian A (Maklumat Kawalan):** No. Kad, Kod Barang, Perihal Stok, Lokasi Simpanan, Kumpulan Stok, Kuantiti Minimum, Maksimum, dan Paras Menokok (*Reorder Level*).
* **Bahagian B (Transaksi Pergerakan):** Tarikh, No. Rujukan Dokumen (LPO/DO/Indent), Diterima Daripada / Dikeluarkan Kepada, Kuantiti Terima, Kuantiti Keluar, Baki Semasa, No. Kelompok (*Batch No*), Tarikh Luput, dan ID Pegawai Bertanggungjawab.

### 2.2 Mekanisme Imbasan Kod QR (*QR Code Tagging & Live Scanner*)
* **Tag Rak Berkod QR:** Setiap lokasi petak/rak ubat dilengkapi label kod QR unik (`MYINV:ITEM_CODE:LOC`).
* **Pengimbas Kamera Bersepadu:** Staf stor hanya perlu mengimbas kod QR petak menggunakan kamera peranti untuk membuka lejar stok dan merekod transaksi penerimaan/pengeluaran dalam masa kurang daripada 5 saat.
* **Maklum Balas Audio (*Web Audio API*):** Sistem dilengkapi isyarat dwiton (*double chirp*) untuk transaksi berjaya dan amaran audio bagi sebarang ralat imbasan.

### 2.3 Enjin FEFO & Amaran Tarikh Luput Automatik
* **Pengisihan Pintar Kelompok:** Apabila pesanan/pengeluaran dibuat, sistem secara automatik mencadangkan kelompok ubat yang mempunyai tarikh luput paling hampir untuk dikeluarkan terlebih dahulu.
* **Sistem Amaran Awal:** Memberi notifikasi visual berkod warna untuk stok:
  * 🔴 *Kritikal:* Luput dalam tempoh $\le 1$ bulan.
  * 🟠 *Amaran Sederhana:* Luput dalam tempoh 3 bulan.
  * 🟡 *Amaran Awal:* Luput dalam tempoh 6 bulan.

### 2.4 Pematuhan Integriti Data (*Double-Entry Transaction & Audit Trail*)
* **Invarian Baki Sifar-Negatif:** Sistem menyekat sebarang percubaan pengeluaran melebihi baki fizikal kelompok sedia ada.
* **Jejak Audit Kekal (*Immutable Log*):** Setiap transaksi merekodkan UUID staf, cap masa (*timestamp*), serta pautan ke no rujukan pesanan asal.

### 2.5 Modul Verifikasi Stor & Baki Bawa Ke Hadapan (*Bring Forward*)
* Menyokong proses semakan fizikal tahunan (**KEW.PS-14**) dengan pengiraan perbezaan stok (*variance log*).
* Menyediakan fungsi *Bring Forward* (Tutup Buku Tahunan) untuk memindahkan baki akhir tahun ke lembaran baharu secara automatik.

### 2.6 Penjanaan Dokumen On-Demand (PDF / Cetakan Rasmi)
* Sistem berupaya menjana dan mencetak salinan fizikal lejar KEW.PS-4 berformat lengkap dengan lambang **Jata Negara** pada bila-bila masa bagi memenuhi keperluan audit fizikal di stor.

---

## 3.0 Analisis Impak Operasi: Mod Manual vs Mod Digital MyInventory

| Parameter Penilaian | Kad Petak Fizikal Tradisional | Mod Digital MyInventory | Impak & Faedah |
| :--- | :--- | :--- | :--- |
| **Masa Perekodan Setiap Transaksi** | 2 - 3 minit (Cari kad, tulis pen merah/biru, kira tolak/tambah) | **< 10 saat** (Imbas QR, masukkan angka, auto-rekod) | **Penjimatan masa $\ge 85\%$** bagi staf farmasi/stor. |
| **Ketepatan Aritmetik Baki** | Risiko ralat manual $\approx 8 - 15\%$ akibat kesilapan kiraan staf. | **Ketepatan 100%** (Pengiraan automatik berasaskan pangkalan data). | Menghapuskan teguran audit berkaitan percanggahan baki. |
| **Risiko Kehilangan / Kerosakan Rekod** | Kad boleh koyak, basah, hilang, atau tertumpah bahan cecair. | **Data kekal dalam pelayan selamat** dengan sandaran berkala. | Jaminan ketersediaan data $99.9\%$. |
| **Kawalan Ubat Luput (FEFO)** | Bergantung kepada semakan manual mata staf. | **Automatik** melalui algoritma FEFO. | Mengurangkan kerugian hapus kira ubat luput (*zero expired wastage*). |
| **Kos Kertas & Cetakan Kad** | Ribuan kad manila dicetak setiap tahun di peringkat hospital. | **Sifar kos kad fizikal** harian. | Menjimatkan perbelanjaan pentadbiran hospital. |

---
---

# BAHAGIAN 2: KERTAS KERJA CADANGAN RASMI KEPADA PENGARAH HOSPITAL

```
KERTAS KERJA CADANGAN:
PELAKSANAAN MODUL DIGITAL KEW.PS-4 (MYINVENTORY) BERASASKAN KOD QR SEBAGAI PROJEK PERINTIS INOVASI PENGURUSAN STOR FARMASI HOSPITAL
```

---

### 1.0 TUJUAN
Kertas kerja ini dikemukakan bertujuan untuk memohon pertimbangan dan kelulusan **Pengarah Hospital / Pengerusi Jawatankuasa Pengurusan Aset Kerajaan (JKPAK)** bagi melaksanakan **Modul Digital KEW.PS-4 (MyInventory)** berasaskan imbasan Kod QR sebagai **Projek Perintis (*Pilot Project*) Inovasi Pengurusan Stor** di Stor Farmasi / Stor Satelit Hospital, bagi menggantikan perekodan Kad Petak fizikal secara manual.

---

### 2.0 LATAR BELAKANG & PERNYATAAN MASALAH

1. **Beban Kerja Berganda (*Double Work*):**  
   Pada masa kini, staf farmasi dan stor terpaksa merekod pergerakan ubat ke dalam sistem berkomputer dan pada masa yang sama perlu menyalin semula butiran transaksi menggunakan pen dakwat merah dan biru pada Kad Petak fizikal (KEW.PS-4) di rak simpanan. Ini mengakibatkan pembaziran masa operasi yang ketara.

2. **Risiko Kesilapan Pengiraan Manual (*Human Arithmetic Errors*):**  
   Perekodan manual semasa waktu puncak sering kali membawa kepada kesilapan pengiraan baki fizikal, kekeliruan no. kelompok (*batch number*), dan salah catat tarikh luput. Keadaan ini sering menjadi punca kepada penemuan atau teguran semasa sesi pengauditan dalaman.

3. **Kelemahan Pemantauan Tarikh Luput (*FEFO Non-Compliance*):**  
   Kad petak manual tidak berupaya memberikan amaran automatik bagi ubat-ubatan yang menghampiri tarikh luput, sekali gus meningkatkan risiko kerugian ubat yang terbiar di rak melebihi tempoh hayatnya.

4. **Kerentanan Fizikal Dokumen:**  
   Kad fizikal terdedah kepada risiko kerosakan fizikal, kelembapan, bencana banjir/kebakaran, dan kehilangan kad simpanan.

---

### 3.0 OBJEKTIF PROJEK PERINTIS
1. **Mengautomasikan Pengurusan Kad Petak:** Menghapuskan keperluan menulis kad manual dan menggantikannya dengan lejar digital masa-nyata.
2. **Mempercepatkan Transaksi Stor:** Memendekkan masa pengeluaran dan penerimaan ubat melalui imbasan pantas kod QR petak.
3. **Mencapai Sifar Ralat Aritmetik:** Memastikan 100% baki dalam sistem sentiasa tepat dengan fizikal tanpa ralat tolak-tambah manual.
4. **Meningkatkan Kawalan Tarikh Luput (FEFO):** Memastikan stok ubat yang hampir luput dikeluarkan terlebih dahulu secara automatik bagi mengelakkan kerugian ubat luput.
5. **Menyokong Dasar Kelestarian Sektor Awam:** Mengurangkan penggunaan kertas dan kad manila selaras dengan inisiatif *Paperless Government* dan *Green Hospital*.

---

### 4.0 ASAS PERTIMBANGAN & JUSTIFIKASI TADBIR URUS

1. **Pengekalan Integriti Format Standard MOF:**  
   Modul Digital KEW.PS-4 yang dibangunkan ini **tidak mengubah sebarang struktur data undang-undang**. Semua medan maklumat wajib yang digariskan dalam Tatacara Pengurusan Stor (TPS) Kementerian Kewangan Malaysia—termasuk Bahagian A (maklumat stok) dan Bahagian B (pergerakan terima/keluar/baki/kelompok)—dikekalkan secara tepat.

2. **Pendekatan Hibrid Pematuhan Audit (*Audit-Ready Mechanism*):**  
   Bagi memastikan proses pengauditan tahunan (KEW.PS-14) atau semakan mengejut berjalan lancar tanpa halangan:
   * **Tag QR Petak (*QR Bin Tag*):** Ditampal di rak simpanan bagi memenuhi prinsip penandaan lokasi stok.
   * **Ciri Cetakan Atas Permintaan (*On-Demand Printing*):** Sistem mampu menjana dan mencetak lejar KEW.PS-4 berformat rasmi lengkap dengan lambang Jata Negara dalam format PDF/Kertas pada bila-bila masa jika diminta oleh juruaudit.

3. **Keabsahan di Bawah Akta Keterangan 1950 (Seksyen 90A):**  
   Rekod dan cetakan lejar berkomputer yang dijana secara lazim dengan jejak audit yang selamat adalah sah dan diterima pakai dalam perundangan dan pengauditan sektor awam.

4. **Jejak Audit Kalis Manipulasi (*Tamper-Proof Audit Trail*):**  
   Setiap pergerakan ubat disahkan melalui log masuk berotentikasi pengguna, cap masa (*timestamp*) masa-nyata, dan identiti pegawai yang melakukan transaksi.

---

### 5.0 MEKANISME OPERASI MOD DIGITAL KEW.PS-4

```
ALIRAN KERJA OPERASI DIGITAL KEW.PS-4 DI STOR FARMASI

1. PENERIMAAN STOK (RECEIVE)
   [Imbas QR Petak Rak] ──► [Masukkan No LPO, Kelompok, Tarikh Luput, Kuantiti] ──► [Simpan (Auto Baki +)]

2. PENGELUARAN STOK (ISSUE)
   [Imbas QR Petak Rak] ──► [Sistem Papar Saranan FEFO Kelompok Terdekat] ──► [Pilih Wad/Unit & Kuantiti] ──► [Simpan (Auto Baki -)]

3. PEMERIKSAAN / AUDIT STOK
   [Imbas QR Petak] ──► [Papar Lejar Semasa di Skrin Tablet/Komputer]
   (ATAU Tekan 'Cetak KEW.PS-4' untuk Cetakan Format Rasmi Jata Negara)
```

---

### 6.0 SKOP & TEMPOH PELAKSANAAN PROJEK PERINTIS (PILOT)

* **Lokasi Ujian Rintis:** Stor Farmasi Satelit / Stor Bekalan Farmasi / Stor Silinder Perubatan (MyCylinder).
* **Tempoh Ujian Rintis:** **Enam (6) Bulan** dari tarikh kelulusan.
* **Kriteria Kejayaan Projek (*Success Indicators*):**
  1. Tahap percanggahan baki stok (*inventory variance*) $\le 0.1\%$.
  2. Penjimatan masa operasi staf stor minimum $75\%$.
  3. Sifar insiden rekod hilang atau rosak.
  4. Laporan maklum balas positif semasa sesi pengauditan dalaman JKPAK.

---

### 7.0 IMPLIKASI SUMBER & KEWANGAN

* **Implikasi Kewangan:** **RM 0.00 (Tiada Kos Tambahan)**.  
  Modul MyInventory telah siap dibangunkan sepenuhnya secara dalaman (*in-house*). Tiada lesen perisian pihak ketiga atau perkakasan tambahan diperlukan (menggunakan komputer sedia ada di kaunter stor atau peranti pintar rasmi staf).
* **Implikasi Sumber Manusia:**  
  Latihan *in-house* ringkas selama 1 hari kepada pembantu pegawai farmasi dan staf stor terlibat.

---

### 8.0 PELAN MITIGASI RISIKO

| Risiko Yang Dikenal Pasti | Langkah Kawalan & Mitigasi |
| :--- | :--- |
| **Gangguan Bekalan Elektrik / Internet** | Sistem menyokong prosedur luar jangka (*downtime slip* sementara). Sebaik bekalan pulih, data dikemas kini serta-merta mengikut cap masa sebenar. |
| **Keperluan Semakan Fizikal Juruaudit** | Butang *Export to PDF / Print KEW.PS-4* tersedia pada setiap halaman lejar untuk cetakan segera berformat rasmi MOF. |
| **Integriti dan Keselamatan Data** | Kawalan akses berasaskan peranan (*Role-Based Access Control - RBAC*). Sandaran data harian secara automatik ke pelayan berpusat. |

---

### 9.0 SYOR & PERMOHONAN KELULUSAN

Berdasarkan faedah penjimatan masa, peningkatan integriti data, kawalan ketirisan ubat luput, dan sifar implikasi kos pembangunan:

**Pihak Pengurusan / Pengarah Hospital adalah dimohon untuk:**
1. **Bersetuju dan meluluskan pelaksanaan Projek Perintis Modul Digital KEW.PS-4 (MyInventory)** berasaskan Kod QR di Stor Farmasi Hospital bagi tempoh 6 bulan.
2. **Meluluskan penggunaan Tag QR Petak di rak simpanan stor** berserta kaedah cetakan lejar *On-Demand* sebagai ganti kepada penulisan tangan pada kad manila manual sepanjang tempoh percubaan.
3. **Merekodkan kelulusan ini secara rasmi dalam Minit Mesyuarat Jawatankuasa Pengurusan Aset Kerajaan (JKPAK)** peringkat Hospital.

---

*Disediakan oleh:*  
**Unit Farmasi & Pasukan Pembangunan Sistem Maklumat Hospital**  
Hospital Pengurusan Operasi Ekosistem  

*Disemak oleh:*  
**Ketua Pegawai Farmasi Hospital**  

*Disahkan & Diluluskan oleh:*  
**Pengarah Hospital / Pengerusi JKPAK**
