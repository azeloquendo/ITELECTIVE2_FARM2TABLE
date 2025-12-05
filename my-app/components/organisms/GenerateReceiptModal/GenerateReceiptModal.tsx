// app/seller/orders/components/GenerateReceiptModal/GenerateReceiptModal.tsx
"use client";
import React from "react";
import { X, Receipt } from "lucide-react";
import styles from "./GenerateReceiptModal.module.css";
interface Product {
  name: string;
  quantity: number;
  unitPrice: number;
  unit: string;
  notes?: string;
}
interface GenerateReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    orderDate: string;
    status: string;
    totalPrice: number;
  };
  sellerName: string;
  sellerContact?: string;
  sellerAddress?: string;
  buyerInfo: {
    name: string;
    contact: string;
    address: string;
  };
  deliveryMethod: string;
  products: Product[];
  specialInstructions: string;
  
  // Add new props
  paymentInfo?: {
    method: string;
    status: string;
    transactionId?: string;
  };
  deliveryInfo?: {
    time: string;
    estimatedDelivery?: string;
    trackingNumber?: string;
  };
}
export default function GenerateReceiptModal({
  isOpen,
  onClose,
  order,
  sellerName,
  sellerContact = "Not provided",
  sellerAddress = "Not provided",
  buyerInfo,
  deliveryMethod,
  products,
  specialInstructions,
  paymentInfo,
  deliveryInfo
}: GenerateReceiptModalProps) {
  const handlePrintReceipt = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // Create a more detailed receipt
    const receiptContent = `
OFFICIAL RECEIPT
================

ORDER DETAILS:
--------------
Order ID: ${order.id}
Order Date: ${new Date(order.orderDate).toLocaleDateString()}

SELLER INFORMATION:
------------------
Business: ${sellerName}
Contact: ${sellerContact}
Address: ${sellerAddress}

BUYER INFORMATION:
-----------------
Name: ${buyerInfo.name}
Contact: ${buyerInfo.contact}
Address: ${buyerInfo.address}

PAYMENT & DELIVERY INFORMATION:
------------------------------
Payment Method: ${paymentInfo?.method || 'Cash on Delivery'}
Delivery Method: ${deliveryMethod}
Delivery Time: ${deliveryInfo?.time || 'Within 3-5 business days'}
${deliveryInfo?.estimatedDelivery ? `Estimated Delivery: ${deliveryInfo.estimatedDelivery}` : ''}
${deliveryInfo?.trackingNumber ? `Tracking: ${deliveryInfo.trackingNumber}` : ''}
${paymentInfo?.transactionId ? `Transaction ID: ${paymentInfo.transactionId}` : ''}

ORDER ITEMS:
-----------
${products.map((product, index) => 
  `${index + 1}. ${product.name}
   Quantity: ${product.quantity} ${product.unit}
   Unit Price: ₱${product.unitPrice}
   Subtotal: ₱${(product.quantity * product.unitPrice).toFixed(2)}`
).join('\n\n')}

TOTAL AMOUNT: ₱${order.totalPrice.toFixed(2)}

Special Instructions: ${specialInstructions}

Generated on: ${new Date().toLocaleString()}
    `.trim();

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const element = document.createElement('a');
    element.href = URL.createObjectURL(blob);
    element.download = `receipt-order-${order.id}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (!isOpen) return null;

  // Updated waybill info rows - removed status, delivery time, and payment
  const waybillInfoRows = [
    { label: "Waybill No:", value: `WB-${order.id}` },
    { label: "Order Date:", value: new Date(order.orderDate).toLocaleDateString() }
  ];

  return (
    <div className={styles.receiptOverlay}>
      <div className={styles.receiptModal}>
        <div className={styles.receiptHeader}>
          <h2>
            <Receipt size={24} />
            Waybill/Receipt - Order #{order.id}
          </h2>
          <button 
            className={styles.closeBtn} 
            onClick={onClose}
            style={{ textDecoration: 'none' }}
          >
            <X size={20} />
          </button>
        </div>
        
        <div className={styles.receiptContent}>
          {/* Waybill Header Information */}
          <div className={styles.waybillHeader}>
            <div className={styles.waybillCompany}>
              <h3>{sellerName}</h3>
              <p>OFFICIAL WAYBILL/RECEIPT</p>
            </div>
            <div className={styles.waybillDetails}>
              <table className={styles.waybillInfoTable}>
                <tbody>
                  {waybillInfoRows.map((row, index) => (
                    <tr key={index}>
                      <td><strong>{row.label}</strong></td>
                      <td>{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* Sender and Receiver Information - Seller above Buyer with dividing line */}
          <div className={styles.partiesSection}>
            <div className={styles.partyInfo}>
              <h4>SELLER (Sender)</h4>
              <table className={styles.partyTable}>
                <tbody>
                  <tr>
                    <td><strong>Name:</strong></td>
                    <td>{sellerName}</td>
                  </tr>
                  <tr>
                    <td><strong>Contact:</strong></td>
                    <td>{sellerContact}</td>
                  </tr>
                  <tr>
                    <td><strong>Address:</strong></td>
                    <td>{sellerAddress}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            {/* Divider Line between Seller and Buyer */}
            <div className={styles.partyDivider}></div>
            
            <div className={styles.partyInfo}>
              <h4>BUYER (Receiver)</h4>
              <table className={styles.partyTable}>
                <tbody>
                  <tr>
                    <td><strong>Name:</strong></td>
                    <td>{buyerInfo.name}</td>
                  </tr>
                  <tr>
                    <td><strong>Contact:</strong></td>
                    <td>{buyerInfo.contact}</td>
                  </tr>
                  <tr>
                    <td><strong>Address:</strong></td>
                    <td>{buyerInfo.address}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          {/* Payment & Delivery Information Section */}
          <div className={styles.partiesSection} style={{ marginBottom: '24px' }}>
            <div className={styles.partyInfo}>
              <h4>PAYMENT & DELIVERY INFORMATION</h4>
              <table className={styles.partyTable}>
                <tbody>
                  <tr>
                    <td><strong>Payment Method:</strong></td>
                    <td>{paymentInfo?.method || 'Cash on Delivery'}</td>
                  </tr>
                  <tr>
                    <td><strong>Delivery Method:</strong></td>
                    <td>{deliveryMethod}</td>
                  </tr>
                  <tr>
                    <td><strong>Delivery Time:</strong></td>
                    <td>{deliveryInfo?.time || 'Within 3-5 business days'}</td>
                  </tr>
                  {deliveryInfo?.estimatedDelivery && (
                    <tr>
                      <td><strong>Est. Delivery:</strong></td>
                      <td>{new Date(deliveryInfo.estimatedDelivery).toLocaleDateString()}</td>
                    </tr>
                  )}
                  {deliveryInfo?.trackingNumber && (
                    <tr>
                      <td><strong>Tracking No:</strong></td>
                      <td style={{ fontFamily: 'monospace' }}>{deliveryInfo.trackingNumber}</td>
                    </tr>
                  )}
                  {paymentInfo?.transactionId && (
                    <tr>
                      <td><strong>Transaction ID:</strong></td>
                      <td style={{ fontFamily: 'monospace' }}>{paymentInfo.transactionId}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {/* Order Items Table */}
          <div className={styles.itemsSection}>
            <h4>ORDER ITEMS</h4>
            <table className={styles.itemsTable}>
              <thead>
                <tr className={styles.beigeHeader}>
                  <th>No.</th>
                  <th>Item Description</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, index) => (
                  <tr key={index}>
                    <td className={styles.center}>{index + 1}</td>
                    <td>{product.name}</td>
                    <td className={styles.center}>{product.quantity} {product.unit}</td>
                    <td className={styles.right}>₱{product.unitPrice?.toLocaleString()}</td>
                    <td className={styles.right}>₱{(product.quantity * product.unitPrice)?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className={styles.offWhiteTotal}>
                  <td colSpan={4} className={styles.totalLabel}><strong>TOTAL AMOUNT:</strong></td>
                  <td className={`${styles.right} ${styles.totalAmount}`}>
                    <strong>₱{order.totalPrice?.toLocaleString()}</strong>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          {/* Special Instructions */}
          {specialInstructions && specialInstructions !== 'No special instructions provided' && (
            <div className={styles.instructionsSection}>
              <h4>SPECIAL INSTRUCTIONS</h4>
              <table className={styles.instructionsTable}>
                <tbody>
                  <tr>
                    <td>{specialInstructions}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
          {/* Terms and Signatures */}
          <div className={styles.footerSection}>
            <div className={styles.terms}>
              <h4>TERMS & CONDITIONS</h4>
              <table className={styles.termsTable}>
                <tbody>
                  <tr>
                    <td>• Goods sold are not returnable unless defective</td>
                  </tr>
                  <tr>
                    <td>• Please check items upon delivery</td>
                  </tr>
                  <tr>
                    <td>• Report any discrepancies within 24 hours</td>
                  </tr>
                  <tr>
                    <td>• Payment must be settled as per agreed method</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className={styles.signatures}>
              <table className={styles.signatureTable}>
                <tbody>
                  <tr>
                    <td className={styles.signatureBox}>
                      <div className={styles.signatureLine}></div>
                      <p>Seller's Signature</p>
                    </td>
                    <td className={styles.signatureBox}>
                      <div className={styles.signatureLine}></div>
                      <p>Buyer's Signature</p>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <p>Date: ________________</p>
                    </td>
                    <td>
                      <p>Date: ________________</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {/* Action Buttons - No icons */}
        <div className={styles.receiptActions}>
          <button 
            className={styles.printButton} 
            onClick={handlePrintReceipt}
            style={{ textDecoration: 'none' }}
          >
            Print Waybill
          </button>
          <button 
            className={styles.downloadButton} 
            onClick={handleDownloadPDF}
            style={{ textDecoration: 'none' }}
          >
            Download as PDF
          </button>
        </div>
      </div>
    </div>
  );
}