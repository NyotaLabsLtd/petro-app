// Function to validate phone number (Kenyan format)
const validatePhone = (phone) => {
  // Accepts formats: 0712345678, 0112345678, 254712345678
  const regex = /^(?:254|\+254|0)?(7\d{8}|1\d{8})$/;
  return regex.test(phone);
};

// Function to validate PIN (4 digits)
const validatePin = (pin) => {
  const regex = /^\d{4}$/;
  return regex.test(pin);
};

// Middleware to validate registration data
const validateRegistration = (req, res, next) => {
  const { name, phone, pin } = req.body;

  if (!name || !phone || !pin) {
    return res.status(400).json({ error: 'Name, Phone, and PIN are required' });
  }

  if (!validatePhone(phone)) {
    return res.status(400).json({ error: 'Invalid phone number format. Use 07XXXXXXXX or 2547XXXXXXXX' });
  }

  if (!validatePin(pin)) {
    return res.status(400).json({ error: 'PIN must be exactly 4 digits' });
  }

  next();
};

// Middleware to validate login data
const validateLogin = (req, res, next) => {
  const { phone, pin } = req.body;

  if (!phone || !pin) {
    return res.status(400).json({ error: 'Phone and PIN are required' });
  }

  if (!validatePhone(phone)) {
    return res.status(400).json({ error: 'Invalid phone number format' });
  }

  if (!validatePin(pin)) {
    return res.status(400).json({ error: 'PIN must be 4 digits' });
  }

  next();
};

module.exports = { validateRegistration, validateLogin, validatePhone };