const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Appointment = require('../models/Appointment');
const Transaction = require('../models/Transaction');

// ---------------------------------------------------------------------------
// @desc    Create a Stripe Checkout Session
// @route   POST /api/user/payments/checkout/:appointmentId
// ---------------------------------------------------------------------------
exports.createCheckoutSession = async (req, res) => {
  try {
    const appointmentId = req.params.appointmentId;
    const appointment = await Appointment.findOne({ _id: appointmentId, clientId: req.user._id })
      .populate('advocateId', 'name');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (appointment.status !== 'awaiting_payment') {
      return res.status(400).json({ success: false, message: `Cannot pay for appointment in status: ${appointment.status}` });
    }

    if (!appointment.feesSnapshot || appointment.feesSnapshot.feesPerSitting === null) {
      return res.status(400).json({ success: false, message: 'Fees snapshot missing from appointment' });
    }

    // Standard Stripe Integration (All funds to platform)
    const amountInPaise = Math.round(appointment.feesSnapshot.feesPerSitting * 100);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: `Legal Consultation with Advocate ${appointment.advocateId.name}`,
              description: `Appointment ID: ${appointment._id}`
            },
            unit_amount: amountInPaise,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL || 'http://localhost:3002'}/appointments?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3002'}/appointments?payment=cancelled`,
      client_reference_id: appointment._id.toString(),
      metadata: {
        appointmentId: appointment._id.toString()
      }
    });

    res.status(200).json({ success: true, url: session.url });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// @desc    Stripe Webhook Handler
// @route   POST /api/webhooks/stripe
// ---------------------------------------------------------------------------
exports.stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Requires raw body middleware in server.js for this specific route
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const appointmentId = session.metadata.appointmentId;

    try {
      const appointment = await Appointment.findById(appointmentId)
        .populate('clientId', 'name email')
        .populate('slotId', 'date startTime endTime');
        
      if (appointment && appointment.status === 'awaiting_payment') {
        appointment.status = 'accepted';
        appointment.stripeSessionId = session.id;
        await appointment.save();
        console.log(`Appointment ${appointmentId} updated to accepted via Stripe webhook`);
        
        // Send meeting email now that payment is done
        const { sendMeetingScheduledMail } = require('../utils/mailer');
        sendMeetingScheduledMail(
          appointment.clientId.email, appointment.clientId.name,
          appointment.meetingType, appointment.slotId.date, 
          appointment.slotId.startTime, appointment.slotId.endTime,
          appointment.meetingLink || null, appointment.meetingAddress || null
        );
      }
    } catch (err) {
      console.error(`Error updating appointment after webhook:`, err);
    }
  }

  // Return a 200 response to acknowledge receipt of the event
  res.status(200).send('Webhook received');
};
