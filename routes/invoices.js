const express = require("express");
const router = express.Router();
const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");


/** Returns list of all invoices {invoices: [{id, comp_code}, ...]} */
router.get("/", async function (req, res) {
  const result = await db.query(
    `SELECT id, comp_code
    FROM invoices`
  );

  const invoices = result.rows;
  return res.json({ invoices });
});


/** Returns invoice obj at id with its company :
 * {invoice: {id, amt, paid, add_date, paid_date,
 *    company: {code, name, description}}
 */
router.get("/:id", async function (req, res) {
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
  );

  const invoice = invoiceResult.rows[0];
  if (!invoice) throw new NotFoundError("Invoice not found.");
  const company = companyResult.rows[0];
  invoice.company = company;
  return res.json({ invoice });
});


/** Add an invoice */
router.post("/", async function (req, res) {
  const { comp_code, amt } = req.body;
  if (!comp_code || !amt) throw new BadRequestError("Invalid request data.");

  const result = await db.query(
    `INSERT INTO invoices (comp_code, amt)
      VALUES ($1, $2)
      RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [comp_code, amt]
  );

  const invoice = result.rows[0];
  return res.status(201).json({ invoice });
});


/** Updates an invoice:
 * Params: {amt},
 * Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 */
router.put("/:id", async function (req, res) {
  const result = await db.query(
    `UPDATE invoices
      SET amt = $1
      WHERE id = $2
      RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [req.body.amt, req.params.id]
  );

  const invoice = result.rows[0];
  if (!invoice) throw new NotFoundError("Invoice not found.");
  return res.json({ invoice });
});


/** Deletes an invoice. Returns {status: "deleted"} */
router.delete("/:id", async function (req, res) {
  const result = await db.query(
    `DELETE from invoices
      WHERE id = $1
        RETURNING id`,
    [req.params.id]
  );

  const invoice = result.rows[0];
  if (!invoice) throw new NotFoundError("Invoice not found.");
  return res.json({ status: "deleted" });
});

module.exports = router;
