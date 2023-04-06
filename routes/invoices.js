const express = require("express");
const router = express.Router();
const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");


/** Returns list of all invoices {invoices: [{id, comp_code}, ...]} */
router.get("/", async function (req, res) {
  const result = await db.query(
    `SELECT id, comp_code
    FROM invoices`,
  );

  const invoices = result.rows;
  return res.json({ invoices })
});

router.get('/:id', async function (req, res) {

  const invoiceResult = await db.query(
    `SELECT id, amt, paid, add_date, paid_date
    FROM invoices
    WHERE id = $1`,
    [req.params.id]
  );

  const companyResult = await db.query(
    `SELECT code, name, description
    FROM companies
    JOIN invoices
    ON companies.code = invoices.comp_code
    AND invoices.id = $1
    GROUP BY code`,
    [req.params.id]
  )

  const invoice = invoiceResult.rows[0];
  if (!invoice) throw new NotFoundError("Invoice not found.");
  const company = companyResult.rows[0];
  invoice.company = company
  return res.json({invoice})
})









module.exports = router;