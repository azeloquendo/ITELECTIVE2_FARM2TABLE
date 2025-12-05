// Dashboard-related constants

export const CHART_OPTIONS = {
  weekly: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#273F4F',
        bodyColor: '#273F4F',
        borderColor: '#FFC93C',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function(context: any) {
            return `₱${context.parsed.y.toLocaleString()}`;
          },
          title: function(tooltipItems: any) {
            return tooltipItems[0].label;
          }
        }
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: '#273F4F',
          font: {
            size: 11,
            weight: '500' as const,
          },
          maxRotation: 0,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(39, 63, 79, 0.05)',
          drawBorder: false,
        },
        ticks: {
          color: '#273F4F',
          font: {
            size: 11,
          },
          callback: function(value: any) {
            return '₱' + value.toLocaleString();
          },
          maxTicksLimit: 6,
        },
        border: {
          dash: [4, 4],
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart' as const,
    },
  },
  monthly: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#273F4F',
        bodyColor: '#273F4F',
        borderColor: '#FFC93C',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function(context: any) {
            return `₱${context.parsed.y.toLocaleString()}`;
          },
          title: function(tooltipItems: any) {
            return tooltipItems[0].label;
          }
        }
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: '#273F4F',
          font: {
            size: 10,
            weight: '500' as const,
          },
          maxRotation: 45,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(39, 63, 79, 0.05)',
          drawBorder: false,
        },
        ticks: {
          color: '#273F4F',
          font: {
            size: 10,
          },
          callback: function(value: any) {
            return '₱' + (value / 1000) + 'k';
          },
          maxTicksLimit: 8,
        },
        border: {
          dash: [4, 4],
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart' as const,
    },
  },
} as const;

export const CHART_COLORS = {
  weekly: {
    backgroundColor: [
      'rgba(255, 201, 60, 0.8)',
      'rgba(255, 201, 60, 0.7)',
      'rgba(255, 201, 60, 0.9)',
      'rgba(255, 201, 60, 0.7)',
      'rgba(255, 201, 60, 1.0)',
      'rgba(255, 201, 60, 0.9)',
      'rgba(255, 201, 60, 0.6)'
    ],
    borderColor: '#FFC93C',
  },
  monthly: {
    backgroundColor: [
      'rgba(255, 201, 60, 0.8)',
      'rgba(255, 201, 60, 0.7)',
      'rgba(255, 201, 60, 0.9)',
      'rgba(255, 201, 60, 0.8)',
      'rgba(255, 201, 60, 0.7)',
      'rgba(255, 201, 60, 0.9)',
      'rgba(255, 201, 60, 0.8)',
      'rgba(255, 201, 60, 0.7)',
      'rgba(255, 201, 60, 0.9)',
      'rgba(255, 201, 60, 0.8)',
      'rgba(255, 201, 60, 0.7)',
      'rgba(255, 201, 60, 0.6)'
    ],
    borderColor: '#FFC93C',
  },
} as const;

export const CHART_LABELS = {
  weekly: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  monthly: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
} as const;

export const REVENUE_VIEW_TYPES = {
  WEEK: "week",
  MONTH: "month",
} as const;

