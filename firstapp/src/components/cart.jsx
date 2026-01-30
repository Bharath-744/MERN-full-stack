import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Cart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    fetchCart();
  }, []);

  async function fetchCart() {
    if (!userId) {
      alert("Login first to view your cart");
      return;
    }
    axios.get("http://localhost:4000/api/cart", {
      params: { userId }
    })
      .then(res => {
        if (res.status === 200) {
          setCart(res.data);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error("Error fetching cart", err);
        setLoading(false);
      });
  }

  // ✅ Delete one quantity
  async function deleteItem(productId) {
    try {
      await axios.delete("http://localhost:4000/api/cart", {
        params: { userId },   // send userId in query
        data: { productId }   // backend reduces by 1
      });
      fetchCart(); // refresh cart after deletion
    } catch (err) {
      console.error("Error deleting item", err);
      alert("Failed to delete item");
    }
  }

  // ✅ Calculate grand total
  const calculateTotal = () => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  };

  return (
    <div className='container mt-4'>
      <h2>Your Cart</h2>
      {
        loading ? (<p>Loading...</p>) : (
          !cart || cart.items.length === 0 ? (
            <p>No products in cart</p>
          ) : (
            <>
              <div className='row row-cols-1 row-cols-md-2 g-4 mt-3'>
                {
                  cart.items.map((item) => (
                    <div className="col" key={item.product._id}>
                      <div className="card h-100">
                        <div className="card-body">
                          <h5 className="card-title"><b>Name:</b> {item.product.name}</h5>
                          <p className="card-text"><b>Price: </b>{item.product.price}</p>
                          <p className="card-text"><b>Category: </b>{item.product.category}</p>
                          <p className="card-text"><b>Description: </b>{item.product.description}</p>
                          <p className="card-text"><b>Quantity: </b>{item.quantity}</p>
                          <p className="card-text"><b>Total: </b>{item.product.price * item.quantity}</p>
                          
                          {/* ✅ Delete one quantity button */}
                          <button 
                            className="btn btn-danger mt-2"
                            onClick={() => deleteItem(item.product._id)}
                          >
                            Delete One
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>

              {/* ✅ Grand total section */}
              <div className="mt-4">
                <h4>Grand Total: {calculateTotal()}</h4>
              </div>
            </>
          )
        )
      }
    </div>
  );
}