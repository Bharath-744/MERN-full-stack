import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { FaShoppingCart, FaSearch, FaListUl } from 'react-icons/fa'   // cart, search, category icons
import { MdStorefront } from 'react-icons/md'     // storefront icon

export default function Home() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const role = localStorage.getItem("role")
  const navigate = useNavigate()

  useEffect(() => {
    fetchProducts()
  }, [])

  async function addToCart(productId) {
    const userId = localStorage.getItem("userId")
    if (!userId) {
      toast.error("Please login to access products")
      navigate("/login")
      return
    }

    try {
      const res = await axios.post("https://mern-full-stack-ieud.onrender.com/api/cart/add",
        { productId, quantity: 1 },
        { params: { userId } }
      )
      if (res.status === 200) {
        toast.success("Product added to cart!")
        navigate("/cart")
      }
    } catch (err) {
      console.error("Error adding to cart:", err)
      toast.error("Failed to add product to cart")
    }
  }

  async function fetchProducts() {
    try {
      const res = await axios.get("https://mern-full-stack-ieud.onrender.com/api/product")
      if (res.status === 200) {
        setProducts(res.data)
      }
    } catch (err) {
      console.error("Error fetching products:", err)
      toast.error("Failed to load products")
    } finally {
      setLoading(false)
    }
  }

  async function deleteProduct(productId) {
    try {
      const res = await axios.delete("https://mern-full-stack-ieud.onrender.com/api/product", {
        params: { productId }
      })
      if (res.status === 200) {
        toast.success("Product deleted!")
        setProducts(products.filter(p => p._id !== productId))
      }
    } catch (err) {
      console.error("Error deleting product:", err)
      toast.error("Failed to delete product")
    }
  }

  const filteredProducts = products.filter(i =>
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className='container mt-4'>
      <ToastContainer />

      {/* ✅ Welcome header with icons */}
      <div className="text-center mb-4">
        <h1>
          <MdStorefront className="me-2 text-primary" />
          Welcome to My Shop
          <FaShoppingCart className="ms-2 text-warning" />
        </h1>
        <p className="text-muted">Find the best products at great prices!</p>
      </div>

      {/* ✅ Search bar with icon */}
      <div className="input-group mb-3">
        <span className="input-group-text bg-light">
          <FaSearch className="text-secondary" />
        </span>
        <input
          type="text"
          className="form-control"
          placeholder="Search by name or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* ✅ Category filter with icon */}
      <div className="input-group mb-3">
        <span className="input-group-text bg-light">
          <FaListUl className="text-secondary" />
        </span>
        <select 
          className="form-select"
          onChange={(e) => setSearchTerm(e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="mobile">Mobile</option>
          <option value="electronics">Electronics</option>
          <option value="watch">Watch</option>
          <option value="sandals">Sandals</option>
        </select>
      </div>

      {loading && (
        <div className="text-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      {!loading && (
        filteredProducts.length === 0 ? (
          <p>No products match your search.</p>
        ) : (
          <div className='row row-cols-1 row-cols-md-3 g-4 mt-3'>
            {filteredProducts.map((i) => (
              <div className="col" key={i._id}>
                <div className="card h-100">
                  <div className="card-body">
                    <h5 className="card-title"><b>Name:</b> {i.name}</h5>
                    <p className="card-text"><b>Price:</b> ₹{i.price}</p>
                    <p className="card-text"><b>Category:</b> {i.category}</p>
                    <p className="card-text"><b>Description:</b> {i.description}</p>
                    <p className="card-text">
                      <b>Stock:</b>{" "}
                      <span style={{ color: i.stock > 0 ? 'green' : 'red' }}>
                        {i.stock > 0 ? `${i.stock} available` : 'Out of Stock'}
                      </span>
                    </p>
                    {role === "admin" ? (
                      <button onClick={() => deleteProduct(i._id)} className='btn btn-danger'>
                        Delete
                      </button>
                    ) : (
                      <button onClick={() => addToCart(i._id)} className='btn btn-warning text-white'>
                        <FaShoppingCart className="me-2" /> Add to Cart
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
