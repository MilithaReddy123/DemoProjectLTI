// Helper function to sanitize string values (null/empty string handling)
const sanitizeValue = (value) => {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  return String(value).trim();
};

// Helper function to parse JSON fields
const parseJsonField = (field) => {
  if (!field) return [];
  return typeof field === 'string' ? JSON.parse(field) : field;
};

// Helper function to extract credit card last 4 digits
const extractCreditCardLast4 = (creditCard) => {
  if (!creditCard) return null;
  const digitsOnly = creditCard.replace(/\D/g, '');
  return digitsOnly.length >= 4 ? digitsOnly.slice(-4) : null;
};

// Helper function to format timestamp
const formatTimestamp = (timestamp) => {
  if (!timestamp) return null;
  return timestamp instanceof Date ? timestamp.toISOString() : timestamp;
};

module.exports = { sanitizeValue, parseJsonField, extractCreditCardLast4, formatTimestamp };
