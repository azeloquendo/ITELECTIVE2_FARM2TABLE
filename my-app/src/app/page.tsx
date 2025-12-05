'use client';
import LoadingSpinner from "@/components/atoms/LoadingSpinner";
import { useContactForm } from "@/hooks/useContactForm";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { db } from "../utils/lib/firebase";
import styles from "./page.module.css";

// Unified Product interface
interface Product {
  id: string;
  name: string;
  image: string;
  location: string;
  farmName: string;
  price: string;
  unit: string;
  sold: number;
  description: string;
  rating: number;
  reviews: number;
  stock: number;
  deliveryFee?: number;
  deliveryTime?: string;
}

interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

function Navbar() {
  return (
    <nav className={styles.navbar}>
      <Link href="/" className={styles.logo}>
        <Image src="/Farm2Table_Logo.png" alt="Farm2Table Logo" width={120} height={60} />
      </Link>
      <div className={styles.navLinks}>
        <a href="#home" className={styles.navLink}>Home</a>
        <a href="#farmers" className={styles.navLink}>Farmers</a>
        <a href="#products" className={styles.navLink}>Products</a>
        <a href="#benefits" className={styles.navLink}>Benefits</a>
        <a href="#contact" className={styles.navLink}>Contacts</a>
      </div>
    </nav>
  );
}

function ContactForm() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    message: ''
  });

  const { isSubmitting, submitSuccess, error, submitForm } = useContactForm({
    endpoint: '/api/contact',
    onSuccess: () => {
      setFormData({ name: '', email: '', message: '' });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await submitForm({
        ...formData,
        type: 'landing_page_contact',
        source: 'landing_page'
      });
    } catch (err) {
      // Error is already handled in the hook
      console.error('Submission error:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <form className={styles.contactForm} onSubmit={handleSubmit}>
      {submitSuccess && (
        <div className={styles.successMessage}>
          <strong>Message Sent Successfully!</strong>
          <p>We'll get back to you within 24 hours. Thank you for contacting Farm2Table!</p>
        </div>
      )}
      
      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}
      
      <div className={styles.formGroup}>
        <label htmlFor="name">Your Name *</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          disabled={isSubmitting}
        />
      </div>
      
      <div className={styles.formGroup}>
        <label htmlFor="email">Your Email *</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          disabled={isSubmitting}
        />
      </div>
      
      <div className={styles.formGroup}>
        <label htmlFor="message">Your Message *</label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          required
          disabled={isSubmitting}
          rows={4}
        />
      </div>
      
      <button 
        type="submit" 
        className={styles.submitButton} 
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <LoadingSpinner />
            Sending...
          </>
        ) : (
          'Submit Now'
        )}
      </button>
    </form>
  );
}

