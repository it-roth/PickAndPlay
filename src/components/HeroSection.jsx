import React, { useEffect, useContext } from 'react';
import '../assets/styles/hero-section.css';
import { Link } from 'react-router-dom';
// Don't import Bootstrap's JS Carousel here; rely on Bootstrap's data-api (markup) to initialize if needed.
import { LocaleContext } from '../contexts/LocaleContext';

function HeroSection() {
  const { t } = useContext(LocaleContext);

  const carouselItems = [
    {
      image: 'https://images.unsplash.com/photo-1525201548942-d8732f6617a0',
      title: t('hero1_title'),
      description: t('hero1_description'),
      link: '/shop',
      showCaption: true,
    },
    {
      image: 'https://images.unsplash.com/photo-1556449895-a33c9dba33dd',
      title: t('hero2_title'),
      description: t('hero2_description'),
      link: '/shop',
      showCaption: true,
    },
    {
      image: 'https://images.unsplash.com/photo-1516924962500-2b4b3b99ea02',
      title: t('hero3_title'),
      description: t('hero3_description'),
      link: '/shop',
      showCaption: true,
    },
  ];

  useEffect(() => {
    // Only need navbar sizing logic here. Avoid manual bootstrap carousel initialization
    // because Bootstrap's data-api may already initialize it and manual calls in SPA
    // lifecycle can cause Illegal invocation errors.

    function setNavbarVar() {
      try {
        const nav = document.getElementById('main-navbar-nav') || document.querySelector('.main-navbar') || document.querySelector('.navbar-wrapper');
        const height = nav ? nav.getBoundingClientRect().height : 100;
        document.documentElement.style.setProperty('--navbar-height', `${Math.ceil(height)}px`);
      } catch (e) {}
    }

    setNavbarVar();
    window.addEventListener('resize', setNavbarVar);
    const id = setInterval(setNavbarVar, 1500);

    return () => {
      window.removeEventListener('resize', setNavbarVar);
      clearInterval(id);
    };
  }, [t]);

  return (
    <section className="hero-section position-relative">
      <div id="heroCarousel" className="carousel slide carousel-fade hero-carousel" data-bs-ride="carousel">
        <div className="carousel-inner">
          {carouselItems.map((item, index) => (
            <div className={`carousel-item ${index === 0 ? 'active' : ''} ${item.showCaption ? '' : 'no-caption'}`} key={index}>
              <div className="hero-image-container">
                <img className="d-block w-100 hero-image" src={item.image} alt={item.title} style={{ height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
              </div>
              <div className="carousel-caption hero-caption">
                <div className="hero-content">
                  <h1 className={`hero-title ${item.title === 'Special Offers' ? 'hero-title--special' : ''}`}>{item.title}</h1>
                  <p className={`hero-description ${item.title === 'Special Offers' ? 'hero-description--special' : ''}`}>{item.description}</p>
                  <Link to={item.link} className={`hero-cta-btn btn btn-dark shop-now-btn shop-now-btn-custom ${item.title === 'Special Offers' ? 'hero-cta-btn--special' : ''}`}>{t('shopNow')}</Link>
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
  );
}

export default HeroSection;
