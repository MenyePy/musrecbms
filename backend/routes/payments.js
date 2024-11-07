const express = require('express');
const router = express.Router();
const Contract = require('../models/Contract');
const Rent = require('../models/Rent');
const Business = require('../models/Business');
const { authMiddleware } = require('../middleware/auth');
const CtechPaymentService = require('../services/CtechPaymentService');

// Initialize payment service
const paymentService = new CtechPaymentService(process.env.CTECH_API_TOKEN, process.env.CTECH_REGISTRATION, true); // true for sandbox

// Create payment order for contract fee
router.post('/contract/:businessId', authMiddleware, async (req, res) => {
  try {
    const business = await Business.findOne({ 
      _id: req.params.businessId,
      owner: req.user.id,
      status: 'approved'
    });

    if (!business) {
      return res.status(404).json({ message: 'Business not found or not approved' });
    }

    let contract = await Contract.findOne({ business: business._id });
    
    if (!contract) {
      contract = await Contract.create({
        business: business._id,
        owner: req.user.id,
        amount: business.contractFee
      });
    } else if (contract.status === 'paid') {
      return res.status(400).json({ message: 'Contract already paid' });
    }

    const { paymentMethod, phoneNumber } = req.body;

    if (paymentMethod === 'card') {
      const order = await paymentService.createCardPaymentOrder(
        contract.amount,
        {
          merchantAttributes: true,
          redirectUrl: `${process.env.FRONTEND_URL}/payment/success?business_id=${business._id}`,
          cancelUrl: `${process.env.FRONTEND_URL}/payment/failure`
        }
      );
      console.log(order);
      return res.json({
        type: 'card',
        orderReference: order.order_reference,
        paymentPageUrl: order.payment_page_URL
      });
    } 
    else if (paymentMethod === 'mobile') {
      if (!phoneNumber) {
        return res.status(400).json({ message: 'Phone number is required for mobile payment' });
      }

      const payment = await paymentService.createMobilePayment(
        contract.amount,
        phoneNumber
      );

      if (payment.status?.success) {
        console.log(payment);
        // update contract transactionId
        await Contract.findByIdAndUpdate(contract._id, { transactionId: payment.data.transaction.id });
        return res.json({
          type: 'mobile',
          transactionId: payment.data.transaction.id,
          status: payment.status.message
        });
      } else {
        console.log(payment);
      }
    } 

    return res.status(400).json({ message: 'Invalid payment method' });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Check payment status
router.get('/check-contract-status/:businessId/:reference', authMiddleware, async (req, res) => {
  try {
    const { businessId, reference } = req.params;
    
    // Find payment record (either contract or rent)
    const [contract, rent] = await Promise.all([
      Contract.findOne({
        business: businessId,
        $or: [{ orderReference: reference }, { transactionId: reference }]
      }),
      Rent.findOne({
        business: businessId,
        $or: [{ orderReference: reference }, { transactionId: reference }]
      })
    ]);

    const paymentRecord = contract || rent;
    if (!paymentRecord) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    let status;
    status = await paymentService.checkMobilePaymentStatus(reference);
    // // Check if it's a card or mobile payment
    // if (reference.startsWith('TRANS')) {
    //   status = await paymentService.checkMobilePaymentStatus(reference);
    // } else {
    //   status = await paymentService.checkCardPaymentStatus(reference);
    // }

    // Update payment status if successful
    if (status.status === 'PURCHASED' || 
        (status.success && status.transaction_status === 'COMPLETED')) {
      paymentRecord.status = 'paid';
      paymentRecord.paymentDate = new Date();
      
      // Set contract expiry if it's a contract payment
      if (contract) {
        paymentRecord.expiry = new Date().setFullYear(new Date().getFullYear() + 1);
      }
      
      await paymentRecord.save();
    }

    res.json(status);
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Create payment order for rent
router.post('/rent/:businessId', authMiddleware, async (req, res) => {
  try {
    // Verify business and ownership
    const business = await Business.findOne({ 
      _id: req.params.businessId,
      owner: req.user.id,
      status: 'approved'
    });

    if (!business) {
      return res.status(404).json({ message: 'Business not found or not approved' });
    }

    // Check if contract is paid
    const contract = await Contract.findOne({ 
      business: business._id,
      status: 'paid'
    });

    if (!contract) {
      return res.status(400).json({ message: 'Contract must be paid first' });
    }

    // Calculate current month's rent period
    const currentDate = new Date();
    const rentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const rentAmount = business.rentFee;

    // Find or create rent record
    let rent = await Rent.findOne({
      business: business._id,
      month: rentMonth
    });

    if (!rent) {
      rent = await Rent.create({
        business: business._id,
        owner: req.user.id,
        month: rentMonth,
        amount: rentAmount
      });
    } else if (rent.status === 'paid') {
      return res.status(400).json({ message: 'Rent already paid for this month' });
    }

    const { paymentMethod, phoneNumber } = req.body;

    // Handle card payment
    if (paymentMethod === 'card') {
      const order = await paymentService.createCardPaymentOrder(
        rent.amount,
        {
          merchantAttributes: true,
          redirectUrl: `${process.env.FRONTEND_URL}/payment/success?business_id=${business._id}`,
          cancelUrl: `${process.env.FRONTEND_URL}/payment/failure`,
          cancelText: 'Cancel Rent Payment'
        }
      );
      
      // Store order reference in rent document for later verification
      rent.orderReference = order.order_reference;
      await rent.save();

      return res.json({
        type: 'card',
        orderReference: order.order_reference,
        paymentPageUrl: order.payment_page_URL
      });
    } 
    // Handle mobile payment
    else if (paymentMethod === 'mobile') {
      if (!phoneNumber) {
        return res.status(400).json({ message: 'Phone number is required for mobile payment' });
      }

      const payment = await paymentService.createMobilePayment(
        rent.amount,
        phoneNumber
      );

      if (payment.status.success) {
        // Store transaction ID in rent document
        rent.transactionId = payment.data.transaction.id;
        await rent.save();

        return res.json({
          type: 'mobile',
          transactionId: payment.data.transaction.id,
          status: payment.status.message
        });
      } else {
        return res.status(400).json({ message: 'Mobile payment initiation failed' });
      }
    }

    return res.status(400).json({ message: 'Invalid payment method' });
  } catch (error) {
    console.error('Rent payment error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Check rent payment status
router.get('/check-rent-status/:businessId/:reference', authMiddleware, async (req, res) => {
  try {
    const { businessId, reference } = req.params;
    
    // Find the rent record with this order reference or transaction ID
    const rent = await Rent.findOne({
      business: businessId,
      $or: [
        { orderReference: reference },
        { transactionId: reference }
      ]
    });

    if (!rent) {
      return res.status(404).json({ message: 'Rent payment record not found' });
    }

    const status = await paymentService.checkOrderStatus(
      `RENT-${businessId}`,
      reference
    );

    if (status.status === 'PURCHASED' || 
        (status.status && status.status.success === true)) {
      // Update rent status
      rent.status = 'paid';
      rent.paymentDate = new Date();
      await rent.save();

      return res.json({
        status: 'PURCHASED',
        paymentDate: rent.paymentDate,
        amount: rent.amount
      });
    }

    res.json(status);
  } catch (error) {
    console.error('Check rent status error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Get payment history for a business
router.get('/rent-history/:businessId', authMiddleware, async (req, res) => {
  try {
    const business = await Business.findOne({ 
      _id: req.params.businessId,
      owner: req.user.id
    });

    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    const rentHistory = await Rent.find({ business: business._id })
      .sort({ month: -1 })
      .limit(12); // Last 12 months

    res.json(rentHistory);
  } catch (error) {
    console.error('Rent history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get upcoming rent payments
router.get('/rent-schedule/:businessId', authMiddleware, async (req, res) => {
  try {
    const business = await Business.findOne({ 
      _id: req.params.businessId,
      owner: req.user.id
    });

    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    // Get current month
    const currentDate = new Date();
    const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    // Generate next 3 months' schedule
    const schedule = [];
    for (let i = 0; i < 3; i++) {
      const month = new Date(currentMonth);
      month.setMonth(month.getMonth() + i);

      const existingRent = await Rent.findOne({
        business: business._id,
        month: month
      });

      schedule.push({
        month: month,
        amount: business.rentFee,
        status: existingRent ? existingRent.status : 'pending',
        dueDate: new Date(month.getFullYear(), month.getMonth(), 5) // Due by 5th of each month
      });
    }

    res.json(schedule);
  } catch (error) {
    console.error('Rent schedule error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Check payment status - for both contract and rent
router.get('/check-status/:businessId/:reference', authMiddleware, async (req, res) => {
  try {
    const { businessId, reference } = req.params;
    
    // First check if it's a rent payment
    const rent = await Rent.findOne({
      business: businessId,
      $or: [
        { orderReference: reference },
        { transactionId: reference }
      ]
    });

    if (rent) {
      const status = await paymentService.checkOrderStatus(
        `RENT-${businessId}`,
        reference
      );

      if (status.status === 'PURCHASED' || 
          (status.status && status.status.success === true)) {
        rent.status = 'paid';
        rent.paymentDate = new Date();
        await rent.save();
      }

      return res.json(status);
    }

    // If not rent, check contract payment
    const status = await paymentService.checkOrderStatus(
      businessId,
      reference
    );

    console.log("payment-js 384" + status);

    if (status.status === 'PURCHASED') {
      await Contract.findOneAndUpdate(
        { business: businessId },
        { 
          status: 'paid',
          paymentDate: new Date(),
          expiry: new Date().setFullYear(new Date().getFullYear() + 1)
        }
      );
    } else {
      if (status.transaction_status === 'null'){
        res.status(402).json({ message: status.message});
      } else {
        console.log('payments.js 399' + status);
        // if(status.transaction_status === 'success')
      }
    }

    res.json(status);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Get payment status for both contract and rent
router.get('/status/:businessId', authMiddleware, async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    const [contract, rent] = await Promise.all([
      Contract.findOne({ business: req.params.businessId }),
      Rent.findOne({ 
        business: req.params.businessId,
        month: currentMonth
      })
    ]);

    res.json({
      contract: contract ? {
        status: contract.status,
        paymentDate: contract.paymentDate
      } : null,
      rent: rent ? {
        status: rent.status,
        paymentDate: rent.paymentDate
      } : null,
      rentMonth: currentMonth
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});


// Initiate mobile payment
router.post('/mobile/:type/:businessId', authMiddleware, async (req, res) => {
  try {
    const { businessId, type } = req.params;
    const { phoneNumber } = req.body;

    const business = await Business.findOne({ 
      _id: businessId,
      owner: req.user.id,
      status: 'approved'
    });

    if (!business) {
      return res.status(404).json({ message: 'Business not found or not approved' });
    }

    // Determine payment model and amount based on type
    let paymentModel, amount;
    if (type === 'contract') {
      paymentModel = Contract;
      amount = business.contractFee;
    } else if (type === 'rent') {
      paymentModel = Rent;
      amount = business.rentFee;
    } else {
      return res.status(400).json({ message: 'Invalid payment type' });
    }

    // Initialize payment record
    let paymentRecord = await paymentModel.findOne({ 
      business: businessId,
      status: 'pending'
    });

    if (!paymentRecord) {
      if (type === 'rent'){
        const currentDate = new Date();
        const rentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        paymentRecord = await paymentModel.create({
          business: businessId,
          owner: req.user.id,
          amount,
          status: 'pending',
          month: rentMonth
        });
      } else {
        paymentRecord = await paymentModel.create({
          business: businessId,
          owner: req.user.id,
          amount,
          status: 'pending'
        });
      }
    }

    // Create mobile payment
    const payment = await paymentService.createMobilePayment(amount, phoneNumber);
    console.log("paymentjs 488: " + payment.data.transaction.id);

    if (payment.status?.success) {
      // Store transaction ID
      paymentRecord.transactionId = payment.data.transaction.id;
      await paymentRecord.save();

      return res.json({
        success: true,
        transactionId: payment.data.transaction.id,
        message: payment.status.message
      });
    }

    throw new Error('Payment initiation failed');
  } catch (error) {
    console.error('Mobile payment error:', error);
    res.status(500).json({ message: error.message || 'Payment initiation failed' });
  }
});

// Check mobile payment status
router.get('/check-status/mobile/:businessId/:transactionId', authMiddleware, async (req, res) => {
  try {
    const { businessId, transactionId } = req.params;

    // Find payment record with this transaction ID
    const [contract, rent] = await Promise.all([
      Contract.findOne({ business: businessId, transactionId }),
      Rent.findOne({ business: businessId, transactionId })
    ]);

    const paymentRecord = contract || rent;
    if (!paymentRecord) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    const status = await paymentService.checkMobilePaymentStatus(transactionId);

    switch (status.transaction_status) {
      case 'TS':
        // Payment successful
        paymentRecord.status = 'paid';
        paymentRecord.paymentDate = new Date();
        if (contract) {
          paymentRecord.expiry = new Date().setFullYear(new Date().getFullYear() + 1);
        }
        await paymentRecord.save();
        return res.json({ 
          success: true, 
          status: 'paid',
          airtelMoneyId: status.airtel_money_id 
        });

      case 'TF':
        // Payment failed - remove transaction ID
        paymentRecord.transactionId = null;
        await paymentRecord.save();
        return res.json({ 
          success: false, 
          status: 'failed',
          message: status.message 
        });

      case 'TIP':
        // Payment still processing
        return res.json({ 
          success: false, 
          status: 'pending',
          message: 'Transaction in progress' 
        });

      default:
        return res.json({ 
          success: false, 
          status: 'unknown',
          message: status.message 
        });
    }
  } catch (error) {
    console.error('Payment status check error:', error);
    res.status(500).json({ message: error.message || 'Status check failed' });
  }
});

module.exports = router;