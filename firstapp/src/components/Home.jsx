import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

export default function Home() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const role = localStorage.getItem("role")
  const navigate = useNavigate()

  useEffect(() => {
    fetchProducts()
  }, [])

  function addToCart(productId) {
    const userId = localStorage.getItem("userId")
    if (!userId) {
      alert("Login first to access the products")
      return
    }

    axios.post("http://localhost:4000/api/cart/add",
      { productId, quantity: 1 },
      { params: { userId } }
    )
      .then(res => {
        if (res.status === 200) {
          toast.success("Product added to cart!")
          navigate("/cart")
        } else {
          alert(res.data.message)
        }
      })
      .catch(err => {
        console.error("Error adding to cart:", err)
        toast.error("Failed to add product to cart")
      })
  }

  async function fetchProducts() {
    try {
      const res = await axios.get("http://localhost:4000/api/product")
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

  const filteredProducts = products.filter(i =>
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className='container mt-4'>
      <ToastContainer />
      <h2>Products</h2>
      <input
        type="text"
        className="form-control mb-3"
        placeholder="Search by name or category..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {
        loading ? (<p>Loading...</p>) : (
          filteredProducts.length === 0 ? (
            <p>No products match your search.</p>
          ) : (
            <div className='row row-cols-1 row-cols-md-3 g-4 mt-3'>
              {
                filteredProducts.map((i) => (
                  <div className="col" key={i._id}>
                    <div className="card h-100">
                      <div className="card-body">
                        <h5 className="card-title"><b>Name:</b> {i.name}</h5>
                        <p className="card-text"><b>Price:</b> ₹{i.price}</p>
                        <p className="card-text"><b>Category:</b> {i.category}</p>
                        <p className="card-text"><b>Description:</b> {i.description}</p>
                        <p className="card-text">
                          <b>Stock:</b> <span style={{ color: i.stock > 0 ? 'green' : 'red' }}>
                            {i.stock > 0 ? `${i.stock} available` : 'Out of Stock'}
                          </span>
                        </p>
                        <p className="card-text"><b>Rating:</b> ⭐⭐⭐⭐☆</p>
                        {
                          role === "admin" ? (
                            <button onClick={() => deleteProduct(i._id)} className='btn btn-danger'>Delete</button>
                          ) : (
                            <button onClick={() => addToCart(i._id)} className='btn btn-warning text-white'>Add to Cart</button>
                          )
                        }
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          )
        )
      }
    </div>
  )
}
