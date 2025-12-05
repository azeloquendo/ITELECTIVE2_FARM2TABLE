"use client";
import { Edit, Filter, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { DeleteConfirmationModal, ProductCard, StockBadge } from "../../../components";
import CreateProductModal from "../../../components/organisms/auth/modals/CreateProductModal/CreateProductModal";
import CreateProductForm from "../../../components/organisms/CreateProductForm/CreateProductForm";
import UpdateProductForm from "../../../components/organisms/UpdateProductForm/UpdateProductForm";
import { useProductFilters, useSellerProducts } from "../../../hooks/seller";
import { deleteProduct } from "../../../services/seller";
import { useCategory } from "../../context/CategoryContext";
import styles from "./products.module.css";

// Updated Date filter dropdown component to match marketplace design
const DateFilterDropdown = ({ sortOrder, onDateSort }: { sortOrder: string, onDateSort: (sort: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={styles.dropdownButton}
      >
        <Filter size={16} />
        <span>Sort: {sortOrder === 'newest' ? 'Newest' : 'Oldest'}</span>
        <span className={`${styles.arrow} ${isOpen ? styles.arrowUp : styles.arrowDown}`}></span>
      </button>
      
      {isOpen && (
        <div className={styles.dropdownList}>
          <button
            onClick={() => {
              onDateSort("newest");
              setIsOpen(false);
            }}
            className={`${styles.dropdownItem} ${sortOrder === 'newest' ? styles.selected : ''}`}
          >
            Newest to Oldest
          </button>
          <button
            onClick={() => {
              onDateSort("oldest");
              setIsOpen(false);
            }}
            className={`${styles.dropdownItem} ${sortOrder === 'oldest' ? styles.selected : ''}`}
          >
            Oldest to Newest
          </button>
        </div>
      )}
    </div>
  );
};


export default function ProductsPage() {
    const { selectedCategory } = useCategory();
    const { products, loading, error, currentUser, refetch } = useSellerProducts();
    const [sortOrder, setSortOrder] = useState("newest");
    
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [createdProduct, setCreatedProduct] = useState<any>(null);
    const [updateProduct, setUpdateProduct] = useState<any>(null);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; product: any }>({ 
      isOpen: false, 
      product: null 
    });
    const [isDeleting, setIsDeleting] = useState(false);

    // Use hook for filtering and sorting
    const filteredAndSortedProducts = useProductFilters(products, selectedCategory, sortOrder);

    const handleDateSort = (sort: string) => {
        setSortOrder(sort);
    };

    const handleProductCreated = (product: any) => {
        setCreatedProduct(product);
        setShowCreateForm(false);
        refetch();
    };

    const handleUpdate = (updatedProduct: any) => {
        setUpdateProduct(null);
    };

    // ✅ FIXED: Enhanced modal handlers like marketplace
    const handleCloseCreateModal = () => {
        setShowCreateForm(false);
    };

    const handleCloseSuccessModal = () => {
        setCreatedProduct(null);
    };

    const handleViewProduct = (productId: string) => {
        console.log("View product:", productId);
        setCreatedProduct(null);
        // You can add navigation to product details here
    };

    const handleCreateAnother = () => {
        setCreatedProduct(null);
        setShowCreateForm(true); // Reopen create form
    };

    // 🟢 UPDATED: Enhanced delete functionality with modal
    const handleDeleteClick = (product: any) => {
        setDeleteModal({
            isOpen: true,
            product: product
        });
    };

    const handleConfirmDelete = async () => {
        if (!currentUser || !deleteModal.product) {
            return;
        }
        
        setIsDeleting(true);
        try {
            await deleteProduct(deleteModal.product.id);
            setDeleteModal({ isOpen: false, product: null });
            refetch();
        } catch (error: any) {
            console.error("❌ Error deleting product:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCloseDeleteModal = () => {
        if (!isDeleting) {
            setDeleteModal({ isOpen: false, product: null });
        }
    };

    if (loading) {
        return (
            <div className={styles.productsPage}>
                <div className={styles.loadingContainer}>
                    <div className={styles.loadingSpinner}></div>
                    <p>Loading your products...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.productsPage}>
            <div className={styles.productsContent}>
                {/* Controls - Create button and dropdown side by side on the right */}
                <div className={styles.controls}>
                    <div className={styles.controlsGroup}>
                        {/* ✅ FIXED: Create Product Button - Properly connected like marketplace */}
                        <button 
                            className={styles.createBtn} 
                            onClick={() => {
                                console.log("🔄 Opening create product modal");
                                setShowCreateForm(true);
                            }}
                        >
                            <Plus size={18} />
                            Create Product
                        </button>
                        
                        <DateFilterDropdown 
                            sortOrder={sortOrder} 
                            onDateSort={handleDateSort} 
                        />
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className={styles.errorBanner}>
                        {error}
                    </div>
                )}

                {/* Products Table */}
                <div className={styles.tableContainer}>
                  <table className={styles.productsTable}>
                    <thead>
                      <tr>
                        <th>Product Name</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Rating</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAndSortedProducts && filteredAndSortedProducts.length > 0 ? (
                        filteredAndSortedProducts.map(product => (
                          <tr key={product.id}>
                            <td>
                              <div className={styles.productInfo}>
                                <div className={styles.productImage}>
                                  <img 
                                    src={product.imageUrls?.[0] || product.image || '/images/placeholder.jpg'} 
                                    alt={product.name}
                                  />
                                </div>
                                <div className={styles.productDetails}>
                                  <strong>{product.name}</strong>
                                  <span>{product.description?.substring(0, 50)}...</span>
                                </div>
                              </div>
                            </td>
                            <td className={styles.category}>
                              {product.category || 'Uncategorized'}
                            </td>
                            <td className={styles.price}>
                              ₱{product.price || '0.00'}
                            </td>
                            <td className={styles.stock}>
                              {product.stock || 0}
                            </td>
                            <td className={styles.rating}>
                              <div className={styles.ratingInfo}>
                                <span className={styles.ratingStars}>⭐</span>
                                {product.rating?.toFixed(1) || '0.0'}
                                <span className={styles.reviewCount}>({product.reviewsCount || 0})</span>
                              </div>
                            </td>
                            <td>
                              <StockBadge stock={product.stock || 0} />
                            </td>
                            <td>
                              <div className={styles.actions}>
                                <button 
                                  className={styles.editBtn}
                                  onClick={() => setUpdateProduct(product)}
                                  title="Edit Product"
                                >
                                  <Edit size={16} />
                                </button>
                                <button 
                                  className={styles.deleteBtn}
                                  onClick={() => handleDeleteClick(product)}
                                  title="Delete Product"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className={styles.noProducts}>
                            <div className={styles.emptyState}>
                              <p>No products found</p>
                              <span>
                                {selectedCategory && selectedCategory !== "All Products" && selectedCategory !== "all"
                                  ? `No products found in "${selectedCategory}". Try changing the category filter.`
                                  : "Create your first product to get started!"}
                              </span>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Products Grid */}
                <div className={styles.productsContainer}>
                    {filteredAndSortedProducts && filteredAndSortedProducts.length > 0 ? (
                        filteredAndSortedProducts.map(product => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onUpdate={(p) => setUpdateProduct(p)}
                                onDelete={handleDeleteClick}
                            />
                        ))
                    ) : (
                        <div className={styles.emptyState}>
                            <p>No products found</p>
                            <span>
                                {selectedCategory && selectedCategory !== "All Products" && selectedCategory !== "all"
                                    ? `No products found in "${selectedCategory}". Try changing the category filter.`
                                    : "Create your first product to get started!"
                                }
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* ✅ FIXED: Create Product Form Modal - Like CartSidebar */}
            {showCreateForm && (
                <CreateProductForm 
                    onClose={handleCloseCreateModal}
                    onCreate={handleProductCreated}
                    sellerId={currentUser?.uid}
                />
            )}
            
            {/* ✅ FIXED: Success Modal - Like OrderSuccessModal */}
            <CreateProductModal
                isOpen={!!createdProduct}
                onClose={handleCloseSuccessModal}
                product={createdProduct}
                onViewProduct={handleViewProduct}
                onCreateAnother={handleCreateAnother}
            />

            {updateProduct && (
                <UpdateProductForm 
                    product={updateProduct} 
                    onClose={() => setUpdateProduct(null)} 
                    onUpdate={handleUpdate} 
                />
            )}

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={handleCloseDeleteModal}
                onConfirm={handleConfirmDelete}
                productName={deleteModal.product?.name}
                isLoading={isDeleting}
            />
        </div>
    );
}