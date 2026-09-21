const express = require("express");
const {
  getExpenses,
  getExpensesByUser,
  createExpense,
  updateExpense,
  deleteExpense,
} = require("../controllers/expensesController");

const router = express.Router();

router.get("/:user", getExpensesByUser);
router.post("/", createExpense);
router.put("/:id", updateExpense);
router.delete("/:id", deleteExpense);

module.exports = router;
