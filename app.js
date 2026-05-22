const curriculumData = {
  levels: {
    SD: {
      grades: [1, 2, 3, 4, 5, 6],
      subjects: ["Bahasa Indonesia", "Matematika", "IPAS", "Pendidikan Pancasila", "PJOK", "Seni Budaya", "Bahasa Inggris", "Pendidikan Agama"]
    },
    SMP: {
      grades: [7, 8, 9],
      subjects: ["Bahasa Indonesia", "Matematika", "IPA", "IPS", "Bahasa Inggris", "Pendidikan Pancasila", "PJOK", "Informatika", "Seni Budaya", "Pendidikan Agama"]
    },
    "SMA/SMK": {
      grades: [10, 11, 12],
      subjects: ["Bahasa Indonesia", "Matematika", "Bahasa Inggris", "Fisika", "Kimia", "Biologi", "Ekonomi", "Geografi", "Sejarah", "Sosiologi", "Pendidikan Pancasila", "Informatika", "Pendidikan Agama"]
    }
  },
  curriculums: ["Kurikulum Merdeka", "Kurikulum 2013", "KTSP 2006"],
  defaultTopics: {
    "Bahasa Indonesia": "Membaca dan menyajikan informasi dari teks",
    Matematika: "Bilangan, pengukuran, dan pemecahan masalah",
    IPAS: "Makhluk hidup, lingkungan, dan perubahan energi",
    IPA: "Objek IPA, pengukuran, dan ekosistem",
    IPS: "Interaksi sosial, ruang, dan kegiatan ekonomi",
    "Bahasa Inggris": "Daily activities and descriptive text",
    "Pendidikan Pancasila": "Nilai Pancasila dalam kehidupan sehari-hari",
    PJOK: "Gerak dasar, kebugaran, dan pola hidup sehat",
    "Seni Budaya": "Ekspresi karya seni dua dan tiga dimensi",
    Informatika: "Berpikir komputasional dan literasi digital",
    Fisika: "Pengukuran, gerak, dan energi",
    Kimia: "Struktur atom, zat, dan perubahannya",
    Biologi: "Sel, keanekaragaman hayati, dan ekosistem",
    Ekonomi: "Kebutuhan, kelangkaan, dan kegiatan ekonomi",
    Geografi: "Peta, wilayah, dan dinamika lingkungan",
    Sejarah: "Konsep berpikir sejarah dan perubahan masyarakat",
    Sosiologi: "Individu, kelompok, dan interaksi sosial",
    "Pendidikan Agama": "Akhlak, ibadah, dan penerapan nilai keagamaan"
  }
};

const documents = [
  "Modul Ajar",
  "Silabus",
  "ATP",
  "Program Tahunan",
  "RPP Ringkas",
  "LKPD",
  "Bahan Ajar",
  "Asesmen",
  "Rubrik",
  "Program Semester",
  "Kisi-kisi Soal",
  "Remedial & Pengayaan",
  "Jurnal Mengajar"
];

const packagePresets = {
  complete: documents,
  teaching: ["Modul Ajar", "ATP", "RPP Ringkas", "Bahan Ajar", "LKPD", "Asesmen", "Rubrik"],
  admin: ["Silabus", "Program Tahunan", "Program Semester", "Jurnal Mengajar", "Remedial & Pengayaan"],
  assessment: ["Asesmen", "Rubrik", "Kisi-kisi Soal", "Remedial & Pengayaan"]
};

const el = {
  form: document.querySelector("#generatorForm"),
  level: document.querySelector("#level"),
  grade: document.querySelector("#grade"),
  schoolName: document.querySelector("#schoolName"),
  schoolYear: document.querySelector("#schoolYear"),
  curriculum: document.querySelector("#curriculum"),
  semester: document.querySelector("#semester"),
  subject: document.querySelector("#subject"),
  phase: document.querySelector("#phase"),
  packageMode: document.querySelector("#packageMode"),
  topic: document.querySelector("#topic"),
  duration: document.querySelector("#duration"),
  teacher: document.querySelector("#teacher"),
  competencyText: document.querySelector("#competencyText"),
  studentProfile: document.querySelector("#studentProfile"),
  localContext: document.querySelector("#localContext"),
  docOptions: document.querySelector("#docOptions"),
  preview: document.querySelector("#preview"),
  docMeta: document.querySelector("#docMeta"),
  historyList: document.querySelector("#historyList"),
  accountPill: document.querySelector("#accountPill"),
  planBadge: document.querySelector("#planBadge"),
  accountForm: document.querySelector("#accountForm"),
  accountName: document.querySelector("#accountName"),
  accountContact: document.querySelector("#accountContact"),
  paymentInstruction: document.querySelector("#paymentInstruction"),
  bankAccount: document.querySelector("#bankAccount"),
  qrisAccount: document.querySelector("#qrisAccount"),
  adminContact: document.querySelector("#adminContact"),
  confirmPaymentLink: document.querySelector("#confirmPaymentLink"),
  activationCodeInput: document.querySelector("#activationCodeInput"),
  activateCodeBtn: document.querySelector("#activateCodeBtn"),
  printBtn: document.querySelector("#printBtn"),
  copyBtn: document.querySelector("#copyBtn"),
  downloadDocBtn: document.querySelector("#downloadDocBtn"),
  sampleBtn: document.querySelector("#sampleBtn"),
  resetBtn: document.querySelector("#resetBtn"),
  clearHistoryBtn: document.querySelector("#clearHistoryBtn")
};

