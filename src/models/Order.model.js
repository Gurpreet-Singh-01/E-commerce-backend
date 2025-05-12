const { Schema, model } = require("mongoose");

const orderSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderNumber: {
      type: String,
      required: true,
    },
    items: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingAddress: {
      houseNumber: {
        type: String,
        required: true,
      },
      street: {
        type: String,
        required: true,
      },
      colony: {
          type: String,
          required: true,
        },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
      postalCode: {
        type: String,
        required: true,
      },
    },
    payment: {
      transactionId: {
        type: String,
        required: true,
      },
      status: {
        type: String,
        enum: ["pending", "shipped", "delivered", "cancelled"],
        default: "pending",
      },
    },
  },
  { timestamps: true }
);
orderSchema.index({ user: 1 });
orderSchema.index({ orderNumber: 1 });
const Order = model("Order", orderSchema);
module.exports = Order;