import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { LocaleContext } from '../contexts/LocaleContext';
import HeroSection from '../components/HeroSection';
import blackFriday from '../assets/images/black Friddays.jpg';
import shipping from '../assets/images/shipping Guitar banner.png';
import ProductCard from '../components/ProductCard';
import { productService } from '../lib/api';
import '../assets/styles/home.css';

function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productService.getAllProducts();
        const products = response.data;

        // For Featured: pick up to one product per category in the desired order
        const desiredCategories = ['Acoustic', 'Electric', 'Classical', 'Bass'];
        const featured = [];
        desiredCategories.forEach((cat) => {
          const found = products.find(p => {
            if (!p || !p.category) return false;
            return String(p.category).toLowerCase() === cat.toLowerCase();
          });
          if (found) featured.push(found);
        });
        // Fallback: if none found for a category we simply skip it (keeps featured list <= 4)
        setFeaturedProducts(featured);
        // Get the last 8 products and display most recent first
        const lastEight = products.slice(-8) || [];
        setNewArrivals(lastEight.slice().reverse());
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching products:', error);
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);


  const { t } = useContext(LocaleContext);

  return (
    <div className="modern-home">

      {/* Hero Section (extracted to component) */}
      <HeroSection />

      {/* Categories Section */}
      <section className="categories-section mt-5 pt-5">
        <div className="container">
          <div className="section-header text-center mb-5">
            <h2 className="section-title">{t('categories_title')}</h2>
            <p className="section-subtitle">{t('categories_subtitle')}</p>
            <div className="section-divider"></div>
          </div>
          <div className="row g-4">
            {['Acoustic', 'Electric', 'Classical', 'Bass'].map((category, index) => (
              <div className="col-lg-3 col-md-6" key={index}>
                <div className="card category-card h-100 border-0 shadow-sm">
                  <div className="card-body text-center p-4">
                    <h3 className="category-title">{category} </h3>
                     <p className="category-description text-muted mb-4">
                      {t(`category_${category.toLowerCase()}_desc`)}
                    </p>
                    <Link to={`/categories/${category.toLowerCase()}`} className="category-btn">
                      Browse {category}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="featured-section py-5 bg-gradient">
        <div className="container">
          <div className="section-header text-center mb-5">
            <h2 className="section-title">{t('featured_title')}</h2>
            <p className="section-subtitle">{t('featured_subtitle')}</p>
            <div className="section-divider"></div>
          </div>
          {isLoading ? (
            <div className="loading-container text-center py-5">
              <div className="spinner-border text-light" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-white mt-3">{t('loading_products')}</p>
            </div>
          ) : (
            <div className="row g-4">
              {featuredProducts.length > 0 ? (
                featuredProducts.map((product, index) => (
                  <div className="col-6 col-md-6 col-lg-3 mb-4" key={product.id} style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="product-card-wrapper">
                      <ProductCard product={product} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-12">
                  <div className="no-products text-center py-5">
                    <i className="fas fa-guitar fa-3x text-white-50 mb-3"></i>
                    <p className="text-white">No featured products available at the moment.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/*  Shipping banner with Background Section */}
      <section className="shipping-banner-section py-4">
        <div className="container">
          <div className="shipping-banner p-0 d-flex align-items-stretch">
            <div className="shipping-banner-image-left">
              <img src={blackFriday} alt="Black Friday left" className="img-fluid" />
              <div className="overlay-cta overlay-cta-left d-flex justify-content-center align-items-center">
                <Link to="/shop" className="btn btn-dark shop-now-btn shop-now-btn-custom">
                  Shop Now
                </Link>
              </div>
            </div>
            <div className="shipping-banner-image-right position-relative">
              <img src={shipping} alt="Black Friday right" className="img-fluid" />
              <div className="overlay-cta overlay-cta-right d-flex justify-content-center align-items-center">
                <Link to="/shop?deals=1" className="btn btn-dark shop-now-btn shop-now-btn-custom">
                  View Deals
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* New Arrivals Section */}
      <section className="new-arrivals-section py-5">
        <div className="container">
          <div className="section-header text-center mb-5">
            <h2 className="section-title">{t('new_title')}</h2>
            <p className="section-subtitle">{t('new_subtitle')}</p>
            <div className="section-divider"></div>
          </div>
          {isLoading ? (
            <div className="loading-container text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted mt-3">{t('discovering_new')}</p>
            </div>
          ) : (
            <div className="row g-4">
              {newArrivals.length > 0 ? (
                newArrivals.map((product, index) => (
                  <div className="col-6 col-md-6 col-lg-3 mb-4" key={product.id} style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="product-card-wrapper">
                      <ProductCard product={product} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-12">
                  <div className="no-products text-center py-5">
                    <i className="fas fa-plus-circle fa-3x text-muted mb-3"></i>
                    <p className="text-muted">No new arrivals available at the moment.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Home;