let currentHtml = "";
let currentPlainText = "";
let history = JSON.parse(localStorage.getItem("gurusuite-history") || "[]");
let account = JSON.parse(localStorage.getItem("gurusuite-account") || "null") || {
  name: "",
  contact: "",
  plan: "Gratis",
  usage: 0,
  selectedPlan: "",
  selectedPrice: 0,
  currentOrder: null,
  licenseToken: ""
};
let paymentReady = true;
let appConfig = {
  payment: {
    bank: "BSI",
    accountNumber: "7567057270",
    accountName: "Dhanie Kusnadi",
    qrisLabel: "Siapkan QRIS merchant kamu di sini",
    adminEmail: "dhaniekusnadi73@guru.sd.belajar.id"
  },
  plans: [
    { name: "Pro Guru", price: 79000 },
    { name: "Sekolah", price: 299000 }
  ]
};

function option(value, label = value) {
  const node = document.createElement("option");
  node.value = value;
  node.textContent = label;
  return node;
}

function fillSelect(select, values) {
  select.innerHTML = "";
  values.forEach((value) => select.appendChild(option(value)));
}

async function init() {
  await loadConfig();
  fillSelect(el.level, Object.keys(curriculumData.levels));
  fillSelect(el.curriculum, curriculumData.curriculums);
  documents.forEach((doc, index) => {
    const label = document.createElement("label");
    label.className = "check-item";
    label.innerHTML = `<input type="checkbox" value="${doc}" ${index < 7 ? "checked" : ""}> <span>${doc}</span>`;
    el.docOptions.appendChild(label);
  });
  updateGradesAndSubjects();
  await validateLicense();
  renderAccount();
  renderHistory();
}

async function loadConfig() {
  try {
    const response = await fetch("/api/config");
    if (!response.ok) return;
    appConfig = await response.json();
    const payment = appConfig.payment;
    el.bankAccount.textContent = `${payment.bank} ${payment.accountNumber} a.n. ${payment.accountName}`;
    el.qrisAccount.textContent = payment.qrisLabel;
    el.adminContact.textContent = payment.adminEmail;
    paymentReady = appConfig.paymentEnabled !== false;
    updatePaymentAvailability();
  } catch {
    el.bankAccount.textContent = "BSI 7567057270 a.n. Dhanie Kusnadi";
    el.qrisAccount.textContent = "Siapkan QRIS merchant kamu di sini";
    el.adminContact.textContent = "dhaniekusnadi73@guru.sd.belajar.id";
    paymentReady = true;
    updatePaymentAvailability();
  }
}

function updatePaymentAvailability() {
  document.querySelectorAll("[data-plan]").forEach((button) => {
    button.disabled = !paymentReady;
    button.title = paymentReady ? "" : "Pembayaran belum aktif. Admin perlu mengaktifkan Supabase.";
  });
  if (!paymentReady) {
    el.paymentInstruction.textContent = "Pembayaran belum aktif. Admin sedang menyiapkan database permanen agar order aman tersimpan.";
  }
}

function updateGradesAndSubjects() {
  const levelData = curriculumData.levels[el.level.value];
  fillSelect(el.grade, levelData.grades.map(String));
  fillSelect(el.subject, levelData.subjects);
  updateTopicHint();
  updatePhase();
  applyPackagePreset();
}

function updateTopicHint() {
  el.topic.placeholder = `Contoh: ${curriculumData.defaultTopics[el.subject.value] || "Topik pembelajaran"}`;
}

function phaseFromGrade(grade, curriculum) {
  const n = Number(grade);
  if (curriculum === "Kurikulum Merdeka") {
    if (n <= 2) return "Fase A";
    if (n <= 4) return "Fase B";
    if (n <= 6) return "Fase C";
    if (n <= 9) return "Fase D";
    if (n === 10) return "Fase E";
    return "Fase F";
  }
  return curriculum === "Kurikulum 2013" ? "KI/KD per kelas" : "SK/KD per kelas";
}

function updatePhase() {
  el.phase.value = phaseFromGrade(el.grade.value, el.curriculum.value);
}

function applyPackagePreset() {
  const picked = new Set(packagePresets[el.packageMode.value] || documents);
  el.docOptions.querySelectorAll("input").forEach((input) => {
    input.checked = picked.has(input.value);
  });
}

function selectedDocs() {
  return [...el.docOptions.querySelectorAll("input:checked")].map((input) => input.value);
}

