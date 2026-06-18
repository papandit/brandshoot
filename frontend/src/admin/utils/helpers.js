// Format numbers with K/M suffixes
export const formatNumber = (n) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
};

// Format currency
export const formatUSD = (n) => `$${n.toFixed(4)}`;
export const formatINR = (n, rate = 91) => `₹${(n * rate).toFixed(2)}`;

// Format date
export const formatDate = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// Format date with time
export const formatDateTime = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Calculate token costs
export const calculateCost = (inputTokens, outputTokens, settings) => {
  const inputCost = (inputTokens / 1_000_000) * settings.input_cost_per_million;
  const outputCost = (outputTokens / 1_000_000) * settings.output_cost_per_million;
  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
  };
};

// Download file
export const downloadFile = (url, filename) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || 'download';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
