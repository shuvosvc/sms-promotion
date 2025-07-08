const { api, auth } = require("../helpers/common");
const errors = require("../helpers/errors");

// ✅ Create Promotion
exports.createPromotion = api(["msg"], auth(async (req, connection) => {
  const { msg } = req.body;

  if (typeof msg !== "string" || msg.trim() === "") {
    throw new errors.INVALID_FIELDS_PROVIDED("Field 'msg' must be a non-empty string.");
  }

  const result = await connection.query(
    `INSERT INTO promotion (msg) VALUES ($1) RETURNING *`,
    [msg]
  );

  return { flag: 200, message: "Promotion created", data: result };
}));

// ✅ Get All Promotions
exports.getAllPromotions = api(auth(async (req, connection) => {
  const result = await connection.query(
    `SELECT * FROM promotion WHERE deleted = FALSE ORDER BY created_at DESC`
  );

  return { flag: 200, data: result };
}));

// ✅ Get One Promotion by ID
exports.getPromotionById = api(["id"], auth(async (req, connection) => {
  const { id } = req.body;

  const result = await connection.queryOne(
    `SELECT * FROM promotion WHERE id = $1 AND deleted = FALSE`,
    [id]
  );

  if (!result) {
    throw new errors.NOT_FOUND("Promotion not found");
  }

  return { flag: 200, data: result };
}));

// ✅ Update Promotion
exports.updatePromotion = api(["id", "msg"], auth(async (req, connection) => {
  const { id, msg } = req.body;

  if (typeof msg !== "string" || msg.trim() === "") {
    throw new errors.INVALID_FIELDS_PROVIDED("Field 'msg' must be a non-empty string.");
  }

  // 🔍 Check if promotion exists and not deleted
  const check = await connection.queryOne(
    `SELECT id FROM promotion WHERE id = $1 AND deleted = FALSE`,
    [id]
  );

  if (!check) throw new errors.NOT_FOUND("Promotion not found");

  await connection.query(
    `UPDATE promotion SET msg = $1 WHERE id = $2`,
    [msg, id]
  );

  return { flag: 200, message: "Promotion updated successfully" };
}));


// ✅ Soft Delete Promotion
exports.deletePromotion = api(["id"], auth(async (req, connection) => {
  const { id } = req.body;


 // 🔍 Check if promotion exists and not deleted
  const check = await connection.queryOne(
    `SELECT id FROM promotion WHERE id = $1 AND deleted = FALSE`,
    [id]
  );

  if (!check) throw new errors.NOT_FOUND("Promotion not found");


  await connection.query(
    `UPDATE promotion SET deleted = TRUE WHERE id = $1`,
    [id]
  );

  return { flag: 200, message: "Promotion deleted successfully" };
}));
