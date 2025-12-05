"use client";

import styles from "./PrivacyModal.module.css";

type TermsModalProps = {
    onClose: () => void;
};

export default function PrivacyModal({ onClose }: TermsModalProps) {
    return (
        <div className={styles.backdrop}>
            <div className={styles.modalContainer}>
                {/* Exit button */}
                <button className={styles.closeBtn} onClick={onClose}>×</button>

                {/* Privacy content */}
                <h2 className={styles.title}>Privacy and Policy</h2>
                <div className={styles.scrollable}>
                    <p>Farm2Table (“we,” “our,” “us”) values your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, and protect your data when you use our platform, which connects local farms directly to consumers through a digital marketplace.</p>
                    <p>By creating an account, purchasing products, or using Farm2Table, you agree to the practices described in this Privacy Policy.</p>
                    <ol>
                        <li>Information We Collect
                            <p>When you use Farm2Table, we may collect the following information:</p>
                            <ul>
                                <li>Personal Information: Full name, email address, phone number, delivery address, payment details (processed securely through third-party providers).</li>
                                <li>Account Information: Username, password, and transaction history.</li>
                                <li>Supplier Information: Farm/business name, contact details, and product listings.</li>
                                <li>Usage Data: Device information, browser type, IP address, and activity on the platform.</li>
                                <li>Communication Data: Feedback, inquiries, and messages sent through the platform.</li>
                            </ul>
                        </li>
                        <li>How We Use Your Information
                            <p>We use your information to:</p>
                            <ul>
                                <li>Create and manage your account.</li>
                                <li>Process and fulfill orders between consumers and suppliers.</li>
                                <li>Facilitate payments through secure gateways.</li>
                                <li>Arrange deliveries through logistics partners.</li>
                                <li>Improve the platform’s functionality and user experience.</li>
                                <li>Provide customer support and respond to inquiries.</li>
                                <li>Send service updates, transaction confirmations, or promotional content (you may opt out anytime).</li>
                                <li>Comply with legal obligations.</li>
                            </ul>
                        </li>
                        <li>Sharing of Information
                            <p>We do not sell or rent your personal data. However, we may share your information with:</p>
                            <ul>
                                <li>Suppliers (farmers/producers) to fulfill your orders</li>
                                <li>Delivery/logistics providers to ensure successful delivery of goods.</li>
                                <li>Payment processors to handle secure transactions.</li>
                                <li>Service providers that help us operate the platform (e.g., hosting, analytics).</li>
                                <li>Authorities when required by law, regulation, or legal process.</li>
                            </ul>
                        </li>
                        <li>Data Security
                            <ul>
                                <li>We implement appropriate technical and organizational measures to protect your data against unauthorized access, loss, or misuse.</li>
                                <li>Passwords are encrypted and payment details are processed only by certified third-party providers.</li>
                                <li>While we take precautions, no online system can guarantee 100% security. Users share information at their own risk.</li>
                            </ul>
                        </li>
                        <li>Data Retention
                            <ul>
                                <li>We retain your personal information only as long as necessary to provide services, comply with legal obligations, or resolve disputes.</li>
                                <li>ou may request account deletion, after which your data will be removed unless required by law to retain certain records.</li>
                            </ul>
                        </li>
                        <li>User Rights
                            <ul>
                                <li>Access and review the personal information we hold about you.</li>
                                <li>Request corrections to inaccurate or incomplete information</li>
                                <li>Request deletion of your account and data (subject to legal and transaction limits).</li>
                                <li>Opt out of promotional communications.</li>
                                <li>File a complaint with the appropriate Data Protection Authority if you believe your data has been mishandled</li>
                            </ul>
                        </li>
                        <li>Cookies and Tracking Technologies
                            <ul>
                                <li>Farm2Table may use cookies or similar technologies to improve user experience, analyze traffic, and personalize content.</li>
                                <li>You may disable cookies through your browser settings, but some platform features may not function properly</li>
                            </ul>
                        </li>
                        <li>Third-Party Links
                            <p>Our platform may contain links to third-party websites or services. Farm2Table is not responsible for the privacy practices of these external sites. We encourage users to read their privacy policies.</p>
                        </li>
                        <li>Children's Privacy
                            <p>Farm2Table is not intended for users under 18 years old without parental or guardian consent. We do not knowingly collect data from minors.</p>
                        </li>
                        <li>Updates to This Policy
                            <p>We may update this Privacy Policy from time to time to reflect changes in practices, legal requirements, or platform improvements. Users will be notified of significant changes through the platform or via email.</p>
                        </li>
                        <li>Contact Us
                            <p>For questions, concerns, or feedback, please contact us at:</p>
                            <p>📧 Email: pushpop@gmail.com</p>
                            <p>📞 Phone: 09504525143</p>
                            <p>🏢 Address: Olongapo City Sports Complex, Donor Street, East Tapinac, Olongapo City, 2200</p>
                        </li>
                    </ol>
                </div>
            </div>
        </div>
    )
}