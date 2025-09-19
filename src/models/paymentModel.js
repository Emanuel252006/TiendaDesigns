import { getPool } from '../db.js';

export const PaymentModel = {
  // Crear un nuevo pago (compatible con PayU)
  async createPayment(paymentData) {
    const pool = await getPool();
    
    // Si viene con estructura de PayU (usando campos existentes)
    if (paymentData.ReferenceCode) {
      const {
        ReferenceCode, TransactionId, State, ResponseMessage, 
        PaymentMethod, Amount, OrdenID
      } = paymentData;
      
      // Mapear PayU a campos existentes
      const [result] = await pool.execute(`
        INSERT INTO Pagos (
          OrdenID, Monto, MetodoPago, PaymentId, PreferenceId, Estado
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        OrdenID || null, 
        Amount, 
        PaymentMethod || 'PayU', 
        TransactionId, 
        ReferenceCode, 
        State || 'Pendiente'
      ]);
      
      return result.insertId;
    } 
    else {
      // Estructura básica para otros métodos de pago
      const { OrdenID, Monto, MetodoPago, PaymentId, PreferenceId, Estado = 'Aprobado' } = paymentData;
      
      const [result] = await pool.execute(`
        INSERT INTO Pagos (OrdenID, Monto, MetodoPago, PaymentId, PreferenceId, Estado)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [OrdenID, Monto, MetodoPago, PaymentId, PreferenceId, Estado]);
      
      return result.insertId;
    }
  },

  // Obtener pago por ID de transacción (método general)
  async getPaymentByTransactionId(paymentId) {
    const pool = await getPool();
    
    const [rows] = await pool.execute(`
      SELECT p.*, o.UsuarioID, o.Estado as OrdenEstado
      FROM Pagos p
      INNER JOIN Ordenes o ON p.OrdenID = o.OrdenID
      WHERE p.PaymentId = ?
    `, [paymentId]);
    
    return rows[0];
  },

  // Actualizar estado del pago
  async updatePaymentStatus(paymentId, estado) {
    const pool = await getPool();
    
    const [result] = await pool.execute(`
      UPDATE Pagos 
      SET Estado = ?
      WHERE PaymentId = ?
    `, [estado, paymentId]);
    
    return result.affectedRows > 0;
  },

  // Obtener todos los pagos de una orden
  async getPaymentsByOrderId(ordenId) {
    const pool = await getPool();
    
    const [rows] = await pool.execute(`
      SELECT * FROM Pagos WHERE OrdenID = ?
    `, [ordenId]);
    
    return rows;
  },

  // ========== MÉTODOS ESPECÍFICOS PARA PAYU ==========

  // Obtener pago por código de referencia de PayU (usando PreferenceId)
  async getPaymentByReference(referenceCode) {
    const pool = await getPool();
    
    const [rows] = await pool.execute(`
      SELECT * FROM Pagos WHERE PreferenceId = ?
    `, [referenceCode]);
    
    return rows[0];
  },

  // Actualizar estado de pago por código de referencia
  async updatePaymentStatus(referenceCode, updateData) {
    const pool = await getPool();
    
    const {
      TransactionId, State, ResponseMessage
    } = updateData;
    
    const [result] = await pool.execute(`
      UPDATE Pagos 
      SET PaymentId = ?, Estado = ?
      WHERE PreferenceId = ?
    `, [TransactionId, State, referenceCode]);
    
    return result.affectedRows > 0;
  },

  // Obtener pago por TransactionId de PayU (usando PaymentId) - método específico
  async getPaymentByPayUTransactionId(transactionId) {
    const pool = await getPool();
    
    const [rows] = await pool.execute(`
      SELECT * FROM Pagos WHERE PaymentId = ?
    `, [transactionId]);
    
    return rows[0];
  }
};

