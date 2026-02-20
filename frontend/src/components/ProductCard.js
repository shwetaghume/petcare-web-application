import React, { memo, useState, useCallback } from 'react';

const ProductCard = memo(({ product, onQuickView, petTypes }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoaded(true);
  }, []);

  const handleQuickView = useCallback(() => {
    onQuickView(product);
  }, [product, onQuickView]);

  const defaultImage = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=60';
  const petTypeName = petTypes.find(type => type.id === product.petType)?.name;

  return (
    <div className="product-card">
      <div 
        className="product-image-container"
        onClick={handleQuickView}
      >
        <div className={`image-placeholder ${imageLoaded ? 'loaded' : ''}`}>
          {!imageLoaded && <div className="loading-shimmer"></div>}
          <img 
            src={imageError ? defaultImage : product.image} 
            alt={product.name} 
            className="product-image"
            loading="lazy"
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{ opacity: imageLoaded ? 1 : 0 }}
          />
        </div>
      </div>
      <div className="product-info">
        <h3 onClick={handleQuickView}>{product.name}</h3>
        <p>{product.description}</p>
        <p className="product-price">₹{product.price}</p>
        <p className="pet-type">For: {petTypeName}</p>
        {product.requiresPrescription && (
          <span className="prescription-badge">Requires Prescription</span>
        )}
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;

