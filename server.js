const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(bodyParser.json());

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'pusrimed_wgatway',
    password: 'pusrimed_wgatway',
    database: 'pusrimed_wgdev'
});

connection.connect(err => {
  if (err) throw err;
  console.log('Terhubung ke database');
});

app.post('/api/jenis-barang', (req, res) => {
  const { jenis_barang } = req.body;
  const sql = 'INSERT INTO JenisBarang (jenis_barang) VALUES (?)';
  connection.query(sql, [jenis_barang], (err, result) => {
    if (err) throw err;
    res.json({ id: result.insertId, jenis_barang });
  });
});

app.get('/api/jenis-barang', (req, res) => {
  const sql = 'SELECT * FROM JenisBarang';
  connection.query(sql, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

app.put('/api/jenis-barang/:id', (req, res) => {
  const { id } = req.params;
  const { jenis_barang } = req.body;
  const sql = 'UPDATE JenisBarang SET jenis_barang = ? WHERE id_jenis = ?';
  connection.query(sql, [jenis_barang, id], (err, result) => {
    if (err) throw err;
    res.json({ id, jenis_barang });
  });
});

app.delete('/api/jenis-barang/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM JenisBarang WHERE id_jenis = ?';
  connection.query(sql, [id], (err, result) => {
    if (err) throw err;
    res.json({ id });
  });
});

app.post('/api/barang', (req, res) => {
  const { nama_barang, stok, id_jenis } = req.body;
  const sql = 'INSERT INTO Barang (nama_barang, stok, id_jenis) VALUES (?, ?, ?)';
  connection.query(sql, [nama_barang, stok, id_jenis], (err, result) => {
    if (err) throw err;
    res.json({ id: result.insertId, nama_barang, stok, id_jenis });
  });
});

app.get('/api/barang', (req, res) => {
  const { search, sort } = req.query;
  let sql = 'SELECT * FROM Barang';
  if (search) {
    sql += ` WHERE nama_barang LIKE '%${search}%'`;
  }
  if (sort) {
    sql += ` ORDER BY ${sort}`;
  }
  connection.query(sql, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

app.put('/api/barang/:id', (req, res) => {
  const { id } = req.params;
  const { nama_barang, stok, id_jenis } = req.body;
  const sql = 'UPDATE Barang SET nama_barang = ?, stok = ?, id_jenis = ? WHERE id_barang = ?';
  connection.query(sql, [nama_barang, stok, id_jenis, id], (err, result) => {
    if (err) throw err;
    res.json({ id, nama_barang, stok, id_jenis });
  });
});

app.delete('/api/barang/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM Barang WHERE id_barang = ?';
  connection.query(sql, [id], (err, result) => {
    if (err) throw err;
    res.json({ id });
  });
});

  
app.post('/api/transaksi', (req, res) => {
    const { id_barang, jumlah_terjual, tanggal_transaksi } = req.body;
    const sql = 'INSERT INTO Transaksi (id_barang, jumlah_terjual, tanggal_transaksi) VALUES (?, ?, ?)';
    connection.query(sql, [id_barang, jumlah_terjual, tanggal_transaksi], (err, result) => {
      if (err) throw err;
      res.json({ id: result.insertId, id_barang, jumlah_terjual, tanggal_transaksi });
    });
  });
  
  app.get('/api/transaksi', (req, res) => {
    const { search, sort } = req.query;
    let sql = "SELECT * FROM Transaksi JOIN Barang ON Barang.id_barang = Transaksi.id_barang JOIN JenisBarang ON JenisBarang.id_jenis = Barang.id_jenis";
    if (search) {
      sql += ` WHERE Transaksi.tanggal_transaksi LIKE '%${search}%'`;
    }
    if (sort) {
      sql += ` ORDER BY Transaksi.${sort}`;
    }
    connection.query(sql, (err, results) => {
      if (err) throw err;
      res.json(results);
    });
  });
  
  app.put('/api/transaksi/:id', (req, res) => {
    const { id } = req.params;
    const { id_barang, jumlah_terjual, tanggal_transaksi } = req.body;
    const sql = 'UPDATE Transaksi SET id_barang = ?, jumlah_terjual = ?, tanggal_transaksi = ? WHERE id_transaksi = ?';
    connection.query(sql, [id_barang, jumlah_terjual, tanggal_transaksi, id], (err, result) => {
      if (err) throw err;
      res.json({ id, id_barang, jumlah_terjual, tanggal_transaksi });
    });
  });
  
  app.delete('/api/transaksi/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM Transaksi WHERE id_transaksi = ?';
    connection.query(sql, [id], (err, result) => {
      if (err) throw err;
      res.json({ id });
    });
  });

  app.get('/api/transaksi/compare', (req, res) => {
    const { order = 'asc', startDate, endDate } = req.query; // Default order to 'asc'
    let query = `
        SELECT jb.jenis_barang, SUM(t.jumlah_terjual) as total_terjual
        FROM Barang b
        JOIN Transaksi t ON t.id_barang = b.id_barang
        JOIN JenisBarang jb ON b.id_jenis = jb.id_jenis
    `;

    const queryParams = [];

    // Add conditions for date filtering if provided
    if (startDate && endDate) {
        query += ` WHERE DATE_FORMAT(t.tanggal_transaksi, '%Y-%m-%d') BETWEEN ? AND ?`;
        queryParams.push(startDate, endDate);
    }

    // Add grouping and ordering
    query += `
        GROUP BY jb.jenis_barang
        ORDER BY total_terjual ${order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'};
    `;

    // Execute the query
    connection.query(query, queryParams, (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            return res.status(500).json({ error: 'Error fetching data' });
        }
        res.json(results);
    });
});





app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});

