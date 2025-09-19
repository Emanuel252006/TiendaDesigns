import mongoose from 'mongoose';

// Esquema para transacciones PayU
const payuTransactionSchema = new mongoose.Schema({
  referenceCode: {
    type: String,
    required: true,
    unique: true
  },
  transactionId: {
    type: String,
    required: true
  },
  orderId: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true,
    enum: ['APPROVED', 'DECLINED', 'PENDING', 'ERROR']
  },
  operationDate: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // Información adicional de la transacción
  value: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true,
    default: 'COP'
  },
  buyerEmail: {
    type: String,
    required: true
  },
  buyerName: {
    type: String,
    required: true
  },
  // Respuesta completa de PayU para referencia
  payuResponse: {
    type: Object,
    required: true
  }
}, {
  timestamps: true
});

// Índices para mejorar consultas
payuTransactionSchema.index({ referenceCode: 1 });
payuTransactionSchema.index({ transactionId: 1 });
payuTransactionSchema.index({ state: 1 });
payuTransactionSchema.index({ createdAt: -1 });

const PayuTransaction = mongoose.model('PayuTransaction', payuTransactionSchema);

export default PayuTransaction;

