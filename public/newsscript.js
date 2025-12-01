// News data array with all news articles
const newsData = [
  {
    id: 1,
    title: "Massive eSports Tournament Announced",
    description: "The biggest eSports event of the year is coming with a record-breaking prize pool of $50 million. Teams from around the world will compete in multiple game titles.",
    time: "2 hours ago",
    category: "Gaming News",
    image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400",
    featured: true
  },
  {
    id: 2,
    title: "New Gaming Gear Released",
    description: "Latest gaming peripherals hit the market with revolutionary features for competitive players.",
    time: "4 hours ago",
    category: "Hardware",
    image: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=400"
  },
  {
    id: 3,
    title: "Epic Comeback in Finals",
    description: "Incredible comeback victory in the championship finals leaves fans speechless.",
    time: "6 hours ago",
    category: "Tournament Results",
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400"
  },
  {
    id: 4,
    title: "Developer Updates Announced",
    description: "Key announcements from leading game developers about upcoming features and balance changes.",
    time: "8 hours ago",
    category: "Game Updates",
    image: "https://images.unsplash.com/photo-1560419015-7c427e8ae5ba?w=400"
  },
  {
    id: 5,
    title: "Pro Player Transfers Shake Up League",
    description: "Major roster changes as top players move to new teams for the upcoming season.",
    time: "12 hours ago",
    category: "Team News",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400"
  },
  {
    id: 6,
    title: "Record Viewership Breaks Records",
    description: "Latest tournament stream breaks all previous viewership records with millions of concurrent viewers.",
    time: "1 day ago",
    category: "Streaming",
    image: "https://images.unsplash.com/photo-1534423861386-85a16f5d13fd?w=400"
  }
];

// Store news in localStorage for other pages to access
localStorage.setItem('allNews', JSON.stringify(newsData));

// Load and display all news on page load
document.addEventListener('DOMContentLoaded', () => {
  loadNews();
});

// Function to load and display news articles
function loadNews() {
  const newsGrid = document.getElementById('newsGrid');
  
  if (!newsGrid) {
    console.error('News grid container not found');
    return;
  }

  // Clear existing content
  newsGrid.innerHTML = '';

  // Display all news articles
  newsData.forEach(news => {
    const newsCard = createNewsCard(news);
    newsGrid.appendChild(newsCard);
  });
}

// Function to create a news card element
function createNewsCard(news) {
  const card = document.createElement('div');
  card.className = 'news-card';
  card.onclick = () => openNewsDetail(news);

  card.innerHTML = `
    <div class="news-image">
      <img src="${news.image}" alt="${news.title}" />
      <span class="news-category">${news.category}</span>
    </div>
    <div class="news-content">
      <h3 class="news-title">${news.title}</h3>
      <p class="news-description">${news.description}</p>
      <div class="news-meta">
        <span class="news-time">${news.time}</span>
        <span class="read-more">Read More →</span>
      </div>
    </div>
  `;

  return card;
}

// Function to open news detail (can be expanded later)
function openNewsDetail(news) {
  // For now, show an alert. You can create a modal or detail page later
  alert(`Opening: ${news.title}\n\n${news.description}`);
  
  // Store selected news for potential detail page
  localStorage.setItem('selectedNews', JSON.stringify(news));
  
  // Uncomment below if you create a news detail page
  // window.location.href = `news-detail.html?id=${news.id}`;
}

// Optional: Filter news by category
function filterNewsByCategory(category) {
  const newsGrid = document.getElementById('newsGrid');
  newsGrid.innerHTML = '';

  const filtered = category === 'all' 
    ? newsData 
    : newsData.filter(news => news.category === category);

  filtered.forEach(news => {
    const newsCard = createNewsCard(news);
    newsGrid.appendChild(newsCard);
  });
}

// Optional: Search news
function searchNews(searchTerm) {
  const newsGrid = document.getElementById('newsGrid');
  newsGrid.innerHTML = '';

  const results = newsData.filter(news => 
    news.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    news.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (results.length === 0) {
    newsGrid.innerHTML = '<p class="no-results">No news articles found.</p>';
    return;
  }

  results.forEach(news => {
    const newsCard = createNewsCard(news);
    newsGrid.appendChild(newsCard);
  });
}
