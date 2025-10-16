import { useState, useEffect } from 'react';
import { Carousel as BootstrapCarousel } from 'bootstrap';
import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { LocaleContext } from '../contexts/LocaleContext';
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

  // Initialize Bootstrap Carousel for the hero section so it works when rendered by React
  useEffect(() => {
    const el = document.getElementById('heroCarousel');
    if (!el) return undefined;

    const carousel = new BootstrapCarousel(el, {
      interval: 5000,
      pause: 'hover',
    });

    // Ensure it starts cycling
    try {
      carousel.cycle();
    } catch (err) {
      // ignore
    }

    return () => {
      try {
        carousel.dispose();
      } catch (err) {
        // ignore
      }
    };
  }, []);

  // Hero carousel items
  const { t } = useContext(LocaleContext);

  const carouselItems = [
    {
      image: 'https://images.unsplash.com/photo-1525201548942-d8732f6617a0',
      title: t('hero1_title'),
      description: t('hero1_description'),
      link: '/shop',
    },
    {
      image: 'https://images.unsplash.com/photo-1556449895-a33c9dba33dd',
      title: t('hero2_title'),
      description: t('hero2_description'),
      link: '/categories',
    },
    {
      image: 'https://images.unsplash.com/photo-1516924962500-2b4b3b99ea02',
      title: t('hero3_title'),
      description: t('hero3_description'),
      link: '/shop',
    },
  ];

  return (
    <div className="modern-home">

      {/* Hero Section with Gradient Overlay (native Bootstrap carousel markup) */}
      <section className="hero-section position-relative">
        <div id="heroCarousel" className="carousel slide carousel-fade hero-carousel" data-bs-ride="carousel">
          <div className="carousel-inner">
            {carouselItems.map((item, index) => (
              <div className={`carousel-item ${index === 0 ? 'active' : ''}`} key={index}>
                <div className="hero-image-container">
                  <img
                    className="d-block w-100 hero-image"
                    src={item.image}
                    alt={item.title}
                    style={{
                      height: '100vh',
                      objectFit: 'cover',
                      objectPosition: 'center'
                    }}
                  />
                </div>
                <div className="carousel-caption hero-caption">
                  <div className="hero-content">
                    <h1 className={`hero-title ${item.title === 'Special Offers' ? 'hero-title--special' : ''}`}>{item.title}</h1>
                    <p className={`hero-description ${item.title === 'Special Offers' ? 'hero-description--special' : ''}`}>{item.description}</p>
                    <Link to={item.link} className={`btn btn-dark shop-now-btn shop-now-btn-custom ${item.title === 'Special Offers' ? 'hero-cta-btn--special' : ''}`}>
                      {t('shopNow')}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="carousel-control-prev" type="button" data-bs-target="#heroCarousel" data-bs-slide="prev">
            <span className="carousel-control-prev-icon" aria-hidden="true"></span>
            <span className="visually-hidden">Previous</span>
          </button>
          <button className="carousel-control-next" type="button" data-bs-target="#heroCarousel" data-bs-slide="next">
            <span className="carousel-control-next-icon" aria-hidden="true"></span>
            <span className="visually-hidden">Next</span>
          </button>
        </div>
      </section>

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