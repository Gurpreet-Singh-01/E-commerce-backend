const { Schema, model } = require("mongoose");

const cartSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items:[{
        product:{
            type:Schema.Types.ObjectId,
            ref:'Product'
        },
        quantity:{
            type:Number,
            required:true,
            min:1
        }
    }]
  },
  { timestamps: true }
);

cartSchema.index({user:1})

const Cart = model("Cart", cartSchema);
module.exports = Cart;