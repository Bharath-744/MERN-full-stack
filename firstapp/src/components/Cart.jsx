import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaShoppingCart } from 'react-icons/fa';   // ✅ Cart icon
import { useNavigate } from 'react-router-dom';   // ✅ Navigation

export default function Cart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  async function fetchCart() {
    if (!userId) {
      alert("Login first to view your cart");
      return;
    }
    try {
      const res = await axios.get("https://mern-full-stack-ieud.onrender.com/api/cart", {
        params: { userId }
      });
      if (res.status === 200) {
        setCart(res.data);
      }
    } catch (err) {
      console.error("Error fetching cart", err);
      toast.error("Failed to load cart");
    } finally {
      setLoading(false);
    }
  }

  async function updateQuantity(productId, newQty) {
    try {
      const res = await axios.put("https://mern-full-stack-ieud.onrender.com/api/cart", {
        userId,
        productId,
        quantity: newQty
      });
      setCart(res.data.cart);
      toast.success("Quantity updated!");
    } catch (err) {
      console.error("Error updating quantity", err);
      toast.error("Failed to update quantity");
    }
  }

  async function deleteItem(productId) {
    try {
      const res = await axios.delete("https://mern-full-stack-ieud.onrender.com/api/cart", {
        params: { userId },
        data: { productId }
      });
      setCart(res.data.cart);
      toast.success("Item removed from cart");
    } catch (err) {
      console.error("Error deleting item", err);
      toast.error("Failed to delete item");
    }
  }

  async function clearCart() {
    try {
      const res = await axios.delete("https://mern-full-stack-ieud.onrender.com/api/cart/clear", {
        params: { userId }
      });
      setCart(res.data.cart);
      toast.success("Cart cleared!");
    } catch (err) {
      console.error("Error clearing cart", err);
      toast.error("Failed to clear cart");
    }
  }

  const parsePrice = (price) => Number(price?.toString().replace(/,/g, '')) || 0;

  const calculateTotal = () => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((sum, item) => {
      const price = parsePrice(item.product.price);
      return sum + price * item.quantity;
    }, 0);
  };

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
    <div className='container mt-4'>
      <ToastContainer />

      {/* ✅ Top header with cart icon + blue continue shopping button */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>
          <FaShoppingCart size={24} style={{ marginRight: '8px', color: '#007bff' }} />
          Your Cart
        </h2>
        <button 
          type="button" 
          className="btn btn-primary"   // 🔵 Blue button
          onClick={() => navigate("/")} // navigate to homepage
        >
          Continue Shopping
        </button>
      </div>

      {
        loading ? (<p>Loading...</p>) : (
          !cart || cart.items.length === 0 ? (
            <div className="alert alert-info">Your cart is empty. Start shopping!</div>
          ) : (
            <div className="row">
              <div className="col-md-8">
                <div className='row row-cols-1 row-cols-md-2 g-4 mt-3'>
                  {cart.items.map((item) => {
                    const price = parsePrice(item.product.price);
                    const total = price * item.quantity;
                    return (
                      <div className="col" key={item.product._id}>
                        <div className="card h-100">
                          <div className="card-body">
                            <h5 className="card-title"><b>Name:</b> {item.product.name}</h5>
                            <p className="card-text"><b>Price:</b> ₹{price.toLocaleString()}</p>
                            <p className="card-text"><b>Category:</b> {item.product.category}</p>
                            <p className="card-text"><b>Description:</b> {item.product.description}</p>
                            <p className="card-text"><b>Total:</b> ₹{total.toLocaleString()}</p>

                            {/* ✅ Quantity controls */}
                            <div className="d-flex align-items-center mb-2">
                              <button 
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                              >
                                −
                              </button>
                              <span className="mx-2">{item.quantity}</span>
                              <button 
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                                disabled={item.product.stock && item.quantity >= item.product.stock}
                              >
                                +
                              </button>
                            </div>

                            {/* Delete button */}
                            <button 
                              className="btn btn-danger mt-2"
                              onClick={() => deleteItem(item.product._id)}
                            >
                              Delete Item
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ✅ Price summary box */}
              <div className="col-md-4">
                <div className="card p-3">
                  <h5>Price Details</h5>
                  <p>Price ({cart.items.length} items): ₹{calculateTotal().toLocaleString()}</p>
                  <p>Discount: −₹{discount.toLocaleString()}</p>
                  <p>Platform Fee: ₹7</p>
                  <h4>Total Amount: ₹{(calculateTotal() - discount + 7).toLocaleString()}</h4>
                  <p className="text-success">You will save ₹{discount.toLocaleString()} on this order</p>

                  {/* ✅ Coupon input */}
                  <div className="mt-3">
                    <input 
                      type="text" 
                      className="form-control mb-2" 
                      placeholder="Enter coupon code" 
                      value={coupon} 
                      onChange={(e) => setCoupon(e.target.value)} 
                    />
                    <button type="button" className="btn btn-primary w-100" onClick={applyCoupon}>
                      Apply Coupon
                    </button>
                  </div>

                  {/* ✅ Clear cart button */}
                  <button type="button" className="btn btn-warning w-100 mt-3" onClick={clearCart}>
                    Clear Cart
                  </button>

                  <button type="button" className="btn btn-success w-100 mt-3">Place Order</button>
                </div>
              </div>
            </div>
          )
        )
      }
    </div>
  );
}
