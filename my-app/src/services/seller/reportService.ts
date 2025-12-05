// Report-related service functions

import { Order, ReportFilters, SalesReport } from "../../interface/seller";

/**
 * Generate sales report from filtered orders
 */
export const generateSalesReport = (orders: Order[], filters: ReportFilters): SalesReport => {
  // Filter orders based on report criteria
  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.orderDate);
    const startDate = new Date(filters.startDate);
    const endDate = new Date(filters.endDate);
    endDate.setHours(23, 59, 59, 999); // End of day
    
    const matchesDate = orderDate >= startDate && orderDate <= endDate;
    const matchesStatus = filters.status === "all" || order.status === filters.status;
    
    return matchesDate && matchesStatus;
  });

  // Calculate report data
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.totalPrice, 0);
  const completedOrders = filteredOrders.filter(order => order.status === "completed").length;
  const pendingOrders = filteredOrders.filter(order => order.status === "pending").length;
  const canceledOrders = filteredOrders.filter(order => order.status === "canceled").length;
  const averageOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;

  // Calculate top products
  const productSales: { [key: string]: { name: string; quantity: number; revenue: number } } = {};
  
  filteredOrders.forEach(order => {
    order.products.forEach(product => {
      if (!productSales[product.name]) {
        productSales[product.name] = {
          name: product.name,
          quantity: 0,
          revenue: 0
        };
      }
      productSales[product.name].quantity += product.quantity;
      productSales[product.name].revenue += product.quantity * product.unitPrice;
    });
  });

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10); // Top 10 products

  return {
    totalOrders: filteredOrders.length,
    totalRevenue,
    completedOrders,
    pendingOrders,
    canceledOrders,
    averageOrderValue,
    topProducts
  };
};

/**
 * Export report to CSV format
 */
export const exportReportToCSV = (report: SalesReport, filters: ReportFilters): void => {
  const headers = ["Metric", "Value"];
  const data = [
    ["Report Period", `${filters.startDate} to ${filters.endDate}`],
    ["Total Orders", report.totalOrders.toString()],
    ["Total Revenue", `₱${report.totalRevenue.toFixed(2)}`],
    ["Completed Orders", report.completedOrders.toString()],
    ["Pending Orders", report.pendingOrders.toString()],
    ["Canceled Orders", report.canceledOrders.toString()],
    ["Average Order Value", `₱${report.averageOrderValue.toFixed(2)}`],
    [],
    ["Top Products", "Quantity", "Revenue"]
  ];

  report.topProducts.forEach(product => {
    data.push([product.name, product.quantity.toString(), `₱${product.revenue.toFixed(2)}`]);
  });

  const csvContent = data.map(row => row.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `sales-report-${filters.startDate}-to-${filters.endDate}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

