const Cart = require("../models/Cart.model");
const Product = require("../models/Product.model");
const APIError = require("../utils/API_utilities/APIError");
const APIResponse = require("../utils/API_utilities/APIResponse");
const asyncHandler = require("../utils/API_utilities/asyncHandler");

const addToCart = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { productId, quantity } = req.body;

  if (!productId || !quantity)
    throw new APIError(400, "Product Id and quantity is required");

  const qty = Number(quantity);
  if (isNaN(qty) || qty < 1)
    throw new APIError(400, "Quantity must a valid number");

  const product = await Product.findById(productId);
  if (!product) throw new APIError(404, "Product not found");

  if (product.stock < qty)
    throw new APIError(400, `Available stock ${product.stock}`);

  let cart = await Cart.findOne({ user: userId });

  if (!cart) {

    cart = await Cart.create({
      user: userId,
      items: [{ product: productId, quantity: qty }],
    });

  } else {
    const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId)
    if(itemIndex > -1){
        cart.items[itemIndex].quantity = qty;
    }else{
        cart.items.push(
            {
                product:productId,
                quantity:qty
            }
        )
    }
    await cart.save()
  }

  await cart.populate("items.product", "name price category image stock")

  return res.status(201)
  .json(new APIResponse(201, cart, "Products added to cart successfully"))

});

const getCart = asyncHandler(async(req,res) =>{
    const userId = req.user?._id

    const cart = await Cart.findOne({user:userId}).populate("items.product", "name price category image stock")
    if(!cart){
        return res.status(200).json(new APIResponse(200, [], "cart fetched successfully"))
    }
    res.status(200).json(new APIResponse(200, cart, "cart fetched successfully"))

})

module.exports = {
  addToCart,
  getCart,
  
};
