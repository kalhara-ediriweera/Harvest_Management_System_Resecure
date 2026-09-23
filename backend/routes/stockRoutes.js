const { protect } = require("../middlewares/auth");
const express = require("express");
const router = express.Router();
const stockController = require("../controllers/stockController");

router.post("/add-stock", protect, stockController.addStock);
router.get("/get-stocks", protect, stockController.getStocks);
router.put("/update-stock/:id", protect, stockController.updateStock);
router.delete("/delete-stock/:id", protect, stockController.deleteStock);

module.exports = router;
