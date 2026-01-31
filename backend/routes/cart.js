const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart.js");
const Product = require("../models/Product.js");

// ✅ Middleware to check userId
const isAuthenticated = (req, res, next) => {
  const userId = req.query.userId || req.body.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized. Login first" });
  }
  req.userId = userId;
  next();
};

// ✅ Get cart
router.get("/", isAuthenticated, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.userId }).populate("items.product");
    if (!cart) {
      return res.status(200).json({ items: [] });
    }
    return res.status(200).json(cart);
  } catch (err) {
    console.error("Error fetching cart", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ Add to cart
router.post("/add", isAuthenticated, async (req, res) => {
  const { productId, quantity } = req.body;
  try {
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    let cart = await Cart.findOne({ user: req.userId });
    if (!cart) {
      cart = new Cart({ user: req.userId, items: [] });
    }

    const existingItem = cart.items.find((item) => item.product.toString() === productId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found or out of stock" });
      }
      if (product.stock && quantity > product.stock) {
        return res.status(400).json({ message: "Not enough stock available" });
      }
      cart.items.push({ product: productId, quantity });
    }

    await cart.save();
    return res.status(200).json({ message: "Added successfully", cart });
  } catch (err) {
    console.error("Error while adding to cart", err);
    return res.status(500).json({ message: "Internal server error while adding to cart" });
  }
});

// ✅ Update quantity (increase or decrease directly)
router.put("/", isAuthenticated, async (req, res) => {
  const { productId, quantity } = req.body;
  try {
    let cart = await Cart.findOne({ user: req.userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.find((i) => i.product.toString() === productId);
    if (!item) return res.status(404).json({ message: "Item not found in cart" });

    if (quantity <= 0) {
      cart.items = cart.items.filter((i) => i.product.toString() !== productId);
    } else {
      item.quantity = quantity;
    }

    await cart.save();
    return res.status(200).json({ message: "Quantity updated successfully", cart });
  } catch (err) {
    console.error("Error updating quantity", err);
    return res.status(500).json({ message: "Internal server error while updating quantity" });
  }
});

// ✅ Delete one quantity (shortcut for decrement)
router.delete("/", isAuthenticated, async (req, res) => {
  const { productId } = req.body;
  try {
    let cart = await Cart.findOne({ user: req.userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) return res.status(404).json({ message: "Item not found in cart" });

    if (cart.items[itemIndex].quantity > 1) {
      cart.items[itemIndex].quantity -= 1;
    } else {
      cart.items.splice(itemIndex, 1);
    }

    await cart.save();
    return res.status(200).json({ message: "Item updated successfully", cart });
  } catch (err) {
    console.error("Error deleting item", err);
    return res.status(500).json({ message: "Internal server error while deleting item" });
  }
});

// ✅ Clear cart
router.delete("/clear", isAuthenticated, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = [];
    await cart.save();
    return res.status(200).json({ message: "Cart cleared successfully", cart });
  } catch (err) {
    console.error("Error clearing cart", err);
    return res.status(500).json({ message: "Internal server error while clearing cart" });
  }
});

// ✅ Apply coupon
router.post("/applyCoupon", isAuthenticated, async (req, res) => {
  const { code } = req.body;
  const validCoupons = { SAVE20: 0.2, SAVE50: 0.5 };

  if (!validCoupons[code]) {
    return res.status(400).json({ message: "Invalid coupon code" });
  }

  let cart = await Cart.findOne({ user: req.userId }).populate("items.product");
  if (!cart) return res.status(404).json({ message: "Cart not found" });

  const total = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discount = total * validCoupons[code];

  return res.status(200).json({
    message: "Coupon applied",
    discount,
    totalAfterDiscount: total - discount,
    cart
  });
});

module.exports = router;
