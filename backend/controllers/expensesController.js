const Expenses = require("../models/expensesModel");

const getExpensesByUser = async (req, res) => {
  try {
    if (req.params.user !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    const expenses = await Expenses.find({
      user: req.user._id,
    }).sort({ date: -1 });

    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllExpenses = async (req, res) => {
  try {
    const expenses = await Expenses.find().sort({ date: -1 });
    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createExpense = async (req, res) => {
  try {
    const expense = await Expenses.create({
      ...req.body,
      user: req.user._id,
    });

    res.status(201).json(expense);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const updateExpense = async (req, res) => {
  try {
    const expense = await Expenses.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    if (expense.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    const updatedExpense = await Expenses.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.status(200).json(updatedExpense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteExpense = async (req, res) => {
  try {
    const expense = await Expenses.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    if (expense.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    await Expenses.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Expense deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getExpensesSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let match = {
      user: req.user._id,
    };

    if (startDate && endDate) {
      match.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const summary = await Expenses.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
          avgAmount: { $avg: "$amount" },
        },
      },
      {
        $project: {
          _id: 0,
          totalAmount: 1,
          count: 1,
          avgAmount: { $round: ["$avgAmount", 2] },
        },
      },
    ]);

    res.status(200).json(
      summary[0] || {
        totalAmount: 0,
        count: 0,
        avgAmount: 0,
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAdminExpenses = async (req, res) => {
  try {
    const expenses = await Expenses.find().sort({ date: -1 });
    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getExpensesByUser,
  getAllExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpensesSummary,
  getAdminExpenses,
};