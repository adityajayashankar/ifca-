import Topbar from "@/components/topbar/Topbar";
import {
  clearCart,
  deleteItem,
  fetchAllCartItems,
  selectUser,
  selectUserCart,
  setUserCart,
} from "@/store/features/userSlice";
import api from "@/utils/apiSetup";
import Head from "next/head";
import { useRouter } from "next/router";
import Script from "next/script";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import DeleteIcon from '@mui/icons-material/Delete';

const cart = () => {
  const user=useSelector(selectUser)
  const cartItems = useSelector(selectUserCart);
  const currentUser = useSelector(selectUser);
  const router = useRouter();
  const dispatch = useDispatch();
  const [walletBalance, setWalletBalance] = useState(0); 
  const [redeemChecked, setRedeemChecked] = useState(false);
  const [total, setTotal] = useState(0);
  const [redeemedAmount, setRedeemedAmount] = useState(0);

  useEffect(() => {
    user && fetchUserRewards()
  }, [user])

  const fetchUserRewards = async () => {
    await api.get(`rewards/user/${user?.unifiedUser?.id}`)
    .then((res)=>{
      setWalletBalance(res?.data?.points)
    })
    .catch((err)=>{
      console.log('err', err)
    })
  }


  const handleVerify = async (response) => {
    try {
      const storedCartData = localStorage.getItem("cartData");
      const communityDetails = storedCartData ? JSON.parse(storedCartData) : [];

      const sessionItems = [];
      let hasCommunityItems = false;

      for (const item of cartItems) {
        if (item.type === "community") {
          hasCommunityItems = true;
        } else {
          sessionItems.push(item);
        }
      }
  
      const res = await api.post("/order/verification", {
        orderId: response.razorpay_order_id,
        paymentId: response.razorpay_payment_id,
        signature: response.razorpay_signature,
        userId: currentUser.unifiedUser?.id,
        userEmail: currentUser.email,
        cartItems,
      });
  
      if (res) {
        if (hasCommunityItems) {
          await api.post("/requests", { communityDetails });
        }

        for (const session of sessionItems) {
          await api.post(`/user/${user?.unifiedUser?.id}/sessions`, {
            sessionId: session.sessionId,
            price: session.price,
          });
        }

        if (redeemedAmount > 0) {
          await api.post("/rewards/updateUserReward", {
            userId: currentUser?.unifiedUser?.id,
            points: redeemedAmount,
          });
        }
        
        localStorage.removeItem("cartData");
        dispatch(clearCart());
        router.push("/home/feed");
        toast.success("Payment Successful! Details submitted.", { duration: 5000 });
  
      }
    } catch (err) {
      toast.error("Payment Unsuccessful. Any payments made will be refunded.");
      console.error(err);
    }
  };
  
  

  // useEffect(() => {
  //   currentUser && dispatch(fetchAllCartItems);
  // }, [currentUser]);

  const cartIds = cartItems?.map((i) => {
    return i.id;
  });

  // const clearCartWithoutPay = async () => {
  //   try {
  //     await api.patch(`/user/${currentUser?.id}/cart`, {
  //       attendanceIds: cartIds,
  //     });
  //     dispatch(setUserCart(currentUser?.unifiedUser?.id));
  //     toast.success("Success removing cart items");
  //   } catch (err) {
  //     toast.error("Error removing cart items");
  //   }
  // };

  const subtotal = !isNaN(
    parseFloat(
      cartItems?.reduce((sum, item) => {
        return sum + item.price;
      }, 0)
    ),
  )
    ? parseFloat(
        cartItems?.reduce((sum, item) => {
          return sum + item.price;
        }, 0)
      )
    : 0;

  const shipping = parseFloat(0);
  const discount = parseFloat(0);
  
  useEffect(() => {
    setTotal(subtotal);
  }, [subtotal]);


  const validate = () => {
    const nameRegex = new RegExp("[a-zA-Z]$");
    const emailRegex = new RegExp("[a-zA-Z0-9#^&*)]+@[a-zA-Z0-9]+.[a-z]{2,3}$");
    const phoneRegex = new RegExp("[0-9]{10}$");

    if (name === "" || name === " " || !nameRegex.test(name)) {
      return { status: false, message: "Name not in correct format" };
    }
    if (email === "" || email === " " || !emailRegex.test(email)) {
      return { status: false, message: "Email not in correct format" };
    }
    if (
      phone === "" ||
      phone === " ") {
      return { status: false, message: "Phone Number not in correct format" };
    }
    if (address === "" || address === " ") {
      return { status: false, message: "Address field cannot be empty" };
    }
    return { status: true, message: "Validation Successful" };
  };

const handleCheckout = async (e) => {
  e.preventDefault();
  const err = validate();
  if (!err.status) {
    return toast.error(err.message);
  }

  if (total <= 0) {
    try {
      const storedCartData = localStorage.getItem("cartData");
      const communityDetails = storedCartData ? JSON.parse(storedCartData) : [];

      const sessionItems = [];
      let hasCommunityItems = false;

      for (const item of cartItems) {
        if (item.type === "community") {
          hasCommunityItems = true;
        } else {
          sessionItems.push(item);
        }
      }

      if (hasCommunityItems) {
        await api.post("/requests", { communityDetails });
      }

      for (const session of sessionItems) {
        await api.post(`/user/${user?.unifiedUser?.id}/sessions`, {
          sessionId: session.sessionId,
          price: session.price,
        });
      }

      if (redeemedAmount > 0) {
        await api.post("/rewards/updateUserReward", {
          userId: currentUser?.unifiedUser?.id,
          points: redeemedAmount,
        });
      }

      localStorage.removeItem("cartData");
      dispatch(clearCart());
      router.push("/home/feed");
      toast.success("Order Successful with Wallet Points!", { duration: 5000 });
    } catch (err) {
      toast.error("Order Failed. Please try again.");
      console.error(err);
    }
  } else {
    try {
      const { data } = await api.post("/order/createOrder", {
        amount: total,
        userId: currentUser?.unifiedUser?.id,
      });
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: total * 100,
        currency: "INR",
        name: "IFCA",
        description: "Paying for Order",
        order_id: data.order.id,
        handler: handleVerify,
        prefill: { name, email, contact: phone },
        notes: { address },
        theme: { color: "#3399cc" },
      };
      const razor = new window.Razorpay(options);
      razor.open();
    } catch (err) {
      toast.error("Payment Failed!");
    }
  }
};

  const [address, setAddress] = useState(
    currentUser ? currentUser.address : ""
  );
  const [name, setName] = useState(currentUser ? currentUser?.name : "");
  const [email, setEmail] = useState(currentUser ? currentUser?.email : "");
  const [phone, setPhone] = useState(currentUser ? currentUser?.phone : "");

  // async function handleDelete(id) {
  //   await api.patch(`/user/${currentUser?.unifiedUser?.id}/cart`, { attendanceIds: [id] });
  //   dispatch(setUserCart(currentUser?.unifiedUser?.id));
  // }

  const handleDelete=(comId)=>{
    dispatch(deleteItem(comId))
    const storedCart = JSON.parse(localStorage.getItem('cartData')) || [];
    console.log('storaed', storedCart)
    const updatedCart = storedCart.filter(item => item.communityId !== comId);
    localStorage.setItem('cartData', JSON.stringify(updatedCart));
  }

  const handleClear=()=>{
    dispatch(clearCart())
    localStorage.removeItem("cartData");
  }

  const handleChange = () => {
    if (!redeemChecked) {
      const maxRedeemable = total;
      const redeemAmount = Math.min(walletBalance, maxRedeemable);
      setTotal(prev => prev - redeemAmount);
      setRedeemedAmount(redeemAmount);
      setWalletBalance(prev => prev - redeemAmount);
      setRedeemChecked(true);
    } else {
      setTotal(prev => prev + redeemedAmount);
      setWalletBalance(prev => prev + redeemedAmount);
      setRedeemedAmount(0);
      setRedeemChecked(false);
    }
  };
  
  
  return (
    <>
      <Head>
        <title>Cart</title>
      </Head>
      <header>
        <Topbar />
      </header>
      <main className="flex flex-col lg:flex-row mx-0 mt-[80px] min-h-screen">
  {/* Left: Cart Section */}
  <div className="w-full lg:w-1/2 h-auto bg-black text-white px-6 sm:px-10 md:px-[80px] lg:px-[120px] py-10">
    {cartItems?.length > 0 ? (
      <>
        <p className="mb-5 text-lg sm:text-xl font-semibold">Your Order</p>
        <div className="bg-white rounded-xl overflow-hidden my-10">
          {cartItems?.map((item, index) => (
            <div key={index} className="text-black">
              <div className="flex flex-col sm:flex-row justify-between p-3 border-b-2 border-[#333] gap-4 sm:gap-0">
                <div className="flex items-center gap-4">
                  <img
                    className="h-[90px] w-[90px] object-cover rounded-lg"
                    src={item.image || "/cart1img.svg"}
                    alt=""
                  />
                  <div className="flex flex-col gap-2">
                    <h3 className="m-0 font-medium text-sm sm:text-base">{item.comTitle}</h3>
                    <span className="px-2 py-1 text-xs font-semibold text-white bg-blue-600 rounded-full w-fit">
                      {item.type === "community" ? "Community" : "Session"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-row sm:flex-col justify-between items-end sm:items-start gap-2 sm:gap-0">
                  <div className="font-bold">&#x20B9;{item.price}</div>
                  <button
                    className="bg-red-500 rounded-md text-white px-1 py-1"
                    onClick={() => handleDelete(item.comId)}
                  >
                    <DeleteIcon />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </>
    ) : (
      <div className="w-full flex flex-col items-center justify-center text-xl font-bold mb-10 text-gray-500">
        <p>Your Cart is Empty</p>
        <img
          src="/cart.png"
          alt=""
          className="w-[50px] h-[50px] object-cover my-5"
        />
      </div>
    )}

    <div>
      <p className="flex items-center justify-between my-5 text-sm sm:text-base">
        <span>Subtotal</span>
        <span>&#8377; {subtotal}</span>
      </p>
      <p className="flex items-center justify-between font-semibold bg-gray-500/75 my-10 rounded-xl p-3 text-sm sm:text-base">
        <span>Total</span>
        <span>&#8377; {total}</span>
      </p>
    </div>
  </div>

  <div className="w-full lg:w-1/2 min-h-full p-6 sm:p-10 lg:p-[50px]">
    <h1 className="m-0 mb-8 font-bold text-lg sm:text-xl text-center">
      Confirm Your Details
    </h1>
    <form
      // onSubmit={
      //   total <= 0
      //     ? (e) => {
      //         e.preventDefault();
      //         toast.error("Your Cart is Empty", { duration: 5000 });
      //       }
      //     : handleCheckout
      // }
      onSubmit={handleCheckout}
      className="w-full rounded-xl px-2 sm:px-5 flex flex-col gap-2 max-w-xl mx-auto"
    >
      <label className="mx-2 sm:mx-4 text-gray-500 text-sm">Card Holder Name</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        type="text"
        className="outline-none rounded-xl bg-white px-4 py-2 mx-2 sm:mx-4 text-black font-semibold"
        required
        placeholder="Enter Full Name"
      />

      <label className="mx-2 sm:mx-4 text-gray-500 mt-4 text-sm">Email</label>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        type="text"
        className="outline-none rounded-xl bg-white px-4 py-2 mx-2 sm:mx-4 text-black font-semibold"
        required
        placeholder="Enter Email"
      />

      <label className="mx-2 sm:mx-4 text-gray-500 mt-4 text-sm">Phone Number</label>
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        type="text"
        className="outline-none rounded-xl bg-white px-4 py-2 mx-2 sm:mx-4 text-black font-semibold"
        required
        placeholder="Enter Phone No"
      />

      <label className="mx-2 sm:mx-4 text-gray-500 mt-4 text-sm">Billing Address</label>
      <input
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        type="text"
        className="outline-none rounded-xl bg-white px-4 py-2 mx-2 sm:mx-4 text-black font-semibold"
        required
        placeholder="Enter Billing Address"
      />

      {(
          <div className="flex items-center mt-4">
                <input
                  type="checkbox"
                  id="redeemWalletBalance"
                  checked={redeemChecked}
                  onChange={handleChange}
                  disabled={total <= 0 && !redeemChecked}
                />
                <label htmlFor="redeemWalletBalance" className="ml-2 text-gray-700">
                  Use Wallet Balance : ₹{walletBalance || 0}
                </label>
              </div>
        )}

        {redeemChecked && (
          <p className="text-green-600">Hurray!! Redeemed ₹{redeemedAmount} from Wallet</p>
        )}

      <button
        type="submit"
        disabled={cartItems?.length <= 0}
        className={`bg-black ${
          cartItems?.length <= 0 && "opacity-60"
        } text-white p-3 rounded-lg mt-5 self-center w-[90%] sm:w-[80%]`}
      >
        {redeemChecked && total <= 0 ? 'Proceed Without Paying' : `Pay ₹${total}`}
      </button>
    </form>
    <button
      onClick={handleClear}
      className="bg-transparent border-2 border-black text-black p-3 rounded-lg mt-4 self-center w-[85%] md:w-[75%] ml-6 md:ml-20"
    >
      Clear Cart
    </button>
  </div>
</main>

      <Script src="https://checkout.razorpay.com/v1/checkout.js"></Script>
    </>
  );
};

export default cart;
