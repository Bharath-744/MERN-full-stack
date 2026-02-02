const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart");
const Product = require("../models/Product");

// Auth middleware
const isAuthenticated = (req, res, next) => {
  const userId = req.query.userId || req.body.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized. Login first" });
  }
  req.userId = userId;
  next();
};

// ✅ GET CART
router.get("/", isAuthenticated, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.userId }).populate("items.product");

    if (!cart) {
      cart = new Cart({ user: req.userId, items: [] });
      await cart.save();
    }

    cart.items = cart.items.filter(item => item.product);
    await cart.save();

    return res.status(200).json({ cart });
  } catch (err) {
    console.error("Fetch cart error", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ ADD TO CART
router.post("/add", isAuthenticated, async (req, res) => {
  const { productId, quantity } = req.body;

  try {
    if (quantity <= 0) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    let cart = await Cart.findOne({ user: req.userId });
    if (!cart) cart = new Cart({ user: req.userId, items: [] });

    const item = cart.items.find(i => i.product.toString() === productId);

    if (item) {
      item.quantity = product.stock
        ? Math.min(item.quantity + quantity, product.stock)
        : item.quantity + quantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }

    await cart.save();
    return res.status(200).json({ cart });
  } catch (err) {
    console.error("Add cart error", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ UPDATE QUANTITY
router.put("/", isAuthenticated, async (req, res) => {
  const { productId, quantity } = req.body;

  try {
    const cart = await Cart.findOne({ user: req.userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.find(i => i.product.toString() === productId);
    if (!item) return res.status(404).json({ message: "Item not found" });

    if (quantity <= 0) {
      cart.items = cart.items.filter(i => i.product.toString() !== productId);
    } else {
      item.quantity = quantity;
    }

    await cart.save();
    return res.status(200).json({ cart });
  } catch (err) {
    console.error("Update quantity error", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ DELETE ITEM
router.delete("/", isAuthenticated, async (req, res) => {
  const { productId } = req.body;

  try {
    const cart = await Cart.findOne({ user: req.userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter(i => i.product.toString() !== productId);
    await cart.save();

    return res.status(200).json({ cart });
  } catch (err) {
    console.error("Delete item error", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ CLEAR CART
router.delete("/clear", isAuthenticated, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = [];
    await cart.save();

    return res.status(200).json({ cart });
  } catch (err) {
    console.error("Clear cart error", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;