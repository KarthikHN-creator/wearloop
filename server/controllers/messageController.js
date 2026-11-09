const Message = require("../models/Message");
const SwapRequest = require("../models/SwapRequest");

// Send a message
const sendMessage = async (req, res) => {
  try {
    const { swapRequest, message } = req.body;

    if (!swapRequest || !message?.trim()) {
      return res.status(400).json({
        message: "Swap request and message are required",
      });
    }

    // Find the swap request
    const swap = await SwapRequest.findById(swapRequest);

    if (!swap) {
      return res.status(404).json({
        message: "Swap request not found",
      });
    }

    // Only users involved in the swap can chat
    const isRequester =
      swap.requester.toString() === req.userId;

    const isOwner =
      swap.owner.toString() === req.userId;

    if (!isRequester && !isOwner) {
      return res.status(403).json({
        message: "You are not authorized to chat in this swap",
      });
    }

    // Do not allow chat after the swap is finished
    if (
      swap.status === "Rejected" ||
      swap.status === "Cancelled" ||
      swap.status === "Completed"
    ) {
      return res.status(400).json({
        message: "Chat is not available for this swap",
      });
    }

    const receiver = isRequester
      ? swap.owner
      : swap.requester;

    const newMessage = await Message.create({
      swapRequest,
      sender: req.userId,
      receiver,
      message: message.trim(),
    });

    const populatedMessage = await Message.findById(
      newMessage._id
    )
      .populate("sender", "name email")
      .populate("receiver", "name email");

    res.status(201).json({
      message: "Message sent successfully",
      chatMessage: populatedMessage,
    });
  } catch (error) {
    console.error("Send message error:", error);

    res.status(500).json({
      message: "Failed to send message",
      error: error.message,
    });
  }
};


// Get messages for a swap
const getMessages = async (req, res) => {
  try {
    const { swapRequestId } = req.params;

    // Find swap request
    const swap = await SwapRequest.findById(swapRequestId);

    if (!swap) {
      return res.status(404).json({
        message: "Swap request not found",
      });
    }

    // Only users involved in the swap can view chat
    const isRequester =
      swap.requester.toString() === req.userId;

    const isOwner =
      swap.owner.toString() === req.userId;

    if (!isRequester && !isOwner) {
      return res.status(403).json({
        message: "You are not authorized to view this chat",
      });
    }

    const messages = await Message.find({
      swapRequest: swapRequestId,
    })
      .populate("sender", "name email")
      .populate("receiver", "name email")
      .sort({ createdAt: 1 });

    // Mark received messages as read
    await Message.updateMany(
      {
        swapRequest: swapRequestId,
        receiver: req.userId,
        read: false,
      },
      {
        $set: { read: true },
      }
    );

    res.status(200).json(messages);
  } catch (error) {
    console.error("Get messages error:", error);

    res.status(500).json({
      message: "Failed to fetch messages",
      error: error.message,
    });
  }
};


module.exports = {
  sendMessage,
  getMessages,
};