function buildContext() {
  const topic = el.topic.value.trim() || curriculumData.defaultTopics[el.subject.value] || "Topik pembelajaran";
  const duration = el.duration.value.trim() || "3 pertemuan x 2 JP";
  const teacher = el.teacher.value.trim() || "Guru Mata Pelajaran";
  const schoolName = el.schoolName.value.trim() || "Satuan Pendidikan";
  const schoolYear = el.schoolYear.value.trim() || "2026/2027";
  const competencyText = el.competencyText.value.trim();
  const studentProfile = el.studentProfile.value.trim() || "Peserta didik memiliki kemampuan awal beragam, membutuhkan contoh konkret, dan diarahkan untuk aktif bertanya, berdiskusi, serta mempresentasikan hasil belajar.";
  const localContext = el.localContext.value.trim() || "Pembelajaran dikaitkan dengan lingkungan sekitar siswa, pengalaman keseharian, serta contoh yang dekat dengan satuan pendidikan.";
  return {
    level: el.level.value,
    grade: el.grade.value,
    schoolName,
    schoolYear,
    curriculum: el.curriculum.value,
    semester: el.semester.value,
    subject: el.subject.value,
    phase: el.phase.value,
    topic,
    duration,
    teacher,
    competencyText,
    studentProfile,
    localContext,
    docs: selectedDocs()
  };
}

