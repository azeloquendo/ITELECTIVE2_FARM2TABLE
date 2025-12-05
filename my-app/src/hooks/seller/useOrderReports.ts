// Custom hook for order report generation

import { useState } from "react";
import { Order, ReportFilters, SalesReport } from "../../interface/seller";
import { exportReportToCSV, generateSalesReport } from "../../services/seller/reportService";

export const useOrderReports = (orders: Order[]) => {
  const [showReportModal, setShowReportModal] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportData, setReportData] = useState<SalesReport | null>(null);

  const handleGenerateReport = async (filters: ReportFilters): Promise<SalesReport> => {
    try {
      setGeneratingReport(true);
      const report = generateSalesReport(orders, filters);
      setReportData(report);
      return report;
    } catch (error) {
      console.error("Error generating report:", error);
      throw new Error("Failed to generate report");
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleExportCSV = (filters: ReportFilters) => {
    if (!reportData) return;
    exportReportToCSV(reportData, filters);
  };

  const closeReportModal = () => {
    setShowReportModal(false);
    setReportData(null);
  };

  return {
    showReportModal,
    setShowReportModal,
    generatingReport,
    reportData,
    generateReport: handleGenerateReport,
    exportCSV: handleExportCSV,
    closeReportModal,
  };
};

