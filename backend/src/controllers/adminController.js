const User = require("../models/User");

// Get all users (without password)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Block / Unblock a user
const toggleBlockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isBlocked ? "blocked" : "unblocked"} successfully`,
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update user role
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!["customer", "retailer", "admin"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.role = role;
    await user.save();

    res.json({ success: true, message: "User role updated", data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a user
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "You can't delete yourself" });
    }

    await user.deleteOne();
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin basic stats
const getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalRetailers = await User.countDocuments({ role: "retailer" });
    const totalCustomers = await User.countDocuments({ role: "customer" });
    const blockedUsers = await User.countDocuments({ isBlocked: true });

    res.json({
      success: true,
      data: {
        totalUsers,
        totalRetailers,
        totalCustomers,
        blockedUsers,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllUsers,
  toggleBlockUser,
  updateUserRole,
  deleteUser,
  getStats,
};
