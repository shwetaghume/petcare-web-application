import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import BackButton from './BackButton';
import useDebounce from '../hooks/useDebounce';
import './Pets.css';

const CategoryCard = memo(({ category, selectedCategory, onCategorySelect }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const handleClick = useCallback(() => {
    onCategorySelect(category.id);
  }, [category.id, onCategorySelect]);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  return (
    <div 
      className={`category-card ${selectedCategory === category.id ? 'active' : ''}`}
      onClick={handleClick}
    >
      <div className="category-image">
        <div className={`image-placeholder ${imageLoaded ? 'loaded' : ''}`}>
          {!imageLoaded && <div className="loading-shimmer"></div>}
          <img 
            src={category.image} 
            alt={category.name}
            loading="lazy"
            onLoad={handleImageLoad}
            style={{ opacity: imageLoaded ? 1 : 0 }}
          />
        </div>
        <div className="category-overlay">
          <span className="category-icon">{category.icon}</span>
        </div>
      </div>
      <div className="category-info">
        <h3>{category.name}</h3>
        <p>{category.count} available</p>
      </div>
    </div>
  );
});

CategoryCard.displayName = 'CategoryCard';

const Pets = memo(() => {
  const { category } = useParams();
  const navigate = useNavigate();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Fetch pets from the backend
  useEffect(() => {
    const fetchPets = async () => {
      try {
        setLoading(true);
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
        const response = await axios.get(`${apiUrl}/api/pets${category ? `?category=${category}` : ''}`);
        setPets(response.data);
      } catch (err) {
        console.error('Error fetching pets:', err);
        setError('Failed to load pets. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPets();
  }, [category]);

  const categories = useMemo(() => {
    const categoryCounts = {
      'Dog': pets.filter(pet => pet.category === 'Dog').length,
      'Cat': pets.filter(pet => pet.category === 'Cat').length,
      'Bird': pets.filter(pet => pet.category === 'Bird').length,
      'Fish': pets.filter(pet => pet.category === 'Fish').length,
      'Small Animal': pets.filter(pet => pet.category === 'Small Animal').length
    };
    
    return [
      { 
        id: 'all', 
        name: 'All Pets', 
        icon: '🐾',
        image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=300&auto=format&fit=crop&q=60',
        count: pets.length
      },
      { 
        id: 'Dog', 
        name: 'Dogs', 
        icon: '🐕',
        image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=300&auto=format&fit=crop&q=60',
        count: categoryCounts['Dog']
      },
      { 
        id: 'Cat', 
        name: 'Cats', 
        icon: '🐱',
        image: 'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=300&auto=format&fit=crop&q=60',
        count: categoryCounts['Cat']
      },
      { 
        id: 'Bird', 
        name: 'Birds', 
        icon: '🦜',
        image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&auto=format&fit=crop&q=60',
        count: categoryCounts['Bird']
      },
      { 
        id: 'Fish', 
        name: 'Fish', 
        icon: '🐠',
        image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=300&auto=format&fit=crop&q=60',
        count: categoryCounts['Fish']
      },
      { 
        id: 'Small Animal', 
        name: 'Small Animals', 
        icon: '🐹',
        image: 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=300&auto=format&fit=crop&q=60',
        count: categoryCounts['Small Animal']
      }
    ];
  }, [pets]);

  const filteredAndSortedPets = useMemo(() => {
    let filtered = pets;

    // Filter by search query
    if (debouncedSearchQuery) {
      filtered = pets.filter(pet => 
        pet.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        pet.breed.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        pet.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );
    }

    // Sort pets
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'age-asc':
          return a.age - b.age;
        case 'age-desc':
          return b.age - a.age;
        default:
          return 0;
      }
    });

    return sorted;
  }, [pets, debouncedSearchQuery, sortBy]);

  useEffect(() => {
    setSelectedCategory(category || 'all');
  }, [category]);

  const handleCategorySelect = useCallback((categoryId) => {
    setSelectedCategory(categoryId);
    if (categoryId === 'all') {
      navigate('/pets');
    } else {
      navigate(`/pets/${categoryId.toLowerCase()}`);
    }
  }, [navigate]);

  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleSortChange = useCallback((e) => {
    setSortBy(e.target.value);
  }, []);

  if (loading) {
    return (
      <div className="pets-container">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading pets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pets-container">
        <BackButton />
        <div className="error-message">{error}</div>
        <button onClick={() => {
          setError(''); // Clear error on retry
          // Re-fetch pets with the current category
          const fetchPets = async () => {
            try {
              setLoading(true);
              const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
              const response = await axios.get(`${apiUrl}/api/pets${category ? `?category=${category}` : ''}`);
              setPets(response.data);
            } catch (err) {
              console.error('Error fetching pets:', err);
              setError('Failed to load pets. Please try again later.');
            } finally {
              setLoading(false);
            }
          };
          fetchPets();
        }} className="retry-btn">Try Again</button>
      </div>
    );
  }

  const PetCard = ({ pet }) => (
    <div className="pet-card">
      <img src={pet.image} alt={pet.name} />
      <div className="pet-info">
        <h3>{pet.name}</h3>
        <p>{pet.breed} • {pet.age} years • {pet.gender}</p>
        <p>{pet.description?.slice(0, 60)}...</p>
        <div className="pet-actions">
          <Link to={`/pet/${pet._id}`} className="btn btn-secondary">View Details</Link>
          {!pet.isAdopted && (
            <Link to={`/adoption/${pet._id}`} className="btn btn-primary">Adopt Now</Link>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="pets-container">
      <BackButton />

      {/* Search and Filter Section */}
      <div className="pets-controls">
        <div className="search-section">
          <input
            type="text"
            placeholder="Search pets by name, breed, or description..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>
        <div className="sort-section">
          <select
            value={sortBy}
            onChange={handleSortChange}
            className="sort-select"
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="age-asc">Age (Young to Old)</option>
            <option value="age-desc">Age (Old to Young)</option>
          </select>
        </div>
      </div>

      {/* Category Selection */}
      <div className="categories-section">
        <h2>Browse by Category</h2>
        <div className="categories-grid">
          {categories.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              selectedCategory={selectedCategory}
              onCategorySelect={handleCategorySelect}
            />
          ))}
        </div>
      </div>

      {/* Pets Listing */}
      <div className="pets-section">
        <div className="section-header">
          <h2>
            {selectedCategory === 'all' 
              ? 'All Available Pets' 
              : `Available ${categories.find(c => c.id === selectedCategory)?.name || selectedCategory}`
            }
          </h2>
          <p>{filteredAndSortedPets.length} pets found</p>
        </div>

        {filteredAndSortedPets.length === 0 ? (
          <div className="no-pets">
            <div className="no-pets-icon">🐾</div>
            <h3>No pets available</h3>
            <p>
              {searchQuery 
                ? `No pets match your search "${searchQuery}"`
                : 'No pets available in this category'
              }
            </p>
            <button 
              className="btn btn-primary"
              onClick={() => {
                setSearchQuery('');
                handleCategorySelect('all');
              }}
            >
              {searchQuery ? 'Clear Search' : 'View All Pets'}
            </button>
          </div>
        ) : (
          <div className="pets-grid">
            {filteredAndSortedPets.map((pet) => (
              <PetCard key={pet._id} pet={pet} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

Pets.displayName = 'Pets';

export default Pets;
