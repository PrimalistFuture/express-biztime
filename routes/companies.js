const express = require("express");
const router = express.Router();
const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");

/** Returns list of all companies {companies: [{code, name}, ...]} */
router.get("/", async function (req, res) {
  const result = await db.query(
    `SELECT code, name
      FROM companies`
  );

  const companies = result.rows;

  return res.json({ companies });
});


/** Returns company object at code: {company: {code, name, description}} */
router.get("/:code", async function (req, res) {
  const result = await db.query(
    `SELECT code, name, description
      FROM companies
      WHERE code = $1`,
    [req.params.code]
  );

  const company = result.rows[0];
  if (!company) throw new NotFoundError("Company not found.");

  return res.json({ company });
});


/**
 * Adds a company to biztime.
 * Params: {code, name, description}
 * Returns {company: {code, name, description}}  */

router.post("/", async function (req, res) {
  const { code, name, description } = req.body;
  if (!code || !name || !description)
    throw new BadRequestError("Invalid request data.");

  const result = await db.query(
    `INSERT INTO companies (code, name, description)
      VALUES ($1, $2, $3)
      RETURNING code, name, description`,
    [code, name, description]
  );

  const company = result.rows[0];

  return res.status(201).json({ company });
});


/**
 * Edits an exisiting company
 * Params: {name, description}
 * Returns: {company: {code, name, description}}*/

router.put("/:code", async function (req, res) {
  const { name, description } = req.body;
  if (!name || !description) throw new BadRequestError("Invalid request data.");

  const result = await db.query(
    `UPDATE companies
      SET name = $2,
          description = $3
      WHERE code = $1
      RETURNING code, name, description`,
    [req.params.code, name, description]
  );

  const company = result.rows[0];
  if (!company) throw new NotFoundError("Company not found.");
  return res.json({ company });
});


/** Deletes company with given code,
 * returns: {status: "deleted"} */
router.delete('/:code', async function (req, res) {

  const result = await db.query(
    `DELETE FROM companies WHERE code = $1
    RETURNING code`,
    [req.params.code],
  );

  const company = result.rows[0];
  if (!company) throw new NotFoundError("Company not found.");
  return res.json({ status: "deleted" });
});


module.exports = router;
