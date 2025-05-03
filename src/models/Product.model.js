const { Schema, model } = require("mongoose");

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
    },
    images: [
      {
        url: {
            type:String,
            required:true
        },
        public_id: {
            type:String,
            required:true
        }
      },
    ],
    reviews: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        rating: {
          type: Number,
          required: true,
          min: 1,
          max: 5,
        },
        comment: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
  },
  { timestamps: true }
);

productSchema.index({name:'text', description:'text'})
productSchema.index({category:1, price:1})

productSchema.methods.updateAverageRating = async function(){
    const reviews = this.reviews || [];
    this.averageRating = reviews.length
    ? Number(reviews.reduce((sum,review) => sum + review.rating, 0)/reviews.length).toFixed(0)
    : 0

    await this.save()
}

const Product = model("Product", productSchema);
module.exports = Product;