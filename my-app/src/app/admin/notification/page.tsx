"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, doc, query, orderBy, onSnapshot } from "firebase/firestore";
import { Search, CheckCircle, MessageCircle, Send } from "lucide-react";
import { db } from "@/utils/lib/firebase";
import styles from "./notification.module.css";

interface Report {
  id: string;
  reportId: string;
  userName: string;
  userEmail: string;
  issueType: string;
  subject: string;
  message: string;
  status: "unread" | "read" | "in-progress" | "resolved";
  createdAt: any;
  userType: "buyer" | "seller";
  farmId?: string;
}

interface ReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (message: string) => void;
  report: Report | null;
  isLoading?: boolean;
}

function ReplyModal({ isOpen, onClose, onSend, report, isLoading = false }: ReplyModalProps) {
  const [replyMessage, setReplyMessage] = useState("");

  const handleSend = () => {
    if (replyMessage.trim()) {
      onSend(replyMessage);
      setReplyMessage("");
    }
  };

  const handleClose = () => {
    setReplyMessage("");
    onClose();
  };

  if (!isOpen || !report) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            Reply to {report.userName}
          </h3>
          <p className={styles.modalSubtitle}>Regarding: {report.subject}</p>
          {report.farmId && report.farmId !== "Not provided" && (
            <p className={styles.farmInfo}>Farm ID: {report.farmId}</p>
          )}
        </div>
        
        <div className={styles.modalBody}>
          <div style={{ marginBottom: '16px', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
            <strong>Original Message:</strong>
            <p style={{ margin: '8px 0 0 0', color: '#273F4F', opacity: '0.8' }}>{report.message}</p>
          </div>
          
          <textarea
            className={styles.replyTextarea}
            placeholder="Type your reply here..."
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            rows={5}
          />
        </div>
        
        <div className={styles.modalFooter}>
          <button className={styles.cancelButton} onClick={handleClose}>
            Cancel
          </button>
          <button 
            className={styles.sendButton} 
            onClick={handleSend}
            disabled={!replyMessage.trim() || isLoading}
          >
            {isLoading ? (
              <>Sending...</>
            ) : (
              <>
                <Send size={16} style={{ marginRight: '8px' }} />
                Send Reply
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [timeFilter, setTimeFilter] = useState<"today" | "week" | "earlier" | "all">("all");
  const [userTypeFilter, setUserTypeFilter] = useState<"all" | "buyer" | "seller">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "unread" | "read" | "in-progress" | "resolved">("all");
  const [replyModal, setReplyModal] = useState<{
    isOpen: boolean;
    report: Report | null;
  }>({
    isOpen: false,
    report: null
  });
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      console.log("🔄 Fetching reports from supportTickets collection...");
      
      const q = query(
        collection(db, "supportTickets"),
        orderBy("createdAt", "desc")
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const reportsData: Report[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          console.log("📥 Raw report data:", data);
          
          reportsData.push({
            id: doc.id,
            reportId: data.reportId || `REP-${doc.id.slice(-6)}`,
            userName: data.userName || "Unknown User",
            userEmail: data.userEmail || "No email",
            issueType: data.issueType || "General Inquiry",
            subject: data.subject || "No subject",
            message: data.message || "No message",
            status: data.status || "unread",
            createdAt: data.createdAt || new Date(),
            userType: data.userType || "buyer",
            farmId: data.farmId
          });
        });
        
        console.log(`✅ Loaded ${reportsData.length} reports from database`);
        setReports(reportsData);
        setLoading(false);
      });

      return () => unsubscribe();

    } catch (error) {
      console.error("❌ Error fetching reports:", error);
      setLoading(false);
    }
  };

  const handleMarkAsRead = async () => {
    try {
      const unreadReports = reports.filter(r => r.status === "unread");
      
      for (const report of unreadReports) {
        await updateDoc(doc(db, "supportTickets", report.id), { 
          status: "read" 
        });
      }
      
      setReports(prev => prev.map(report => 
        report.status === "unread" ? { ...report, status: "read" } : report
      ));
    } catch (error) {
      console.error("Error updating report status:", error);
    }
  };

  const handleMarkAsResolved = async (reportId: string) => {
    try {
      await updateDoc(doc(db, "supportTickets", reportId), { 
        status: "resolved" 
      });
      setReports(prev => prev.map(report => 
        report.id === reportId ? { ...report, status: "resolved" } : report
      ));
    } catch (error) {
      console.error("Error resolving report:", error);
    }
  };

  const handleMarkAsInProgress = async (reportId: string) => {
    try {
      await updateDoc(doc(db, "supportTickets", reportId), { 
        status: "in-progress" 
      });
      setReports(prev => prev.map(report => 
        report.id === reportId ? { ...report, status: "in-progress" } : report
      ));
    } catch (error) {
      console.error("Error marking as in-progress:", error);
    }
  };

  const handleReply = (report: Report) => {
    setReplyModal({
      isOpen: true,
      report
    });
  };

  const handleSendReply = async (message: string) => {
    setSendingReply(true);
    
    try {
      // Simulate API call to send reply
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Sending reply to:', replyModal.report?.userEmail);
      console.log('Reply message:', message);
      
      // Here you would typically:
      // 1. Send email to the user
      // 2. Save the reply to your database
      // 3. Update the report status if needed
      
      // Mark as in-progress if it was unread
      if (replyModal.report?.status === 'unread') {
        await handleMarkAsInProgress(replyModal.report.id);
      }
      
      alert(`Reply sent successfully to ${replyModal.report?.userName}!`);
      
      setReplyModal({ isOpen: false, report: null });
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to send reply. Please try again.');
    } finally {
      setSendingReply(false);
    }
  };

  const handleCloseReplyModal = () => {
    setReplyModal({ isOpen: false, report: null });
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.message.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // User type filtering
    const matchesUserType = userTypeFilter === "all" || report.userType === userTypeFilter;
    if (!matchesUserType) return false;

    // Status filtering
    const matchesStatus = statusFilter === "all" || report.status === statusFilter;
    if (!matchesStatus) return false;

    // Time filtering
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const reportDate = report.createdAt?.toDate ? report.createdAt.toDate() : new Date(report.createdAt);

    switch (timeFilter) {
      case 'today':
        return reportDate >= today;
      case 'week':
        return reportDate >= weekAgo && reportDate < today;
      case 'earlier':
        return reportDate < weekAgo;
      case 'all':
      default:
        return true;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "unread": return styles.statusUnread;
      case "read": return styles.statusRead;
      case "in-progress": return styles.statusInProgress;
      case "resolved": return styles.statusResolved;
      default: return styles.statusRead;
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Unknown date";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Support Reports</h1>
        <p className={styles.subtitle}>Manage buyer and seller support tickets</p>
      </div>

      {/* Action Bar */}
      <div className={styles.actionBar}>
        <div className={styles.categoryButtons}>
          <button
            className={`${styles.categoryButton} ${timeFilter === "today" ? styles.active : ""}`}
            onClick={() => setTimeFilter("today")}
          >
            Today
          </button>
          <button
            className={`${styles.categoryButton} ${timeFilter === "week" ? styles.active : ""}`}
            onClick={() => setTimeFilter("week")}
          >
            This Week
          </button>
          <button
            className={`${styles.categoryButton} ${timeFilter === "earlier" ? styles.active : ""}`}
            onClick={() => setTimeFilter("earlier")}
          >
            Earlier
          </button>
        </div>
        <div className={styles.actionButtons}>
          {filteredReports.length > 0 && filteredReports.some(r => r.status === "unread") && (
            <button
              className={styles.markAllReadBtn}
              onClick={() => handleMarkAsRead()}
            >
              <CheckCircle size={18} />
              Mark all unread as read
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className={styles.controls}>
        <div className={styles.searchContainer}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search reports by user, email, or subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterControls}>
          <select
            value={userTypeFilter}
            onChange={(e) => setUserTypeFilter(e.target.value as any)}
            className={styles.filterSelect}
          >
            <option value="all">All Users</option>
            <option value="buyer">Buyers Only</option>
            <option value="seller">Sellers Only</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className={styles.filterSelect}
          >
            <option value="all">All Status</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      <div className={styles.reportsContainer}>
        {filteredReports.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📋</div>
            <p>
              {reports.length === 0 
                ? "No support tickets yet" 
                : "No reports match your filters"
              }
            </p>
            <span>
              {reports.length === 0 
                ? "Support tickets from buyers and sellers will appear here" 
                : "Try adjusting your search or filter criteria"
              }
            </span>
          </div>
        ) : (
          filteredReports.map((report) => (
            <div 
              key={report.id} 
              className={`${styles.reportItem} ${getStatusColor(report.status)}`}
            >
              <div className={styles.reportContent}>
                <div className={styles.topRightContainer}>
                  <span className={styles.issueBadge}>{report.issueType}</span>
                </div>

                <div className={styles.reportHeader}>
                  <div className={styles.userInfo}>
                    <h3 className={styles.userName}>{report.userName}</h3>
                    <p className={styles.userEmail}>{report.userEmail}</p>
                    {report.farmId && report.farmId !== "Not provided" && (
                      <p className={styles.farmId}>Farm ID: {report.farmId}</p>
                    )}
                  </div>
                </div>
                
                <h4 className={styles.reportSubject}>{report.subject}</h4>
                <p className={styles.reportMessage}>{report.message}</p>
                
                <div className={styles.reportFooter}>
                  <span className={styles.reportDate}>
                    {formatDate(report.createdAt)}
                  </span>
                  
                  <div className={styles.bottomRightContainer}>
                    <button 
                      className={styles.replyButton}
                      onClick={() => handleReply(report)}
                    >
                      <MessageCircle size={14} />
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reply Modal */}
      <ReplyModal
        isOpen={replyModal.isOpen}
        onClose={handleCloseReplyModal}
        onSend={handleSendReply}
        report={replyModal.report}
        isLoading={sendingReply}
      />
    </div>
  );
}