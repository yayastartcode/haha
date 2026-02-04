const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

async function initBiography() {
    const defaultContent = `
        <p>Hudan Hidayat, seorang cerpenis, penyair, sekaligus eseis sastra kelahiran Yogyakarta yang kini tinggal di Jakarta telah bersedia berpartisipasi sebagai juri pada kegiatan MataKataKita. Hudan, yang oleh para fesbuker juga dikenal lewat fenomena Jurnal Sastratuhan Hudan, mengaku siap untuk menilai karya yang masuk, baik dari penulis mata awas (masyarakat normal) dan tunanetra.</p>
        <p><br></p>
        <p>Hudan Hidayat menulis pertama kali di majalah Zaman pada 1984. Lulusan Fisipol jurusan Hubungan Internasional di Universitas Jayabaya ini pada April 1999 menghadiri Pertemuan Sastra Nusantara di Malaysia bersama beberapa sastrawan Indonesia lainnya. Pernah tinggal di Tokyo dan Tottory selama satu bulan untuk program pertukaran pemuda. Tahun 1999 bersama sastrawan Indonesia lain diundang menghadiri acara sastra di Thailand. Pada bulan Maret 2000, ia diundang Dewan Kesenian Jakarta (DKJ) untuk membacakan cerpen-cerpennya.</p>
    `;
    const defaultTitle = "Tentang Hudan Hidayat";
    const defaultImage = "images/tentang.jpeg";

    try {
        const [rows] = await pool.promise().query('SELECT * FROM content_items WHERE category = "biography"');

        if (rows.length === 0) {
            await pool.promise().query(
                'INSERT INTO content_items (category, title, content, image_url) VALUES (?, ?, ?, ?)',
                ['biography', defaultTitle, defaultContent, defaultImage]
            );
            console.log('Default biography created.');
        } else {
            console.log('Biography already exists. Skipping.');
        }
    } catch (err) {
        console.error('Error initializing biography:', err);
    } finally {
        pool.end();
    }
}

initBiography();
