import axios from 'axios';
import crypto from 'crypto';

// Credenciales PayU Sandbox para Colombia (actualizadas)
const PAYU_CONFIG = {
  API_LOGIN: 'pRRXKOl8ikMmt9u',
  API_KEY: '4Vj8eK4rloUd272L48hsrarnUA',
  MERCHANT_ID: '508029',
  ACCOUNT_ID: '512321',
  API_URL: 'https://sandbox.api.payulatam.com/payments-api/4.0/service.cgi',
  TEST_CARD: {
    number: '4097440000000004', // Tarjeta oficial PayU para aprobaciones
    name: 'APPROVED',
    cvv: '777',
    expirationDate: '2025/12'
  }
};

/**
 * Genera la firma MD5 requerida por PayU
 * Formato: API_KEY~MERCHANT_ID~REFERENCE_CODE~VALUE~CURRENCY
 */
export const generatePayUSignature = (referenceCode, value, currency = 'COP') => {
  const signatureString = `${PAYU_CONFIG.API_KEY}~${PAYU_CONFIG.MERCHANT_ID}~${referenceCode}~${value}~${currency}`;
  return crypto.createHash('md5').update(signatureString).digest('hex');
};

/**
 * Crea un pago en PayU
 */
export const createPayUPayment = async (paymentData) => {
  try {
    const {
      referenceCode,
      description,
      amount,
      currency = 'COP',
      buyerEmail,
      buyerName,
      buyerPhone,
      buyerAddress,
      buyerCity,
      buyerCountry = 'CO',
      paymentMethod = 'VISA',
      test = true,
      creditCard
    } = paymentData;

    // Generar firma
    const signature = generatePayUSignature(referenceCode, amount, currency);

    // Configurar la solicitud a PayU (estructura exacta del informe)
    const payuRequest = {
      language: 'es',
      command: 'SUBMIT_TRANSACTION',
      merchant: {
        apiKey: PAYU_CONFIG.API_KEY,
        apiLogin: PAYU_CONFIG.API_LOGIN
      },
      transaction: {
        order: {
          accountId: PAYU_CONFIG.ACCOUNT_ID,
          referenceCode: referenceCode,
          description: description,
          language: 'es',
          signature: signature,
          notifyUrl: 'http://www.payu.com/notify',
          additionalValues: {
            TX_VALUE: {
              value: amount,
              currency: currency
            },
            TX_TAX: {
              value: 0,
              currency: currency
            },
            TX_TAX_RETURN_BASE: {
              value: 0,
              currency: currency
            }
          },
          buyer: {
            merchantBuyerId: '1',
            fullName: buyerName || 'Comprador Prueba',
            emailAddress: buyerEmail || 'comprador@test.com',
            contactPhone: (buyerPhone || '3001234567').replace(/\D/g, '').substring(0, 10),
            dniNumber: '123456789',
            shippingAddress: {
              street1: buyerAddress || 'Cr 23 No. 53-50',
              street2: '5555487',
              city: buyerCity || 'Bogotá',
              state: 'Bogotá D.C.',
              country: 'CO',
              postalCode: '000000',
              phone: (buyerPhone || '3001234567').replace(/\D/g, '').substring(0, 10)
            }
          },
          shippingAddress: {
            street1: buyerAddress || 'Cr 23 No. 53-50',
            street2: '5555487',
            city: buyerCity || 'Bogotá',
            state: 'Bogotá D.C.',
            country: 'CO',
            postalCode: '0000000',
            phone: (buyerPhone || '3001234567').replace(/\D/g, '').substring(0, 10)
          }
        },
        payer: {
          merchantPayerId: '1',
          fullName: buyerName || 'Comprador Prueba',
          emailAddress: buyerEmail || 'comprador@test.com',
          contactPhone: (buyerPhone || '3001234567').replace(/\D/g, '').substring(0, 10),
          dniNumber: '5415668464654',
          billingAddress: {
            street1: buyerAddress || 'Cr 23 No. 53-50',
            street2: '125544',
            city: buyerCity || 'Bogotá',
            state: 'Bogotá D.C.',
            country: 'CO',
            postalCode: '000000',
            phone: (buyerPhone || '3001234567').replace(/\D/g, '').substring(0, 10)
          }
        },
        creditCard: {
          number: (creditCard?.number || PAYU_CONFIG.TEST_CARD.number).trim(),
          securityCode: creditCard?.cvv || PAYU_CONFIG.TEST_CARD.cvv,
          expirationDate: creditCard?.expirationDate || PAYU_CONFIG.TEST_CARD.expirationDate,
          name: creditCard?.name || PAYU_CONFIG.TEST_CARD.name
        },
        extraParameters: {
          INSTALLMENTS_NUMBER: 1
        },
        type: 'AUTHORIZATION_AND_CAPTURE',
        paymentMethod: paymentMethod,
        paymentCountry: 'CO',
        deviceSessionId: 'vghs6tvkcle931686k1900o6e1',
        ipAddress: '127.0.0.1',
        // threeDomainSecure removido - puede causar "Invalid request format"
      },
      test: test
    };

    console.log('🚀 Enviando solicitud a PayU:', JSON.stringify(payuRequest, null, 2));

    // Enviar solicitud a PayU
    const response = await axios.post(PAYU_CONFIG.API_URL, payuRequest, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Accept': 'application/json',
        'User-Agent': 'PayU-API-Client/1.0'
      },
      timeout: 30000
    });

    console.log('✅ Respuesta de PayU:', JSON.stringify(response.data, null, 2));
    console.log('📊 Status code:', response.status);
    console.log('📊 Headers:', response.headers);

    return {
      success: true,
      data: response.data,
      payuRequest: payuRequest
    };

  } catch (error) {
    console.error('❌ Error en PayU:', error.response?.data || error.message);
    console.error('❌ Error completo:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers
    });
    
    return {
      success: false,
      error: error.response?.data || error.message,
      details: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      } : null
    };
  }
};

/**
 * Verifica el estado de una transacción PayU
 */
export const getPayUTransactionStatus = async (transactionId) => {
  try {
    const response = await axios.post(PAYU_CONFIG.API_URL, {
      language: 'es',
      command: 'ORDER_DETAIL_BY_REFERENCE_CODE',
      merchant: {
        apiLogin: PAYU_CONFIG.API_LOGIN,
        apiKey: PAYU_CONFIG.API_KEY
      },
      details: {
        referenceCode: transactionId
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    return {
      success: true,
      data: response.data
    };

  } catch (error) {
    console.error('❌ Error verificando estado PayU:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
};

/**
 * Genera URL de redirección para PayU (si se usa formulario)
 */
export const generatePayURedirectUrl = (paymentData) => {
  const { referenceCode, amount, currency = 'COP', buyerEmail, buyerName } = paymentData;
  const signature = generatePayUSignature(referenceCode, amount, currency);
  
  const params = new URLSearchParams({
    merchantId: PAYU_CONFIG.MERCHANT_ID,
    accountId: PAYU_CONFIG.ACCOUNT_ID,
    description: paymentData.description || 'Compra en Tienda Designs',
    referenceCode: referenceCode,
    amount: amount,
    tax: 0,
    taxReturnBase: 0,
    currency: currency,
    signature: signature,
    test: '1',
    buyerEmail: buyerEmail,
    buyerFullName: buyerName,
    responseUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout/success`,
    confirmationUrl: `http://localhost:3001/api/payu/notification`
  });

  return `https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu/?${params.toString()}`;
};

export default {
  createPayUPayment,
  getPayUTransactionStatus,
  generatePayURedirectUrl,
  generatePayUSignature,
  PAYU_CONFIG
};
