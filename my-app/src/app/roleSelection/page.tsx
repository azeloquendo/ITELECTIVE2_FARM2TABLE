import Link from 'next/link';
import styles from './roleSelection.module.css';
import Image from 'next/image';

export default function RoleSelection() {
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Welcome to Farm2Table!</h1>
                <p>Choose Your Account Type</p>
            </header>
            <div className={styles.accountSelection}>
                {/* Seller Container - Left Side */}
                <div className={`${styles.accountOption} ${styles.sellerCard}`}>
                    <div className={styles.imageContainer}>
                        <Image 
                            src="/images/roleSelection/seller.png" 
                            alt="Seller" 
                            width={80} 
                            height={80}
                            className={styles.roleImage}
                        />
                    </div>
                    <div className={styles.optionHeader}>
                        <h2>Sign Up as Seller</h2>
                    </div>
                    <div className={styles.optionContent}>
                        <p>Sell fresh produce directly to customers.</p>
                        <Link href="roleSelection/seller/signup" className={styles.btn}>
                            Continue as Seller
                        </Link>
                    </div>
                    <div className={styles.cardShadow}></div>
                </div>

                {/* Buyer Container - Right Side */}
                <div className={`${styles.accountOption} ${styles.buyerCard}`}>
                    <div className={styles.imageContainer}>
                        <Image 
                            src="/images/roleSelection/buyer.png" 
                            alt="Buyer" 
                            width={80} 
                            height={80}
                            className={styles.roleImage}
                        />
                    </div>
                    <div className={styles.optionHeader}>
                        <h2>Sign Up as Buyer</h2>
                    </div>
                    <div className={styles.optionContent}>
                        <p>Shop for fresh farm-to-table products.</p>
                        <Link href="/roleSelection/buyer/signup" className={styles.btn}>
                            Continue as Buyer
                        </Link>
                    </div>
                    <div className={styles.cardShadow}></div>
                </div>
            </div>
        </div>
    );
}