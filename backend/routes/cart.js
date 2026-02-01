const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart.js");
const Product = require("../models/Product.js");

// Middleware to check userId
const isAuthenticated = (req, res, next) => {
  const userId = req.query.userId || req.body.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized. Login first" });
  }
  req.userId = userId;
  next();
};

// GET cart
router.get("/", isAuthenticated, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.userId }).populate("items.product");

    if (!cart) return res.status(200).json({ items: [] });

    // Remove invalid items
    const validItems = cart.items.filter(item => item.product);
    if (validItems.length !== cart.items.length) {
      cart.items = validItems;
      await cart.save();
    }

    return res.status(200).json(cart);
  } catch (err) {
    console.error("Error fetching cart", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ADD to cart
router.post("/add", isAuthenticated, async (req, res) => {
  const { productId, quantity } = req.body;
  try {
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (product.stock && quantity > product.stock) {
      return res.status(400).json({ message: "Not enough stock available" });
    }

    let cart = await Cart.findOne({ user: req.userId });
    if (!cart) cart = new Cart({ user: req.userId, items: [] });

    const existingItem = cart.items.find(item => item.product.toString() === productId);

    if (existingItem) {
      // ✅ Update quantity but not exceed stock
      const newQty = existingItem.quantity + quantity;
      existingItem.quantity = product.stock ? Math.min(newQty, product.stock) : newQty;
    } else {
      cart.items.push({ product: productId, quantity });
    }

    await cart.save();
    return res.status(200).json({ message: "Added to cart", cart });
  } catch (err) {
    console.error("Error adding to cart", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// UPDATE quantity
router.put("/", isAuthenticated, async (req, res) => {
  const { productId, quantity } = req.body;
  try {
    let cart = await Cart.findOne({ user: req.userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.find(i => i.product.toString() === productId);
    if (!item) return res.status(404).json({ message: "Item not in cart" });

    const product = await Product.findById(productId);
    if (!product) {
      cart.items = cart.items.filter(i => i.product.toString() !== productId);
      await cart.save();
      return res.status(404).json({ message: "Product no longer exists. Removed from cart." });
    }

    if (quantity <= 0) {
      cart.items = cart.items.filter(i => i.product.toString() !== productId);
    } else {
      item.quantity = product.stock ? Math.min(quantity, product.stock) : quantity;
    }

    await cart.save();
    return res.status(200).json({ message: "Quantity updated", cart });
  } catch (err) {
    console.error("Error updating quantity", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE single item
router.delete("/", isAuthenticated, async (req, res) => {
  const { productId } = req.body;
  try {
    let cart = await Cart.findOne({ user: req.userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter(item => item.product.toString() !== productId);

    await cart.save();
    return res.status(200).json({ message: "Item removed", cart });
  } catch (err) {
    console.error("Error deleting item", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// CLEAR cart
router.delete("/clear", isAuthenticated, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = [];
    await cart.save();
    return res.status(200).json({ message: "Cart cleared", cart });
  } catch (err) {
    console.error("Error clearing cart", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// APPLY coupon
router.post("/applyCoupon", isAuthenticated, async (req, res) => {
  const { code } = req.body;
  const validCoupons = { SAVE20: 0.2, SAVE50: 0.5 };

  if (!validCoupons[code]) return res.status(400).json({ message: "Invalid coupon code" });

  const cart = await Cart.findOne({ user: req.userId }).populate("items.product");
  if (!cart) return res.status(404).json({ message: "Cart not found" });

  const total = cart.items.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);
  const discount = total * validCoupons[code];

  return res.status(200).json({
    message: "Coupon applied",
    discount,
    totalAfterDiscount: total - discount,
    cart
  });
});

// CLEANUP broken items
router.delete("/cleanup", isAuthenticated, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.userId }).populate("items.product");
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter(item => item.product); // remove null products
    await cart.save();

    return res.status(200).json({ message: "Cart cleaned", cart });
  } catch (err) {
    console.error("Error cleaning cart", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;