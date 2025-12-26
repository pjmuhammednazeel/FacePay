const fetch = require('node-fetch');

const BANK_API_URL = process.env.BANK_API_URL || 'http://localhost:8000';

// Validate account number with bank API
const validateAccountNumber = async (accountNumber) => {
  try {
    const response = await fetch(`${BANK_API_URL}/validate/account/${accountNumber}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Bank API error (account validation):', error);
    throw new Error('Unable to connect to bank API');
  }
};

// Validate phone number with bank API
const validatePhoneNumber = async (phoneNumber) => {
  try {
    const response = await fetch(`${BANK_API_URL}/validate/phone/${phoneNumber}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Bank API error (phone validation):', error);
    throw new Error('Unable to connect to bank API');
  }
};

// Cross-check if phone number and account number belong to the same account
const validateAccountAndPhone = async (phoneNumber, accountNumber, bankName) => {
  try {
    // Validate account number
    const accountValidation = await validateAccountNumber(accountNumber);
    
    if (!accountValidation.valid) {
      return {
        valid: false,
        message: accountValidation.message || 'Invalid account number'
      };
    }

    // Validate phone number
    const phoneValidation = await validatePhoneNumber(phoneNumber);
    
    if (!phoneValidation.valid) {
      return {
        valid: false,
        message: phoneValidation.message || 'Invalid phone number'
      };
    }

    // Cross-check: ensure both validations return the same account
    if (accountValidation.account_number !== phoneValidation.account_number) {
      return {
        valid: false,
        message: 'Phone number and account number do not match'
      };
    }

    // Verify mobile phone matches
    if (accountValidation.mobile_phone !== phoneValidation.mobile_phone) {
      return {
        valid: false,
        message: 'Account validation mismatch'
      };
    }

    // All validations passed
    return {
      valid: true,
      message: 'Account validated successfully',
      accountDetails: {
        accountNumber: accountValidation.account_number,
        name: accountValidation.name,
        mobilePhone: accountValidation.mobile_phone
      }
    };

  } catch (error) {
    console.error('Bank validation error:', error);
    return {
      valid: false,
      message: error.message || 'Bank validation failed'
    };
  }
};

module.exports = {
  validateAccountNumber,
  validatePhoneNumber,
  validateAccountAndPhone
};
