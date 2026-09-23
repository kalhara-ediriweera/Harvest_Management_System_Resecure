const express = require("express");
const {
  getExpenses,
  getExpensesByUser,
  createExpense,
  updateExpense,
  deleteExpense,
} = require("../controllers/expensesController");

const { protect } = require("../middlewares/auth");

const router = express.Router();

router.get("/:user", protect, getExpensesByUser);
router.post("/", protect, createExpense);
router.put("/:id", protect, updateExpense);
router.delete("/:id", protect, deleteExpense);

module.exports = router;