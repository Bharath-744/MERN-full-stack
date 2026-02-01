import { Link, useNavigate } from "react-router-dom"
import { useState } from "react"
import {
  FaHome,
  FaShoppingCart,
  FaSignOutAlt,
  FaSignInAlt,
  FaUserPlus,
  FaBoxOpen
} from "react-icons/fa"

export default function Navigation() {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)

  const userId = localStorage.getItem("userId")
  const userRole = localStorage.getItem("role")
  const cartCount = localStorage.getItem("cartCount") || 0

  const closeNavbar = () => setIsOpen(false)

  const handleLogout = () => {
    localStorage.clear()
    closeNavbar()
    navigate("/login")
  }

  return (
    <nav className="navbar navbar-dark bg-primary navbar-expand-lg">
      <div className="container">
        <Link className="navbar-brand" to="/" onClick={closeNavbar}>
          MyApp
        </Link>

        {/* Toggle button */}
        <button
          className="navbar-toggler"
          type="button"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Collapsible menu */}
        <div className={`collapse navbar-collapse ${isOpen ? "show" : ""}`}>
          <ul className="navbar-nav ms-auto">

            <li className="nav-item">
              <Link className="nav-link" to="/" onClick={closeNavbar}>
                <FaHome className="me-1" /> Home
              </Link>
            </li>

            {userId ? (
              userRole === "admin" ? (
                <>
                  <li className="nav-item">
                    <Link className="nav-link" to="/add-product" onClick={closeNavbar}>
                      <FaBoxOpen className="me-1" /> Add Product
                    </Link>
                  </li>

                  <li className="nav-item">
                    <button className="nav-link btn btn-link text-white" onClick={handleLogout}>
                      <FaSignOutAlt className="me-1" /> Logout
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <Link className="nav-link" to="/cart" onClick={closeNavbar}>
                      <FaShoppingCart className="me-1" /> Cart
                      {cartCount > 0 && (
                        <span className="badge bg-warning ms-1">{cartCount}</span>
                      )}
                    </Link>
                  </li>

                  <li className="nav-item">
                    <button className="nav-link btn btn-link text-white" onClick={handleLogout}>
                      <FaSignOutAlt className="me-1" /> Logout
                    </button>
                  </li>
                </>
              )
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/login" onClick={closeNavbar}>
                    <FaSignInAlt className="me-1" /> Login
                  </Link>
                </li>

                <li className="nav-item">
                  <Link className="nav-link" to="/register" onClick={closeNavbar}>
                    <FaUserPlus className="me-1" /> Register
                  </Link>
                </li>
              </>
            )}

          </ul>
        </div>
      </div>
    </nav>
  )
}