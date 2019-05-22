//savedata.js

const savedata =  (channel, psid, qrtype, accounrnao, accountname, totalcharge, filename, isqr, ispdf) => {
	insertToQrTable(channel, psid, qrtype, accounrnao, accountname, totalcharge, filename, isqr, ispdf);
}

const insertToQrTable = (channel, psid, qrtype, accounrnao, accountname, totalcharge, filename, isqr, ispdf) => {
	const { Pool } = require('pg');
	const dbconfig = require('./dbconfig');
	const pool = new Pool( dbconfig);

	(async () => {
	  const client = await pool.connect();
	  try {
		await client.query('BEGIN');
		/*
		var stringQueryShop = "select * from shop order by id";
		const { rows } = await client.query(stringQueryShop);
		console.log(JSON.stringify(rows));
		//response.status(200).send(rows.rows);
		*/
		/*
		const { rows } = await client.query('INSERT INTO users(name) VALUES($1) RETURNING id', ['brianc']);
		const insertCommandText = "insert into qr(nextval('qr_seq_id'), channel, psid, qrtype, accounrnao, accountname, totalcharge, filename, isqr, ispdf, now()) values ($1, $2, $3, $4, $5, $6, $7, $8, $9)";
		const insertValues = [res.rows[0].id, 's3.bucket.foo'];
		*/
		const insertCommandText = "insert into qr (id, channel, psid, qrtype, accountno, accountname, totalcharge, filename, isqr, ispdf, date) values(nextval('qr_seq_id'), $1, $2, $3, $4, $5, $6, $7, $8, $9, now())";
		const insertValues = [channel, psid, qrtype, accounrnao, accountname, totalcharge, filename, isqr, ispdf];
		await client.query(insertCommandText, insertValues);
		await client.query('COMMIT');
	  } catch (e) {
		await client.query('ROLLBACK');
		throw e;
	  } finally {
		client.release();
	  }
	})().catch(e => console.error(e.stack));
}

module.exports = savedata;