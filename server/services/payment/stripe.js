const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class StripeService {
  async createPaymentIntent(amount, currency = 'usd') {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency
      });
      return paymentIntent;
    } catch (error) {
      console.error('Stripe payment intent error:', error);
      throw error;
    }
  }

  async createCustomer(email, name, metadata = {}) {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata
      });
      return customer;
    } catch (error) {
      console.error('Stripe create customer error:', error);
      throw error;
    }
  }

  async attachPaymentMethod(customerId, paymentMethodId) {
    try {
      const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });
      return paymentMethod;
    } catch (error) {
      console.error('Stripe attach payment method error:', error);
      throw error;
    }
  }

  async createSubscription(customerId, priceId) {
    try {
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });
      return subscription;
    } catch (error) {
      console.error('Stripe create subscription error:', error);
      throw error;
    }
  }

  async createInvoice(customerId, items) {
    try {
      // First create an invoice item for each line item
      for (const item of items) {
        await stripe.invoiceItems.create({
          customer: customerId,
          amount: Math.round(item.amount * 100),
          currency: 'usd',
          description: item.description
        });
      }

      // Create and finalize the invoice
      const invoice = await stripe.invoices.create({
        customer: customerId,
        auto_advance: true // auto-finalize and send the invoice
      });

      return invoice;
    } catch (error) {
      console.error('Stripe create invoice error:', error);
      throw error;
    }
  }

  async getPaymentStatus(paymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent.status;
    } catch (error) {
      console.error('Stripe get payment status error:', error);
      throw error;
    }
  }

  async refundPayment(paymentIntentId, amount = null) {
    try {
      const refundParams = {
        payment_intent: paymentIntentId
      };

      if (amount) {
        refundParams.amount = Math.round(amount * 100);
      }

      const refund = await stripe.refunds.create(refundParams);
      return refund;
    } catch (error) {
      console.error('Stripe refund error:', error);
      throw error;
    }
  }

  async createCheckoutSession(items, successUrl, cancelUrl) {
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: items.map(item => ({
          price_data: {
            currency: 'usd',
            product_data: {
              name: item.name,
              description: item.description
            },
            unit_amount: Math.round(item.amount * 100)
          },
          quantity: item.quantity || 1
        })),
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl
      });
      return session;
    } catch (error) {
      console.error('Stripe create checkout session error:', error);
      throw error;
    }
  }

  async createRecurringPrice(amount, interval = 'month', productName = 'Subscription') {
    try {
      // First create a product
      const product = await stripe.products.create({
        name: productName
      });

      // Then create a price for the product
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(amount * 100),
        currency: 'usd',
        recurring: {
          interval
        }
      });

      return price;
    } catch (error) {
      console.error('Stripe create recurring price error:', error);
      throw error;
    }
  }
}

module.exports = new StripeService();
