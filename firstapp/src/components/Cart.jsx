import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaShoppingCart } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function Cart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  // Fetch cart from backend
  async function fetchCart() {
    if (!userId) {
      toast.error("Please login to view your cart");
      navigate("/login");
      return;
    }

    try {
      const res = await axios.get(
        "https://mern-full-stack-ieud.onrender.com/api/cart",
        { params: { userId } }
      );
      if (res.status === 200) setCart(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load cart");
    } finally {
      setLoading(false);
    }
  }

  // Update quantity of a product
  async function updateQuantity(productId, newQty) {
    try {
      const res = await axios.put(
        "https://mern-full-stack-ieud.onrender.com/api/cart",
        { userId, productId, quantity: newQty }
      );

      setCart(res.data.cart);
      setDiscount(0); // reset coupon
      setCoupon("");
      toast.success("Quantity updated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update quantity");
    }
  }

  // Delete single item
  async function deleteItem(productId) {
    try {
      const res = await axios.delete(
        "https://mern-full-stack-ieud.onrender.com/api/cart",
        { data: { userId, productId } }
      );

      setCart(res.data.cart);
      setDiscount(0);
      setCoupon("");
      toast.success("Item removed from cart");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete item");
    }
  }

  // Clear cart
  async function clearCart() {
    try {
      const res = await axios.delete(
        "https://mern-full-stack-ieud.onrender.com/api/cart/clear",
        { params: { userId } }
      );

      setCart(res.data.cart);
      setDiscount(0);
      setCoupon("");
      toast.success("Cart cleared!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to clear cart");
    }
  }

  // Calculate total price
  const calculateTotal = () => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((sum, item) => {
      if (!item.product) return sum;
      return sum + item.product.price * item.quantity;
    }, 0);
  };

  // Apply coupon
  function applyCoupon() {
    const total = calculateTotal();
    if (coupon === "SAVE20") {
      setDiscount(Math.floor(total * 0.2));
      toast.success("Coupon applied: 20% off!");
    } else if (coupon === "SAVE50") {
      setDiscount(Math.floor(total * 0.5));
      toast.success("Coupon applied: 50% off!");
    } else {
      setDiscount(0);
      toast.error("Invalid coupon code");
    }
  }

  return (
    <div className="container mt-4">
      <ToastContainer />

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>
          <FaShoppingCart size={24} className="me-2 text-primary" />
          Your Cart
        </h2>
        <button className="btn btn-primary" onClick={() => navigate("/")}>
          Continue Shopping
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      {/* Empty cart */}
      {!loading && (!cart || cart.items.length === 0) && (
        <div className="alert alert-info">
          Your cart is empty. Start shopping!
        </div>
      )}

      {/* Cart items */}
      {!loading && cart && cart.items.length > 0 && (
        <div className="row">
          {/* Items list */}
          <div className="col-md-8">
            <div className="row row-cols-1 row-cols-md-2 g-4 mt-3">
              {cart.items.map((item) => {
                const product = item.product;
                if (!product) return null;

                const total = product.price * item.quantity;

                return (
                  <div className="col" key={product._id}>
                    <div className="card h-100">
                      <div className="card-body">
                        <h5 className="card-title">
                          <b>Name:</b> {product.name}
                        </h5>
                        <p className="card-text">
                          <b>Price:</b> ₹{product.price.toLocaleString()}
                        </p>
                        <p className="card-text">
                          <b>Category:</b> {product.category}
                        </p>
                        <p className="card-text">
                          <b>Description:</b> {product.description}
                        </p>
                        <p>
                          <b>Stock:</b>{" "}
                          <span
                            className={`badge ${
                              product.stock > 0 ? "bg-success" : "bg-danger"
                            }`}
                          >
                            {product.stock > 0
                              ? `${product.stock} available`
                              : "Out of stock"}
                          </span>
                        </p>
                        <p className="card-text">
                          <b>Total:</b> ₹{total.toLocaleString()}
                        </p>

                        {/* Quantity controls */}
                        <div className="d-flex align-items-center mb-2">
                          <button
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() =>
                              updateQuantity(product._id, item.quantity - 1)
                            }
                            disabled={item.quantity <= 1}
                          >
                            −
                          </button>
                          <span className="mx-2">{item.quantity}</span>
                          <button
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() =>
                              updateQuantity(product._id, item.quantity + 1)
                            }
                            disabled={product.stock && item.quantity >= product.stock}
                          >
                            +
                          </button>
                        </div>

                        {/* Delete button */}
                        <button
                          className="btn btn-danger mt-2"
                          onClick={() => deleteItem(product._id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Price summary */}
          <div className="col-md-4">
            <div className="card p-3">
              <h5>Price Details</h5>
              <p>Price ({cart.items.length} items): ₹{calculateTotal().toLocaleString()}</p>
              <p>Discount: −₹{discount.toLocaleString()}</p>
              <p>Platform Fee: ₹7</p>
              <h4>Total Amount: ₹{(calculateTotal() - discount + 7).toLocaleString()}</h4>
              <p className="text-success">
                You will save ₹{discount.toLocaleString()} on this order
              </p>

              {/* Coupon input */}
              <div className="mt-3">
                <input
                  type="text"
                  className="form-control mb-2"
                  placeholder="Enter coupon code"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                />
                <button className="btn btn-primary w-100" onClick={applyCoupon}>
                  Apply Coupon
                </button>
                <div className="mt-2 text-muted">
                  Try: <code>SAVE20</code> or <code>SAVE50</code>
                </div>
              </div>

              {/* Cart actions */}
              <button className="btn btn-warning w-100 mt-3" onClick={clearCart}>
                Clear Cart
              </button>
              <button
                className="btn btn-success w-100 mt-3"
                disabled={!cart || cart.items.length === 0}
              >
                Place Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}