// Simple Product Card Component without cart functionality
function ProductCard({ product }: { product: Product }) {
  return (
    <div className={styles.productCard}>
      <div className={styles.productImage}>
        <Image
          src={product.image}
          alt={product.name}
          width={200}
          height={150}
          style={{ objectFit: 'cover' }}
        />
        <div className={styles.newTag}>NEW</div>
      </div>
      
      <div className={styles.productInfo}>
        <h3 className={styles.productName}>{product.name}</h3>
        <p className={styles.farmName}>from {product.farmName}</p>
        <p className={styles.location}>{product.location}</p>
        
        <div className={styles.rating}>
          <span className={styles.stars}>⭐ {product.rating}</span>
          <span className={styles.reviews}>({product.reviews} reviews)</span>
        </div>
        
        <div className={styles.priceSection}>
          <span className={styles.price}>₱{product.price}</span>
          <span className={styles.unit}>/{product.unit}</span>
        </div>
        
        <div className={styles.deliveryInfo}>
          <span className={styles.deliveryFee}>Delivery: ₱{product.deliveryFee}</span>
          <span className={styles.deliveryTime}>• {product.deliveryTime}</span>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch fresh arrivals from Firebase
  const fetchFreshArrivals = async () => {
    try {
      setLoading(true);
      
      const productsRef = collection(db, "products");
      const q = query(
        productsRef,
        where("isActive", "==", true),
        orderBy("createdAt", "desc"),
        limit(3) // Get only 3 latest products
      );
      
      const snapshot = await getDocs(q);
      
      const productsData = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const productData = doc.data();
          const productId = doc.id;
          
          // Fetch reviews to calculate real ratings
          const reviewsQuery = query(
            collection(db, "reviews"),
            where("productId", "==", productId),
            where("isActive", "==", true)
          );
          
          const reviewsSnapshot = await getDocs(reviewsQuery);
          const reviewsData = reviewsSnapshot.docs.map(reviewDoc => ({
            id: reviewDoc.id,
            ...reviewDoc.data()
          }));
          
          // Calculate average rating
          const averageRating = reviewsData.length > 0 
            ? reviewsData.reduce((sum, review) => sum + (review.rating || 0), 0) / reviewsData.length
            : 0;

          // Format for ProductCard component
          return {
            id: productId,
            name: productData.name || "",
            image: productData.imageUrls?.[0] || "/placeholder-product.jpg",
            location: productData.location || "",
            farmName: productData.farmName || "",
            price: (productData.price || 0).toString(),
            unit: productData.unit || "",
            sold: productData.sold || 0,
            description: productData.description || "Fresh produce from local farms",
            rating: parseFloat(averageRating.toFixed(1)),
            reviews: reviewsData.length,
            stock: productData.stock || 0,
            deliveryFee: Math.floor(Math.random() * 50) + 15,
            deliveryTime: `${Math.floor(Math.random() * 30) + 15}-${Math.floor(Math.random() * 30) + 45} min`
          } as Product;
        })
      );
      
      console.log("🔄 Fresh arrivals loaded:", productsData.length, "products");
      setProducts(productsData);
      setError("");
      
    } catch (error: any) {
      console.error("Error fetching fresh arrivals:", error);
      setError("Failed to load fresh products. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFreshArrivals();
  }, []);

  return (
    <>
      <Navbar/>
      <main>
        <section id="home" className={styles.heroSection}>
          <div className={styles.heroContent}>
            <h1>Farm<span className={styles.highlight}>2</span>Table</h1>
            <h2>From Local Farms to Your Table</h2>
            <p>Discover the true taste of freshness while supporting hardworking local farmers. Farm2Table connects you directly to the source — making every meal healthier, every purchase impactful, and every choice sustainable.</p>
            <Link href="/roleSelection" className={styles.ctaButton}>Shop Products</Link>
          </div>
        </section>

        <section id="farmers" className={styles.farmersSection}>
          <h2>Meet Your Local Farmers</h2>
          <p className={styles.farmersIntro}>
            In the Philippines, millions of smallholder farmers work tirelessly to grow the food that sustains our communities. From the fertile fields of Benguet to the mango orchards of Zambales, these farmers are the heart of our food system. Farm2Table gives you a direct connection to their harvests, ensuring fair support for their livelihoods while bringing fresh, local, and sustainable produce straight to your plate.
          </p>

          <div className={styles.farmersGrid}>
            {/* Farmer 1 */}
            <div className={styles.farmerCard}>
              <div className={styles.farmerImage}>
                <Image
                  src="/images/landingPage/farmer1.jpg"
                  alt="Maria Guadalupe"
                  width={300}
                  height={200}
                  style={{ objectFit: 'cover' }}
                />
              </div>
              
              <div className={styles.farmerInfo}>
                <div className={styles.location}>SAN MARCELINO, ZAMBALES</div>
                  <h3 className={styles.farmerName}>Maria Guadalupe</h3>
                  <p className={styles.farmerBio}>
                    Maria has been cultivating carabao mangoes for over 15 years. She practices natural farming techniques – avoiding chemical pesticides and relying on composting to enrich her soil.
                  </p>
              </div>
            </div>

            {/* Farmer 2 */}
            <div className={styles.farmerCard}>
              <div className={styles.farmerImage}>
                <Image
                  src="/images/landingPage/farmer2.jpg"
                  alt="Jose Ramirez"
                  width={300}
                  height={200}
                  style={{ objectFit: 'cover' }}
                />
              </div>
      
              <div className={styles.farmerInfo}>
                <div className={styles.location}>BENGUET HIGHLANDS, LA TRINIDAD</div>
                  <h3 className={styles.farmerName}>Jose Ramirez</h3>
                  <p className={styles.farmerBio}>
                    Jose grows highland vegetables such as lettuce, cabbage, and carrots using water-efficient irrigation and minimal pesticide application. He works with neighboring farmers to deliver fresh harvests daily to communities in Baguio and nearby towns.
                  </p>
              </div>
            </div>

            {/* Farmer 3 */}
            <div className={styles.farmerCard}>
              <div className={styles.farmerImage}>
                <Image
                  src="/images/landingPage/farmer3.jpg"
                  alt="Juanito Funsidad"
                  width={300}
                  height={200}
                  style={{ objectFit: 'cover' }}
                />
              </div>
      
              <div className={styles.farmerInfo}>
                <div className={styles.location}>TARLAC, CENTRAL LUZON</div>
                  <h3 className={styles.farmerName}>Juanito Funsidad</h3>
                  <p className={styles.farmerBio}>
                    Juanito raises free-range chickens in open pastures, ensuring they live naturally and produce healthier, more nutritious eggs. His farm also grows corn and small grains, which he uses as natural feed for his poultry.
                  </p>
              </div>
            </div>
          </div>
        </section>

        {/* Products Section */}
        <section id="products" className={styles.productSection}>
          <div className={styles.sectionHeader}>
            <h2>Fresh & Seasonal Produce</h2>
            <p className={styles.sectionSubtitle}>Shop from the best of today's harvest — straight from our local farmers.</p>
          </div>

          {loading ? (
            <div className={styles.loadingState}>
              <LoadingSpinner />
              <p>Loading fresh products from our farms...</p>
            </div>
          ) : error ? (
            <div className={styles.errorState}>
              <p>{error}</p>
              <button 
                onClick={fetchFreshArrivals} 
                className={styles.retryButton}
              >
                Try Again
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No fresh products available at the moment.</p>
              <p className={styles.emptySubtext}>Check back later for new arrivals!</p>
            </div>
          ) : (
            <div className={styles.productsGrid}>
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>
          )}
        </section>

        <section id="benefits" className={styles.benefitsSection}>
          <div className={styles.benefitBlock}>
            <div className={styles.text}>
              <h2>Why Choose Farm2Table?</h2>
              <p>At Farm2Table, we believe food should be more than just something you buy — it should be an experience that connects you to the land, the farmers, and the community around you. Our platform bridges the gap between local farmers and everyday consumers, making it simple, affordable, and sustainable to enjoy the freshest produce.</p>
              <p>When you order through Farm2Table, you're not just getting vegetables, fruits, or grains — you're supporting a fair system where farmers earn what they truly deserve, consumers get high-quality and chemical-free produce, and the environment benefits from lower carbon emissions.</p>
              <p>By choosing our services, you join a movement:</p>
              <ul>
                <li>A movement that values healthy, fresh, and nutritious food over mass-produced alternatives.</li>
                <li>A movement that uplifts small local farmers, giving them visibility and fair income.</li>
                <li>A movement that promotes eco-conscious living, reducing waste and transport pollution.</li>
              </ul>
              <p>Farm2Table is more than a marketplace — it's your way of eating better, living healthier, and making a positive impact every time you shop. Together, we can change the way food reaches our tables, one order at a time.</p>
              <div className={styles.benefitsContainer}>
                <div className={styles.benefitCard}>
                  <div className={styles.icon}>
                    <Image
                      src="/benefit1.jpg"
                      alt="Eco-Friendly"
                      width={180}
                      height={180}
                    />
                  </div>
                  <h2>Eco-Friendly</h2>
                  <p>Farm2Table shortens the journey from farm to your plate. With fewer transport miles and eco-conscious packaging, every order helps cut carbon emissions and reduce waste — making your meals better for both you and the planet.</p>
                </div>
                <div className={styles.benefitCard}>
                  <div className={styles.icon}>
                    <Image
                      src="/benefit2.jpg"
                      alt="Support Local"
                      width={180}
                      height={180}
                    />
                  </div>
                  <h2>Support Local</h2>
                  <p>Every purchase directly empowers local farmers and their families. By choosing Farm2Table, you're not just buying food — you're strengthening small communities, creating opportunities, and preserving traditional farming practices for future generations.</p>
                </div>
                <div className={styles.benefitCard}>
                  <div className={styles.icon}>
                    <Image
                      src="/benefit3.jpg"
                      alt="Fresh & Healthy"
                      width={180}
                      height={180}
                    />
                  </div>
                  <h2>Fresh & Healthy</h2>
                  <p>Our products are harvested at their peak and delivered straight from the source. No long storage, no hidden chemicals — just naturally fresh, nutrient-rich produce that fuels a healthier lifestyle.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className={styles.contactSection}>
          {/* Top Container */}
          <div className={styles.browseTop}>
            {/* Left Side */}
            <div className={styles.browseImage}>
              <Image
                src="/browse.jpg"
                alt="Landscape of farm fields in the Philippines"
                width={500}
                height={400}
              />
            </div>
            {/* Right Side */}
            <div className={styles.browseInfo}>
              <h3>What makes ordering with us different?</h3>
              <ul>
                <li><strong>Straight from the source</strong> – No middlemen, no hidden costs. Every peso supports hardworking farmers in your community.</li>
                <li><strong>Freshly harvested</strong> – Produce is picked at its peak and delivered quickly, so you taste the difference in every bite.</li>
                <li><strong>Pre-book your favorites</strong> – Secure seasonal items before they sell out — from sweet corn to vibrant chilis.</li>
                <li><strong>Eco-smart choices</strong> – Every order helps reduce long-distance transport and lowers carbon emissions.</li>
              </ul>
              <p>With just a few taps, you're not only filling your kitchen with healthy, chemical-free food — you're also making a difference in the lives of local growers and the planet.</p>
              <Link href="/roleSelection" className={styles.browseButton}>Browse Produce Now</Link>
            </div>
          </div>
          {/* Bottom Container */}
          <div className={styles.contactBottom}>
            <h3>Send a Message</h3>
            <ContactForm />
          </div>
        </section>

        <footer className={styles.footer}>
          <p>&copy; 2025 Farm2Table. All rights reserved.</p>
        </footer>
      </main>
    </>
  );
}