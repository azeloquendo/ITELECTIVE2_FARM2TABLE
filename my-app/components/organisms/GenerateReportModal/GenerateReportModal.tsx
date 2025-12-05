"use client";
import React, { useState } from "react";
import styles from "./GenerateReportModal.module.css";

interface ReportFilters {
  startDate: string;
  endDate: string;
  status: string;
  reportType: "sales" | "orders" | "products";
}

interface SalesReport {
  totalOrders: number;
  totalRevenue: number;
  completedOrders: number;
  pendingOrders: number;
  canceledOrders: number;
  averageOrderValue: number;
  topProducts: { name: string; quantity: number; revenue: number }[];
}

interface GenerateReportModalProps {
  onClose: () => void;
  onGenerateReport: (filters: ReportFilters) => Promise<SalesReport>;
  onExportCSV: (report: SalesReport, filters: ReportFilters) => void;
  generatingReport: boolean;
  reportData: SalesReport | null;
}

export default function GenerateReportModal({
  onClose,
  onGenerateReport,
  onExportCSV,
  generatingReport,
  reportData
}: GenerateReportModalProps) {
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // First day of current month
    endDate: new Date().toISOString().split('T')[0], // Today
    status: "all",
    reportType: "sales"
  });

  const handleGenerateReport = async () => {
    try {
      await onGenerateReport(filters);
    } catch (error) {
      alert("Failed to generate report. Please try again.");
    }
  };

  // Enhanced CSV Export with proper formatting
  const handleExportCSV = () => {
    if (!reportData) return;

    const csvContent = generateCSVContent(reportData, filters);
    
    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sales-report-${filters.startDate}-to-${filters.endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate properly formatted CSV content
  const generateCSVContent = (report: SalesReport, filters: ReportFilters): string => {
    const rows = [];
    
    // Header section
    rows.push(['Farm2Table']);
    rows.push(['Sales Report']);
    rows.push([]);
    rows.push(['Report Period:', `${filters.startDate} to ${filters.endDate}`]);
    rows.push(['Report Type:', filters.reportType.charAt(0).toUpperCase() + filters.reportType.slice(1) + ' Report']);
    rows.push(['Order Status:', filters.status === 'all' ? 'All Statuses' : filters.status]);
    rows.push(['Generated:', new Date().toLocaleString()]);
    rows.push([]);
    rows.push([]);
    
    // Summary Statistics
    rows.push(['SUMMARY STATISTICS']);
    rows.push([]);
    rows.push(['Metric', 'Value']);
    rows.push(['Total Orders', report.totalOrders.toString()]);
    rows.push(['Total Revenue', `PHP ${report.totalRevenue.toFixed(2)}`]);
    rows.push(['Completed Orders', report.completedOrders.toString()]);
    rows.push(['Pending Orders', report.pendingOrders.toString()]);
    rows.push(['Canceled Orders', report.canceledOrders.toString()]);
    rows.push(['Average Order Value', `PHP ${report.averageOrderValue.toFixed(2)}`]);
    rows.push([]);
    rows.push([]);
    
    // Top Products
    if (report.topProducts.length > 0) {
      rows.push(['TOP PERFORMING PRODUCTS']);
      rows.push([]);
      rows.push(['Product Name', 'Quantity Sold', 'Revenue Generated']);
      report.topProducts.forEach(product => {
        rows.push([
          product.name,
          product.quantity.toString(),
          `PHP ${product.revenue.toFixed(2)}`
        ]);
      });
    }
    
    rows.push([]);
    rows.push([]);
    rows.push(['End of Report']);
    
    // Convert to CSV string with proper formatting
    return rows.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
  };

  // Enhanced Print Functionality
  const handlePrint = () => {
    if (!reportData) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Farm2Table - Sales Report</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
              line-height: 1.4;
            }
            .print-header {
              text-align: center;
              border-bottom: 2px solid #2c5530;
              padding-bottom: 15px;
              margin-bottom: 25px;
            }
            .print-header .company {
              font-size: 32px;
              font-weight: bold;
              color: #2c5530;
              margin: 0;
            }
            .print-header .report-title {
              font-size: 24px;
              color: #666;
              margin: 5px 0 0 0;
              font-weight: normal;
            }
            .print-meta {
              display: flex;
              justify-content: space-between;
              flex-wrap: wrap;
              gap: 10px;
              margin: 15px 0;
              font-size: 14px;
            }
            .print-meta div {
              background: #f8f9fa;
              padding: 8px 12px;
              border-radius: 4px;
              border-left: 3px solid #2c5530;
            }
            .print-stats {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 15px;
              margin: 25px 0;
            }
            .print-stat {
              border: 1px solid #ddd;
              padding: 20px;
              text-align: center;
              border-radius: 8px;
              background: #f9f9f9;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .print-stat .value {
              font-size: 24px;
              font-weight: bold;
              display: block;
              color: #2c5530;
              margin-bottom: 5px;
            }
            .print-stat .label {
              font-size: 12px;
              color: #666;
              text-transform: uppercase;
              letter-spacing: 1px;
              font-weight: bold;
            }
            .print-section {
              margin: 30px 0;
            }
            .print-section h3 {
              color: #2c5530;
              border-bottom: 1px solid #ddd;
              padding-bottom: 8px;
              margin-bottom: 15px;
            }
            .print-products table {
              width: 100%;
              border-collapse: collapse;
              margin: 10px 0;
            }
            .print-products th {
              background: #2c5530;
              color: white;
              padding: 12px;
              text-align: left;
              font-weight: bold;
            }
            .print-products td {
              padding: 10px 12px;
              border-bottom: 1px solid #ddd;
            }
            .print-products tr:nth-child(even) {
              background: #f9f9f9;
            }
            .print-footer {
              margin-top: 40px;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 15px;
            }
            @media print {
              body { margin: 1cm; }
              .print-stat { break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <div class="company">Farm2Table</div>
            <div class="report-title">Sales Report</div>
            <div class="print-meta">
              <div><strong>Period:</strong> ${filters.startDate} to ${filters.endDate}</div>
              <div><strong>Report Type:</strong> ${filters.reportType.charAt(0).toUpperCase() + filters.reportType.slice(1)}</div>
              <div><strong>Status:</strong> ${filters.status === 'all' ? 'All Statuses' : filters.status}</div>
              <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
            </div>
          </div>

          <div class="print-section">
            <h3>Performance Overview</h3>
            <div class="print-stats">
              <div class="print-stat">
                <span class="value">${reportData.totalOrders}</span>
                <span class="label">Total Orders</span>
              </div>
              <div class="print-stat">
                <span class="value">PHP ${reportData.totalRevenue.toFixed(2)}</span>
                <span class="label">Total Revenue</span>
              </div>
              <div class="print-stat">
                <span class="value">PHP ${reportData.averageOrderValue.toFixed(2)}</span>
                <span class="label">Average Order Value</span>
              </div>
              <div class="print-stat">
                <span class="value">${reportData.completedOrders}</span>
                <span class="label">Completed Orders</span>
              </div>
              <div class="print-stat">
                <span class="value">${reportData.pendingOrders}</span>
                <span class="label">Pending Orders</span>
              </div>
              <div class="print-stat">
                <span class="value">${reportData.canceledOrders}</span>
                <span class="label">Canceled Orders</span>
              </div>
            </div>
          </div>

          ${reportData.topProducts.length > 0 ? `
            <div class="print-section print-products">
              <h3>Top Performing Products</h3>
              <table>
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Quantity Sold</th>
                    <th>Revenue Generated</th>
                  </tr>
                </thead>
                <tbody>
                  ${reportData.topProducts.map(product => `
                    <tr>
                      <td>${product.name}</td>
                      <td>${product.quantity}</td>
                      <td>PHP ${product.revenue.toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}

          <div class="print-footer">
            Confidential Business Report - Generated by Farm2Table Analytics System
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const quickDateRanges = {
    today: () => {
      const today = new Date().toISOString().split('T')[0];
      setFilters(prev => ({ ...prev, startDate: today, endDate: today }));
    },
    thisWeek: () => {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      setFilters(prev => ({
        ...prev,
        startDate: startOfWeek.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      }));
    },
    thisMonth: () => {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      setFilters(prev => ({
        ...prev,
        startDate: startOfMonth.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      }));
    },
    lastMonth: () => {
      const today = new Date();
      const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      setFilters(prev => ({
        ...prev,
        startDate: startOfLastMonth.toISOString().split('T')[0],
        endDate: endOfLastMonth.toISOString().split('T')[0]
      }));
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Generate Sales Report</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        <div className={styles.modalContent}>
          {/* Quick Date Buttons - Left side without container */}
          <div className={styles.quickDateButtons}>
            <button type="button" onClick={quickDateRanges.today} className={styles.quickDateButton}>
              Today
            </button>
            <button type="button" onClick={quickDateRanges.thisWeek} className={styles.quickDateButton}>
              This Week
            </button>
            <button type="button" onClick={quickDateRanges.thisMonth} className={styles.quickDateButton}>
              This Month
            </button>
            <button type="button" onClick={quickDateRanges.lastMonth} className={styles.quickDateButton}>
              Last Month
            </button>
          </div>

          {/* Report Filters - Two columns */}
          <div className={styles.filters}>
            <div className={styles.filterColumn}>
              <div className={styles.filterGroup}>
                <label>Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className={styles.filterGroup}>
                <label>End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>
            
            <div className={styles.filterColumn}>
              <div className={styles.filterGroup}>
                <label>Order Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="completed">Completed</option>
                  <option value="canceled">Canceled</option>
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label>Report Type</label>
                <select
                  value={filters.reportType}
                  onChange={(e) => setFilters(prev => ({ ...prev, reportType: e.target.value as any }))}
                >
                  <option value="sales">Sales Report</option>
                  <option value="orders">Orders Report</option>
                  <option value="products">Products Report</option>
                </select>
              </div>
            </div>
          </div>

          {/* Generate Report Button - Right side, yellow, 3D */}
          <div className={styles.generateSection}>
            <button
              className={styles.generateButton}
              onClick={handleGenerateReport}
              disabled={generatingReport}
            >
              {generatingReport ? "Generating Report..." : "Generate Report"}
            </button>
          </div>

          {/* Report Results */}
          {reportData && (
            <div className={styles.reportResults}>
              <h3>Report Results</h3>
              
              {/* Report Stats - Same design as orders stats */}
              <div className={styles.reportStats}>
                <div className={`${styles.reportStat} ${styles.totalOrdersStat}`}>
                  <span className={styles.statValue}>{reportData.totalOrders}</span>
                  <span className={styles.statLabel}>Total Orders</span>
                </div>
                <div className={`${styles.reportStat} ${styles.totalRevenueStat}`}>
                  <span className={styles.statValue}>₱{reportData.totalRevenue.toFixed(2)}</span>
                  <span className={styles.statLabel}>Total Revenue</span>
                </div>
                <div className={`${styles.reportStat} ${styles.completedStat}`}>
                  <span className={styles.statValue}>{reportData.completedOrders}</span>
                  <span className={styles.statLabel}>Completed</span>
                </div>
                <div className={`${styles.reportStat} ${styles.pendingStat}`}>
                  <span className={styles.statValue}>{reportData.pendingOrders}</span>
                  <span className={styles.statLabel}>Pending</span>
                </div>
              </div>

              {/* Top Products */}
              {reportData.topProducts.length > 0 && (
                <div className={styles.topProducts}>
                  <h4>Top Products</h4>
                  <div className={styles.productsList}>
                    {reportData.topProducts.map((product, index) => (
                      <div key={index} className={styles.productItem}>
                        <span className={styles.productName}>{product.name}</span>
                        <span className={styles.productQuantity}>{product.quantity} sold</span>
                        <span className={styles.productRevenue}>₱{product.revenue.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Export Section - Right side, yellow, 3D */}
              <div className={styles.exportSection}>
                <button
                  className={styles.exportButton}
                  onClick={handleExportCSV}
                >
                  📥 Export to CSV
                </button>
                <button
                  className={styles.printButton}
                  onClick={handlePrint}
                >
                  🖨️ Print Report
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}