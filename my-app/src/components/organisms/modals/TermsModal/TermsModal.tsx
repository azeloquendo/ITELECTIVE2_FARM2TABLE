"use client";

import styles from "./TermsModal.module.css";

type TermsModalProps = {
    onClose: () => void;
};

export default function TermsModal({ onClose }: TermsModalProps) {
    return (
        <div className={styles.backdrop}>
            <div className={styles.modalContainer}>
                {/* Exit button */}
                <button className={styles.closeBtn} onClick={onClose}>×</button>

                {/* Terms content */}
                <h2 className={styles.title}>Terms & Conditions</h2>
                <div className={styles.scrollable}>
                    <p>Welcome to Farm2Table, a web-based platform that connects local farms directly to consumers through a transparent and accessible digital marketplace. These Terms and Conditions (“Terms”) govern your access to and use of the Farm2Table platform (“the Platform”), including any services, features, and transactions conducted within.</p>
                    <p>By registering, browsing, or making any transactions on Farm2Table, you agree to be bound by these Terms. If you do not agree, you must stop using the Platform immediately.</p>
                    <ol>
                        <li>Definitions
                            <ul>
                                <li>“Farm2Table,” “we,” “our,” “us” – refers to the operators of the platform.</li>
                                <li>"User” – refers to anyone who accesses or uses the Platform, including both consumers (buyers) and suppliers (farmers/producers).</li>
                                <li>"Suppliers” – refers to farms, producers, or sellers listing agricultural products on the Platform.</li>
                                <li>"Consumers” – refers to buyers purchasing products through the Platform.</li>
                                <li>"Products” – refers to agricultural or farm-related goods listed for sale.</li>
                            </ul>
                        </li>

                        <li>Eligibility
                            <ul>
                                <li>Users must be at least 18 years old to create an account.</li>
                                <li>By registering, you confirm that all information you provide is accurate and truthful.</li>
                                <li>Farm2Table reserves the right to suspend or terminate accounts that provide false details or violate these Terms.</li>
                            </ul>
                        </li>

                        <li>Account Registration and Security
                            <ul>
                                <li>Users must create an account to buy or sell products.</li>
                                <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                                <li>You agree to notify us immediately if you suspect unauthorized access to your account.</li>
                                <li>Farm2Table is not liable for any losses arising from compromised accounts due to user negligence.</li>
                            </ul>
                        </li>

                        <li>Platform Role
                            <ul>
                                <li>We connect suppliers and consumers but do not own, produce, or store products.</li>
                                <li>We are not a party to contracts between suppliers and consumers.</li>
                                <li>We do not guarantee product quality, availability, or delivery timelines.</li>
                            </ul>
                        </li>

                        <li>Listing and Purchasing Products
                            <ul>
                                <li>Suppliers must provide accurate descriptions, pricing, and availability details.</li>
                                <li>Consumers must carefully review listings before making a purchase.</li>
                                <li>By placing an order, consumers enter into a direct agreement with the supplier.</li>
                                <li>Farm2Table reserves the right to remove listings that are misleading, inappropriate, or unlawful.</li>
                            </ul>
                        </li>

                        <li>Pricing and Payments
                            <ul>
                                <li>Prices displayed are set by suppliers and may include applicable taxes or fees.</li>
                                <li>Payments must be made through Farm2Table’s approved payment channels.</li>
                                <li>Consumers agree to pay the full purchase amount, including delivery charges where applicable.</li>
                                <li>Farm2Table does not store sensitive payment information such as credit/debit card details.</li>
                            </ul>
                        </li>

                        <li>Delivery and Fulfillment
                            <ul>
                                <li>Delivery terms, methods, and costs are determined by suppliers and/or logistics providers.</li>
                                <li>Consumers must provide accurate delivery addresses.</li>
                                <li>Farm2Table may assist in mediating disputes but is not obligated to provide refunds or replacements.</li>
                            </ul>
                        </li>

                        <li>Refunds, Returns, and Cancellations
                            <ul>
                                <li>Refunds, returns, and cancellations are subject to the supplier’s policy.</li>
                                <li>Consumers must contact suppliers directly for requests related to damaged, expired, or incorrect products.</li>
                                <li>Farm2Table may assist in mediating disputes but is not obligated to provide refunds or replacements.</li>
                            </ul>
                        </li>

                        <li>User Responsibilities and Conduct
                            <p>Users agree not to:</p>
                            <ul>
                                <li>Provide false, misleading, or fraudulent information.</li>
                                <li>Use the Platform for illegal, harmful, or fraudulent activities.</li>
                                <li>Infringe on the intellectual property rights of others.</li>
                                <li>Attempt to hack, disrupt, or exploit the Platform.</li>
                            </ul>
                            <p>Violation of these rules may result in suspension or permanent account termination.</p>
                        </li>

                        <li>Product Quality and Compliance
                            <ul>
                                <li>Suppliers are solely responsible for ensuring their products comply with applicable agricultural, health, and safety regulations.</li>
                                <li>Consumers are encouraged to verify product quality upon receipt.</li>
                                <li>Farm2Table is not liable for product defects, spoilage, or non-compliance with legal standards.</li>
                            </ul>
                        </li>

                        <li>Intellectual Property
                            <ul>
                                <li>All trademarks, logos, and content related to Farm2Table are owned by us and protected by law.</li>
                                <li>Users may not reproduce, distribute, or use Farm2Table materials without written consent.</li>
                                <li>We will not sell personal data to third parties.</li>
                            </ul>
                        </li>

                        <li>Privacy and Data Protection
                            <ul>
                                <li>Farm2Table collects and processes personal data in accordance with our Privacy Policy.</li>
                                <li>User information may be shared with suppliers or logistics partners solely for order fulfillment.</li>
                                <li>We will not sell personal data to third parties.</li>
                            </ul>
                        </li>

                        <li>Limitation of Liability
                            <ul>
                                <li>Farm2Table is not liable for:
                                    <ul>                                            <li>Product defects, damages, or losses.</li>
                                        <li>Failed or delayed deliveries.</li>
                                        <li>Disputes between suppliers and consumers.</li>
                                    </ul>
                                </li>
                                <li>The Platform is provided on an “as-is” basis without warranties of any kind.</li>
                                <li>Users assume all risks when transacting through the Platform.</li>
                            </ul>
                        </li>

                        <li>Dispute Resolution
                            <ul>
                                <li>Users should first attempt to resolve disputes directly between supplier and consumer.</li>
                                <li>Farm2Table may mediate disputes at its discretion but is not legally obligated to enforce resolutions.</li>
                            </ul>
                        </li>

                        <li>Suspension and Termination
                            <ul>
                                <li>Farm2Table may suspend or terminate accounts for:
                                    <ul>
                                        <li>Violation of these Terms.</li>
                                        <li>Fraudulent or abusive activity.</li>
                                        <li>Misuse of the Platform.</li>
                                    </ul>
                                </li>
                                <li>Users may request account deletion at any time.</li>
                            </ul>
                        </li>

                        <li>Amendments to Terms
                            <ul>
                                <li>Farm2Table reserves the right to modify these Terms at any time.</li>
                                <li>Users will be notified of major updates via email or platform notifications.</li>
                                <li>Continued use of the Platform after changes constitutes acceptance of the revised Terms.</li>
                            </ul>
                        </li>

                        <li>Governing Law
                            <p>These Terms and Conditions are governed by and construed in accordance with the laws of Philippines. Any disputes shall be subject to the exclusive jurisdiction of the courts in the Philippines.</p>
                        </li>

                        <li>Contact Information
                            <p>For questions, concerns, or feedback, please contact us at:</p>
                            <p>📧 Email: pushpop@gmail.com</p>
                            <p>📞 Phone: 09504525143</p>
                            <p>🏢 Address: Olongapo City Sports Complex, Donor Street, East Tapinac, Olongapo City, 2200</p>
                        </li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