function curriculumTerms(ctx) {
  if (ctx.curriculum === "Kurikulum Merdeka") {
    return {
      goalLabel: "Capaian Pembelajaran",
      objectiveLabel: "Tujuan Pembelajaran",
      criteriaLabel: "KKTP",
      approach: "pembelajaran berdiferensiasi, asesmen formatif, dan refleksi"
    };
  }
  if (ctx.curriculum === "Kurikulum 2013") {
    return {
      goalLabel: "Kompetensi Inti dan Kompetensi Dasar",
      objectiveLabel: "Indikator Pencapaian Kompetensi",
      criteriaLabel: "Kriteria Ketuntasan Minimal",
      approach: "pendekatan saintifik, penilaian sikap, pengetahuan, dan keterampilan"
    };
  }
  return {
    goalLabel: "Standar Kompetensi dan Kompetensi Dasar",
    objectiveLabel: "Indikator Pembelajaran",
    criteriaLabel: "Kriteria Ketuntasan",
    approach: "pembelajaran aktif, latihan terstruktur, dan evaluasi berkala"
  };
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function list(items) {
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function table(headers, rows) {
  return `
    <table>
      <thead><tr>${headers.map((head) => `<th>${escapeHtml(head)}</th>`).join("")}</tr></thead>
      <tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody>
    </table>
  `;
}

function titleCaseDoc(ctx) {
  return `${ctx.subject} Kelas ${ctx.grade} ${ctx.level} - ${ctx.topic}`;
}

function moduleDoc(ctx) {
  const terms = curriculumTerms(ctx);
  return `
    <section class="doc-section">
      <h3>Modul Ajar</h3>
      <h4>Identitas Modul</h4>
      ${table(["Komponen", "Keterangan"], [
        ["Satuan Pendidikan", ctx.schoolName],
        ["Jenjang", `${ctx.level} / setara`],
        ["Kelas / Semester", `${ctx.grade} / ${ctx.semester}`],
        ["Fase / Acuan Kompetensi", ctx.phase],
        ["Tahun Ajaran", ctx.schoolYear],
        ["Mata Pelajaran", ctx.subject],
        ["Topik", ctx.topic],
        ["Alokasi Waktu", ctx.duration],
        ["Guru", ctx.teacher]
      ])}
      <h4>${terms.goalLabel}</h4>
      <p>Peserta didik memahami konsep utama pada materi ${escapeHtml(ctx.topic)}, mampu mengaitkannya dengan situasi nyata, dan menunjukkan keterampilan bernalar, berkomunikasi, serta menyelesaikan masalah sesuai jenjang kelas.</p>
      ${ctx.competencyText ? `<p><strong>Acuan khusus dari guru/sekolah:</strong> ${escapeHtml(ctx.competencyText)}</p>` : ""}
      <h4>${terms.objectiveLabel}</h4>
      ${list([
        `Menjelaskan konsep inti ${ctx.topic} dengan bahasa sendiri.`,
        `Mengidentifikasi contoh penerapan ${ctx.topic} dalam kehidupan sehari-hari.`,
        `Menyelesaikan tugas atau masalah kontekstual terkait ${ctx.topic}.`,
        "Menyampaikan hasil kerja secara lisan, tertulis, atau visual dengan runtut."
      ])}
      <h4>Profil Pelajar Pancasila</h4>
      ${list(["Bernalar kritis", "Mandiri", "Bergotong royong", "Kreatif"])}
      <h4>Model dan Metode</h4>
      <p>Menggunakan diskusi kelompok, demonstrasi, latihan bertahap, presentasi, dan refleksi dengan penekanan pada ${escapeHtml(terms.approach)}.</p>
      <h4>Konteks Lokal dan Diferensiasi</h4>
      <p>${escapeHtml(ctx.localContext)}</p>
      <h4>Langkah Pembelajaran</h4>
      ${table(["Tahap", "Aktivitas Guru", "Aktivitas Siswa"], [
        ["Pendahuluan", "Menyapa, mengecek kesiapan, mengaitkan materi dengan pengalaman siswa, dan menyampaikan tujuan.", "Menjawab pertanyaan pemantik dan menyiapkan alat belajar."],
        ["Inti", `Menyajikan materi ${ctx.topic}, memberi contoh, membimbing diskusi, dan memfasilitasi latihan.`, "Mengamati, bertanya, berdiskusi, mengerjakan LKPD, dan mempresentasikan hasil."],
        ["Penutup", "Menguatkan konsep, memberi umpan balik, menyimpulkan pembelajaran, dan menyampaikan tindak lanjut.", "Menulis refleksi, menyampaikan kesulitan, dan mencatat tugas lanjutan."]
      ])}
      <h4>${terms.criteriaLabel}</h4>
      ${list([
        "Mampu menjelaskan konsep inti dengan benar.",
        "Mampu menggunakan contoh yang relevan.",
        "Mampu menyelesaikan tugas dengan ketepatan minimal 75%.",
        "Menunjukkan sikap aktif, kolaboratif, dan bertanggung jawab."
      ])}
    </section>
  `;
}

function syllabusDoc(ctx) {
  const terms = curriculumTerms(ctx);
  return `
    <section class="doc-section">
      <h3>Silabus</h3>
      ${table(["Komponen", "Isi"], [
        [terms.goalLabel, `Penguasaan konsep ${ctx.topic} dan penerapannya sesuai konteks ${ctx.subject}.`],
        [terms.objectiveLabel, `Siswa mampu memahami, menerapkan, dan mengomunikasikan materi ${ctx.topic}.`],
        ["Materi Pokok", ctx.topic],
        ["Kegiatan Pembelajaran", "Apersepsi, eksplorasi konsep, diskusi, latihan, presentasi, refleksi."],
        ["Penilaian", "Observasi sikap, tugas LKPD, kuis formatif, produk/presentasi."],
        ["Alokasi Waktu", ctx.duration],
        ["Sumber Belajar", "Buku teks, lingkungan sekitar, media digital, lembar kerja, dan sumber relevan lain."]
      ])}
    </section>
  `;
}

function atpDoc(ctx) {
  return `
    <section class="doc-section">
      <h3>Alur Tujuan Pembelajaran</h3>
      ${table(["Urutan", "Tujuan Pembelajaran", "Materi", "Asesmen"], [
        ["1", `Mengaktifkan pengetahuan awal tentang ${ctx.topic}.`, "Konsep dasar dan contoh awal", "Tanya jawab diagnostik"],
        ["2", `Memahami konsep inti ${ctx.topic}.`, "Definisi, ciri, pola, atau prosedur", "Kuis formatif"],
        ["3", `Menerapkan ${ctx.topic} pada masalah kontekstual.`, "Latihan bertahap dan studi kasus", "LKPD"],
        ["4", "Mengomunikasikan hasil belajar.", "Presentasi, poster, laporan, atau demonstrasi", "Rubrik performa"],
        ["5", "Melakukan refleksi dan perbaikan.", "Umpan balik dan tindak lanjut", "Refleksi tertulis"]
      ])}
    </section>
  `;
}

function yearlyProgramDoc(ctx) {
  const periods = ctx.semester === "Ganjil" ? ["Juli", "Agustus", "September", "Oktober", "November", "Desember"] : ["Januari", "Februari", "Maret", "April", "Mei", "Juni"];
  return `
    <section class="doc-section">
      <h3>Program Tahunan</h3>
      ${table(["Bulan", "Capaian / Kompetensi", "Materi Utama", "Keterangan"], periods.map((month, index) => [
        month,
        index < 3 ? `Penguatan dasar ${ctx.topic}` : `Penerapan lanjutan ${ctx.topic}`,
        index < 2 ? "Konsep dan contoh" : index < 4 ? "Latihan kontekstual dan proyek" : "Evaluasi, remedial, pengayaan",
        index === periods.length - 1 ? "Rekap nilai dan refleksi" : "Disesuaikan kalender pendidikan"
      ]))}
    </section>
  `;
}

function lessonPlanDoc(ctx) {
  return `
    <section class="doc-section">
      <h3>RPP Ringkas</h3>
      ${table(["Bagian", "Rencana"], [
        ["Tujuan", `Siswa mampu memahami dan menerapkan ${ctx.topic} secara tepat.`],
        ["Kegiatan Pendahuluan", "Salam, presensi, apersepsi, pertanyaan pemantik, penyampaian tujuan."],
        ["Kegiatan Inti", "Eksplorasi materi, diskusi kelompok, latihan, pendampingan, presentasi hasil."],
        ["Kegiatan Penutup", "Kesimpulan, refleksi, umpan balik, pengayaan/remedial, tugas mandiri."],
        ["Penilaian", "Diagnostik, formatif, sumatif, observasi sikap, dan rubrik keterampilan."]
      ])}
    </section>
  `;
}

function teachingMaterialDoc(ctx) {
  return `
    <section class="doc-section">
      <h3>Bahan Ajar</h3>
      <h4>Ringkasan Materi</h4>
      <p>${escapeHtml(ctx.topic)} dipelajari agar peserta didik memahami konsep inti, mengenali contoh dalam kehidupan sehari-hari, dan mampu menggunakannya untuk menyelesaikan masalah sesuai konteks ${escapeHtml(ctx.subject)}.</p>
      <h4>Peta Konsep</h4>
      ${list([
        `Pengertian dan konsep dasar ${ctx.topic}`,
        "Contoh dan bukan contoh",
        "Langkah penerapan konsep",
        "Latihan kontekstual",
        "Refleksi dan tindak lanjut"
      ])}
      <h4>Contoh Kontekstual</h4>
      <p>${escapeHtml(ctx.localContext)}</p>
      <h4>Glosarium Mini</h4>
      ${table(["Istilah", "Makna Sederhana"], [
        ["Konsep inti", `Gagasan utama yang perlu dipahami pada materi ${ctx.topic}.`],
        ["Konteks", "Situasi nyata yang digunakan untuk memahami materi."],
        ["Refleksi", "Kegiatan menilai pemahaman, kesulitan, dan rencana perbaikan belajar."]
      ])}
    </section>
  `;
}

function lkpdDoc(ctx) {
  return `
    <section class="doc-section">
      <h3>LKPD</h3>
      <p><strong>Judul:</strong> Eksplorasi ${escapeHtml(ctx.topic)}</p>
      <p><strong>Petunjuk:</strong> Kerjakan secara berpasangan atau kelompok kecil. Bacalah sumber belajar, diskusikan jawaban, lalu tuliskan kesimpulan.</p>
      ${list([
        `Tuliskan tiga hal yang sudah kamu ketahui tentang ${ctx.topic}.`,
        `Amati contoh atau kasus yang diberikan guru. Apa masalah utama yang terlihat?`,
        `Gunakan konsep ${ctx.topic} untuk menyelesaikan masalah tersebut.`,
        "Buat kesimpulan dalam 4-6 kalimat.",
        "Presentasikan hasil diskusi kepada kelompok lain."
      ])}
    </section>
  `;
}

function assessmentDoc(ctx) {
  return `
    <section class="doc-section">
      <h3>Asesmen</h3>
      <h4>Diagnostik</h4>
      ${list([
        `Apa yang kamu ketahui tentang ${ctx.topic}?`,
        "Bagian mana yang menurutmu paling sulit dari materi ini?",
        "Berikan satu contoh yang pernah kamu temui dalam kehidupan sehari-hari."
      ])}
      <h4>Formatif</h4>
      ${list([
        `Jelaskan konsep utama ${ctx.topic}.`,
        `Sebutkan dua contoh penerapan ${ctx.topic}.`,
        "Kerjakan satu soal atau kasus kontekstual yang disediakan guru."
      ])}
      <h4>Sumatif</h4>
      ${table(["Bentuk", "Instruksi", "Skor"], [
        ["Tes tertulis", `Menjawab pertanyaan pemahaman dan penerapan tentang ${ctx.topic}.`, "40"],
        ["Produk/Laporan", "Menyusun hasil pengamatan atau penyelesaian masalah.", "35"],
        ["Presentasi", "Menyampaikan hasil belajar dengan runtut dan percaya diri.", "25"]
      ])}
    </section>
  `;
}

function rubricDoc() {
  return `
    <section class="doc-section">
      <h3>Rubrik Penilaian</h3>
      ${table(["Aspek", "4 - Sangat Baik", "3 - Baik", "2 - Cukup", "1 - Perlu Bimbingan"], [
        ["Pemahaman konsep", "Penjelasan lengkap dan akurat", "Penjelasan cukup tepat", "Masih ada kekeliruan", "Belum memahami konsep"],
        ["Penerapan", "Mampu menerapkan pada konteks baru", "Mampu menerapkan pada contoh umum", "Perlu bantuan dalam menerapkan", "Belum mampu menerapkan"],
        ["Komunikasi", "Runtut, jelas, dan percaya diri", "Cukup runtut dan jelas", "Kurang runtut", "Sulit dipahami"],
        ["Kolaborasi", "Aktif membantu kelompok", "Bekerja sama dengan baik", "Kadang pasif", "Belum terlibat"]
      ])}
    </section>
  `;
}

function semesterProgramDoc(ctx) {
  const weeks = ctx.semester === "Ganjil" ? ["Juli", "Agustus", "September", "Oktober", "November", "Desember"] : ["Januari", "Februari", "Maret", "April", "Mei", "Juni"];
  return `
    <section class="doc-section">
      <h3>Program Semester</h3>
      ${table(["Bulan", "Fokus Pembelajaran", "Kegiatan / Asesmen"], weeks.map((month, index) => [
        month,
        index < 2 ? `Penguatan konsep ${ctx.topic}` : index < 4 ? `Penerapan dan proyek ${ctx.topic}` : "Ulangan, pengayaan, remedial, dan refleksi",
        index % 2 === 0 ? "Pembelajaran, LKPD, diskusi" : "Formatif, produk, presentasi"
      ]))}
    </section>
  `;
}

function questionBlueprintDoc(ctx) {
  return `
    <section class="doc-section">
      <h3>Kisi-kisi Soal</h3>
      ${table(["No", "Indikator", "Level Kognitif", "Bentuk Soal", "Nomor"], [
        ["1", `Menjelaskan konsep dasar ${ctx.topic}.`, "Pemahaman", "Pilihan ganda / isian", "1-3"],
        ["2", `Mengidentifikasi contoh penerapan ${ctx.topic}.`, "Aplikasi", "Pilihan ganda kompleks", "4-6"],
        ["3", `Menganalisis masalah kontekstual terkait ${ctx.topic}.`, "Penalaran", "Uraian", "7-8"],
        ["4", "Menyimpulkan hasil belajar berdasarkan data atau kasus.", "Evaluasi", "Uraian / proyek", "9-10"]
      ])}
      <h4>Contoh Butir</h4>
      ${list([
        `Jelaskan dengan bahasamu sendiri apa yang dimaksud dengan ${ctx.topic}.`,
        `Berikan dua contoh penerapan ${ctx.topic} dalam kehidupan sehari-hari.`,
        `Bacalah kasus yang diberikan guru, lalu tentukan solusi berdasarkan konsep ${ctx.topic}.`
      ])}
    </section>
  `;
}

function remedialDoc(ctx) {
  return `
    <section class="doc-section">
      <h3>Remedial dan Pengayaan</h3>
      <h4>Remedial</h4>
      ${list([
        "Mengulang konsep inti dengan contoh yang lebih sederhana.",
        "Memberikan latihan bertahap dan pendampingan singkat.",
        "Melakukan asesmen ulang setelah siswa menunjukkan kesiapan."
      ])}
      <h4>Pengayaan</h4>
      ${list([
        `Membuat proyek mini tentang penerapan ${ctx.topic}.`,
        "Mencari contoh dari lingkungan sekitar dan menyajikannya dalam poster/laporan.",
        "Membantu teman sebagai tutor sebaya pada latihan lanjutan."
      ])}
    </section>
  `;
}

function journalDoc(ctx) {
  return `
    <section class="doc-section">
      <h3>Jurnal Mengajar</h3>
      ${table(["Tanggal", "Materi", "Kehadiran", "Catatan Pembelajaran", "Tindak Lanjut"], [
        ["", ctx.topic, "", "Sebagian siswa memahami materi, beberapa membutuhkan contoh tambahan.", "Remedial singkat dan latihan rumah."],
        ["", ctx.topic, "", "Diskusi kelompok berjalan baik, perlu penguatan presentasi.", "Pengayaan proyek mini."],
        ["", ctx.topic, "", "Asesmen formatif selesai dilaksanakan.", "Analisis hasil dan umpan balik."]
      ])}
    </section>
  `;
}

const docBuilders = {
  "Modul Ajar": moduleDoc,
  Silabus: syllabusDoc,
  ATP: atpDoc,
  "Program Tahunan": yearlyProgramDoc,
  "RPP Ringkas": lessonPlanDoc,
  "Bahan Ajar": teachingMaterialDoc,
  LKPD: lkpdDoc,
  Asesmen: assessmentDoc,
  Rubrik: rubricDoc,
  "Program Semester": semesterProgramDoc,
  "Kisi-kisi Soal": questionBlueprintDoc,
  "Remedial & Pengayaan": remedialDoc,
  "Jurnal Mengajar": journalDoc
};

function buildDocument(ctx) {
  const body = ctx.docs.map((doc) => docBuilders[doc](ctx)).join("");
  return `
    <div class="doc-title">
      <h2>Paket Perangkat Ajar</h2>
      <p>${escapeHtml(titleCaseDoc(ctx))}</p>
    </div>
    <div class="meta-grid">
      <div class="meta-item"><strong>Jenjang</strong>${escapeHtml(ctx.level)}</div>
      <div class="meta-item"><strong>Kelas / Semester</strong>${escapeHtml(ctx.grade)} / ${escapeHtml(ctx.semester)}</div>
      <div class="meta-item"><strong>Kurikulum</strong>${escapeHtml(ctx.curriculum)}</div>
      <div class="meta-item"><strong>Fase / Kompetensi</strong>${escapeHtml(ctx.phase)}</div>
      <div class="meta-item"><strong>Sekolah</strong>${escapeHtml(ctx.schoolName)}</div>
      <div class="meta-item"><strong>Tahun Ajaran</strong>${escapeHtml(ctx.schoolYear)}</div>
      <div class="meta-item"><strong>Mapel</strong>${escapeHtml(ctx.subject)}</div>
      <div class="meta-item"><strong>Alokasi</strong>${escapeHtml(ctx.duration)}</div>
      <div class="meta-item"><strong>Guru</strong>${escapeHtml(ctx.teacher)}</div>
    </div>
    <section class="doc-section">
      <h3>Profil dan Diferensiasi Siswa</h3>
      <p>${escapeHtml(ctx.studentProfile)}</p>
      <p>${escapeHtml(ctx.localContext)}</p>
      <p>Pembelajaran disiapkan dengan variasi aktivitas visual, diskusi, latihan mandiri, dan pendampingan kelompok kecil agar dapat menjangkau kesiapan belajar yang berbeda.</p>
    </section>
    ${body}
    <section class="doc-section">
      <h3>Catatan Validasi</h3>
      <p>Dokumen ini adalah draf awal yang perlu disesuaikan guru dengan CP/KD resmi, buku ajar sekolah, kalender pendidikan daerah, karakteristik kelas, dan kebijakan satuan pendidikan.</p>
    </section>
  `;
}

function htmlToPlainText(html) {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.innerText.trim();
}

function saveHistory(ctx, html) {
  history.unshift({
    id: crypto.randomUUID(),
    createdAt: new Date().toLocaleString("id-ID"),
    title: titleCaseDoc(ctx),
    ctx,
    html
  });
  history = history.slice(0, 10);
  localStorage.setItem("gurusuite-history", JSON.stringify(history));
  renderHistory();
}

function renderAccount() {
  el.accountName.value = account.name || "";
  el.accountContact.value = account.contact || "";
  el.planBadge.textContent = account.plan;
  const usageText = account.plan === "Gratis" ? `Gratis: ${account.usage}/3 generate` : `${account.plan}: aktif`;
  el.accountPill.textContent = usageText;
  if (account.selectedPlan) {
    el.paymentInstruction.textContent = `Tagihan ${account.selectedPlan}: Rp${Number(account.selectedPrice).toLocaleString("id-ID")}. Transfer sesuai nominal, lalu konfirmasi ke admin.`;
  }
  if (account.currentOrder) {
    renderOrder(account.currentOrder);
  }
}

function saveAccount() {
  localStorage.setItem("gurusuite-account", JSON.stringify(account));
  renderAccount();
}

async function validateLicense() {
  if (!account.licenseToken) return;
  try {
    const response = await fetch("/api/validate-license", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ licenseToken: account.licenseToken })
    });
    const data = await response.json();
    if (!response.ok || !data.valid) {
      account.plan = "Gratis";
      account.licenseToken = "";
      return;
    }
    account.plan = data.plan;
  } catch {
    return;
  }
}

