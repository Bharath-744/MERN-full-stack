const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart.js");
const Product = require("../models/Product.js");

const isAuthenticated = (req, res, next) => {
  const userId = req.query.userId;
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
    let cart = await Cart.findOne({ user: req.userId });
    if (!cart) {
      cart = new Cart({ user: req.userId, items: [] });
    }

    const existingItem = cart.items.find((item) => item.product.toString() === productId);
    if (existingItem) {
      existingItem.quantity += quantity;
      await cart.save();
      return res.status(200).json({ message: "Added successfully" });
    } else {
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found or out of stock" });
      }
      cart.items.push({ product: productId, quantity });
      await cart.save();
      return res.status(200).json({ message: "Added successfully" });
    }
  } catch (err) {
    console.error("Error while adding to cart", err);
    return res.status(500).json({ message: "Internal server error while adding to cart" });
  }
});

// ✅ Delete one quantity
router.delete("/", isAuthenticated, async (req, res) => {
  const { productId } = req.body;
  try {
    let cart = await Cart.findOne({ user: req.userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    // ✅ decrease quantity by 1
    if (cart.items[itemIndex].quantity > 1) {
      cart.items[itemIndex].quantity -= 1;
    } else {
      // remove item completely if quantity reaches 0
      cart.items.splice(itemIndex, 1);
    }

    await cart.save();
    return res.status(200).json({ message: "Item updated successfully", cart });
  } catch (err) {
    console.error("Error deleting item", err);
    return res.status(500).json({ message: "Internal server error while deleting item" });
  }
});

module.exports = router;