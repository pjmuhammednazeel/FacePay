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

// Helper: parse JSON with graceful fallback to raw text
const parseJsonWithFallback = async (response) => {
  const text = await response.text();
  try {
    return { data: JSON.parse(text), rawText: text, parseError: null };
  } catch (err) {
    return { data: null, rawText: text, parseError: err };
  }
};

// Get account balance by account number
const getAccountBalance = async (accountNumber) => {
  try {
    console.log('[bankApi] balance lookup for account:', accountNumber);
    
    // Use /validate/account endpoint which accepts account_number string
    const response = await fetch(`${BANK_API_URL}/validate/account/${encodeURIComponent(accountNumber)}`);
    const { data, rawText, parseError } = await parseJsonWithFallback(response);

    if (!response.ok) {
      console.warn('[bankApi] balance lookup failed', {
        status: response.status,
        account: accountNumber,
        rawText: rawText?.slice(0, 200),
      });
      return {
        valid: false,
        message: data?.detail || data?.message || rawText || 'Account lookup failed'
      };
    }

    if (!data) {
      return {
        valid: false,
        message: 'Invalid response from bank API'
      };
    }

    // If validate endpoint doesn't return balance, fetch full account details by name
    if (typeof data.balance === 'undefined') {
      console.log('[bankApi] validate successful, fetching full account details');
      // The validate endpoint confirms the account exists; we can return success
      return {
        valid: true,
        accountNumber: data.account_number,
        name: data.name,
        raw: data
      };
    }

    console.log('[bankApi] balance lookup success', {
      accountNumber: data.account_number,
      balance: data.balance,
    });

    return {
      valid: true,
      balance: Number(data.balance),
      accountNumber: data.account_number,
      name: data.name,
      raw: data
    };
  } catch (error) {
    console.error('Bank API error (get balance):', error);
    return {
      valid: false,
      message: error.message || 'Unable to connect to bank API'
    };
  }
};

// Initiate transfer between two accounts
const initiateTransfer = async (fromAccountNumber, toAccountNumber, amount) => {
  try {
    console.log('[bankApi] initiating transfer:', { from: fromAccountNumber, to: toAccountNumber, amount });
    
    const response = await fetch(`${BANK_API_URL}/accounts/transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from_account_number: fromAccountNumber,
        to_account_number: toAccountNumber,
        amount: Number(amount)
      })
    });

    const { data, rawText, parseError } = await parseJsonWithFallback(response);

    if (!response.ok) {
      throw new Error(data?.detail || data?.message || rawText || 'Transfer failed');
    }

    if (!data) {
      throw new Error(parseError?.message || 'Invalid transfer response from bank API');
    }

    const transactionId = data?.from_transaction?.id || data?.to_transaction?.id || data?.id || 'unknown';

    console.log('[bankApi] transfer successful:', { transactionId, from: fromAccountNumber, to: toAccountNumber });

    return {
      success: true,
      transactionId,
      status: data?.from_transaction?.transaction_type || 'TRANSFER',
      timestamp: data?.from_transaction?.created_at || new Date().toISOString(),
      raw: data
    };
  } catch (error) {
    console.error('Bank API error (transfer):', error);
    throw new Error(error.message || 'Bank transfer failed');
  }
};

module.exports = {
  validateAccountNumber,
  validatePhoneNumber,
  validateAccountAndPhone,
  getAccountBalance,
  initiateTransfer
};
