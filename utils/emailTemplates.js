export const welcomeEmailTemplate = (name) => `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; color:#222;">
    <h2>Welcome to DevBhakt, ${name}!</h2>
    <p>Thank you for creating an account with us. Your journey into devotional fashion starts here.</p>
    <p>— Team DevBhakt</p>
  </div>
`;

export const orderConfirmationTemplate = (order) => `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; color:#222;">
    <h2>Order Confirmed</h2>
    <p>Hi ${order.shippingAddress.fullName}, your order <strong>#${order._id}</strong> has been placed successfully.</p>
    <p><strong>Total:</strong> ₹${order.totalPrice}</p>
    <p><strong>Payment method:</strong> ${order.paymentMethod}</p>
    <p>We'll notify you once it's shipped.</p>
    <p>— Team DevBhakt</p>
  </div>
`;

export const passwordResetTemplate = (resetUrl) => `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; color:#222;">
    <h2>Reset your DevBhakt password</h2>
    <p>Click the link below to reset your password. This link expires in 30 minutes.</p>
    <p><a href="${resetUrl}">${resetUrl}</a></p>
    <p>If you didn't request this, you can safely ignore this email.</p>
  </div>
`;