async function choosePlan(plan, price) {
  if (!paymentReady) {
    alert("Pembayaran belum aktif. Admin perlu mengaktifkan Supabase agar order tersimpan permanen.");
    return;
  }
  account.selectedPlan = plan;
  account.selectedPrice = Number(price);
  saveAccount();
  await createOrder(plan, price);
}

async function createOrder(plan, price) {
  const response = await fetch("/api/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: account.name,
      contact: account.contact,
      plan,
      price: Number(price)
    })
  });
  const data = await response.json();
  if (!response.ok) {
    alert(data.error || "Gagal membuat invoice pembayaran.");
    return;
  }
  account.currentOrder = data.order;
  saveAccount();
  renderOrder(data.order);
}

function renderOrder(order) {
  el.paymentInstruction.textContent = `Invoice ${order.id}: transfer Rp${Number(order.amount).toLocaleString("id-ID")} ke ${order.bank} ${order.accountNumber} a.n. ${order.accountName}. Nominal unik membantu admin mencocokkan pembayaran.`;
  const message = [
    "Halo admin GuruSuite, saya sudah melakukan pembayaran.",
    `Order: ${order.id}`,
    `Paket: ${order.plan}`,
    `Nominal: Rp${Number(order.amount).toLocaleString("id-ID")}`,
    `Nama: ${account.name || order.name}`,
    `Kontak: ${account.contact || order.contact}`,
    "Mohon dicek dan kirim kode aktivasi."
  ].join("\n");
  const subject = `Konfirmasi Pembayaran GuruSuite - ${order.id}`;
  el.confirmPaymentLink.href = `mailto:${order.adminEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
}

async function activateCode() {
  const code = el.activationCodeInput.value.trim();
  if (!code) {
    alert("Masukkan kode aktivasi terlebih dahulu.");
    return;
  }
  const response = await fetch("/api/activate-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code })
  });
  const data = await response.json();
  if (!response.ok) {
    alert(data.error || "Kode aktivasi tidak valid.");
    return;
  }
  account.plan = data.plan;
  account.usage = 0;
  account.licenseToken = data.licenseToken;
  account.currentOrder = data.order;
  saveAccount();
  alert(`Paket ${data.plan} aktif. Selamat menggunakan GuruSuite.`);
}

function canGenerate() {
  if (account.plan !== "Gratis") return true;
  if (account.usage < 3) return true;
  alert("Kuota gratis 3 generate sudah habis. Pilih paket Pro Guru atau Sekolah untuk lanjut generate.");
  return false;
}

function renderHistory() {
  if (!history.length) {
    el.historyList.innerHTML = "<p>Belum ada riwayat generate.</p>";
    return;
  }
  el.historyList.innerHTML = "";
  history.forEach((item) => {
    const button = document.createElement("button");
    button.className = "history-item";
    button.type = "button";
    button.innerHTML = `<strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.createdAt)}</span>`;
    button.addEventListener("click", () => {
      currentHtml = item.html;
      currentPlainText = htmlToPlainText(item.html);
      el.preview.innerHTML = item.html;
      el.docMeta.textContent = `${item.ctx.curriculum} - ${item.ctx.level} kelas ${item.ctx.grade} - ${item.ctx.semester}`;
    });
    el.historyList.appendChild(button);
  });
}

function generate() {
  if (!canGenerate()) return;
  const ctx = buildContext();
  if (!ctx.docs.length) {
    alert("Pilih minimal satu dokumen yang ingin digenerate.");
    return;
  }
  currentHtml = buildDocument(ctx);
  currentPlainText = htmlToPlainText(currentHtml);
  el.preview.innerHTML = currentHtml;
  el.docMeta.textContent = `${ctx.curriculum} - ${ctx.level} kelas ${ctx.grade} - ${ctx.semester} - ${ctx.docs.length} dokumen`;
  if (account.plan === "Gratis") {
    account.usage += 1;
    saveAccount();
  }
  saveHistory(ctx, currentHtml);
}

function downloadDoc() {
  if (!currentHtml) {
    alert("Generate dokumen terlebih dahulu.");
    return;
  }
  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Perangkat Ajar GuruSuite</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.45; color: #111; }
          table { border-collapse: collapse; width: 100%; margin: 12px 0; }
          th, td { border: 1px solid #777; padding: 8px; vertical-align: top; }
          th { background: #e9f3ee; }
          h2 { text-align: center; }
          .doc-section { margin: 20px 0; page-break-inside: avoid; }
        </style>
      </head>
      <body>${currentHtml}</body>
    </html>
  `;
  const blob = new Blob(["\ufeff", html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "perangkat-ajar-gurusuite.doc";
  a.click();
  URL.revokeObjectURL(url);
}

async function copyText() {
  if (!currentPlainText) {
    alert("Generate dokumen terlebih dahulu.");
    return;
  }
  await navigator.clipboard.writeText(currentPlainText);
  el.copyBtn.textContent = "Tersalin";
  setTimeout(() => {
    el.copyBtn.textContent = "Salin";
  }, 1400);
}

function fillSample() {
  el.level.value = "SD";
  updateGradesAndSubjects();
  el.grade.value = "5";
  updatePhase();
  el.curriculum.value = "Kurikulum Merdeka";
  updatePhase();
  el.semester.value = "Ganjil";
  el.subject.value = "IPAS";
  el.schoolName.value = "SD Negeri Harapan";
  el.schoolYear.value = "2026/2027";
  el.topic.value = "Ekosistem dan hubungan antarmakhluk hidup";
  el.duration.value = "4 pertemuan x 2 JP";
  el.teacher.value = "Bapak/Ibu Guru";
  el.competencyText.value = "Peserta didik memahami hubungan antarmakhluk hidup dan lingkungannya serta mampu menyajikan hasil pengamatan secara sederhana.";
  el.studentProfile.value = "Siswa aktif bertanya, menyukai kegiatan observasi, dan membutuhkan contoh visual serta kegiatan kelompok untuk menguatkan pemahaman konsep.";
  el.localContext.value = "Contoh pembelajaran dikaitkan dengan kebun sekolah, tanaman sekitar rumah, dan pengamatan rantai makanan sederhana di lingkungan siswa.";
  generate();
}

el.level.addEventListener("change", updateGradesAndSubjects);
el.grade.addEventListener("change", updatePhase);
el.curriculum.addEventListener("change", updatePhase);
el.subject.addEventListener("change", updateTopicHint);
el.packageMode.addEventListener("change", applyPackagePreset);
el.accountForm.addEventListener("submit", (event) => {
  event.preventDefault();
  account.name = el.accountName.value.trim();
  account.contact = el.accountContact.value.trim();
  saveAccount();
  alert("Akun tersimpan di browser ini.");
});
document.querySelectorAll("[data-plan]").forEach((button) => {
  button.addEventListener("click", () => choosePlan(button.dataset.plan, button.dataset.price));
});
el.activateCodeBtn.addEventListener("click", activateCode);
el.form.addEventListener("submit", (event) => {
  event.preventDefault();
  generate();
});
el.printBtn.addEventListener("click", () => window.print());
el.downloadDocBtn.addEventListener("click", downloadDoc);
el.copyBtn.addEventListener("click", copyText);
el.sampleBtn.addEventListener("click", fillSample);
el.resetBtn.addEventListener("click", () => {
  el.form.reset();
  updateGradesAndSubjects();
});
el.clearHistoryBtn.addEventListener("click", () => {
  history = [];
  localStorage.removeItem("gurusuite-history");
  renderHistory();
});

init();
