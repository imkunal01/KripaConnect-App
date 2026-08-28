const User = require("../models/User");
const { invalidateCache } = require("../utils/cacheUtils");

// Get all users (without password) - use lean() for faster read-only query
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password -cart -favorites -savedAddresses -resetPasswordToken -resetPasswordExpires -loginOtp -loginOtpExpires")
      .lean();
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

    await invalidateCache(`user:profile:${user._id}`);

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

    if (user.retailerRequestStatus === 'pending' && role === 'customer') {
      user.retailerRequestStatus = 'rejected';
      user.retailerRequestCooldown = new Date(Date.now() + 60 * 60 * 1000); // 1 hour cool down
    } else {
      user.retailerRequestStatus = 'none';
      user.retailerRequestCooldown = null;
    }

    user.role = role;
    user.retailerRequestedAt = null;
    user.retailerReviewedAt = new Date();
    await user.save();

    await invalidateCache(`user:profile:${user._id}`);

    res.json({ success: true, message: "User role updated", data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const clearRetailerCooldown = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.retailerRequestCooldown = null;
    user.retailerRequestStatus = 'none';
    await user.save();

    await invalidateCache(`user:profile:${user._id}`);

    res.json({ success: true, message: "Cooldown cleared", data: user });
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

    await invalidateCache(`user:profile:${user._id}`);
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

// Bulk import products via CSV
const importProductsCsv = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, message: "Please upload a valid CSV file" });
    }

    const { updateExisting } = req.body;
    const isUpdate = updateExisting === 'true' || updateExisting === true;

    const { parseCsvBuffer, processProductImport } = require("../services/csvImportService");
    const rows = await parseCsvBuffer(req.file.buffer);

    if (!rows || rows.length === 0) {
      return res.status(400).json({ success: false, message: "The uploaded CSV file contains no data rows" });
    }

    const result = await processProductImport(rows, { updateExisting: isUpdate });

    res.json({
      success: true,
      message: `Processed ${result.totalRows} rows: ${result.createdCount} created, ${result.updatedCount} updated, ${result.failedCount} failed`,
      data: result
    });
  } catch (error) {
    console.error("CSV Import Error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to import products from CSV" });
  }
};

// Download CSV template
const downloadCsvTemplate = (req, res) => {
  try {
    const { generateCsvTemplate } = require("../services/csvImportService");
    const csvContent = generateCsvTemplate();

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="kripaconnect_products_template.csv"');
    res.status(200).send(csvContent);
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to generate CSV template" });
  }
};

module.exports = {
  getAllUsers,
  toggleBlockUser,
  updateUserRole,
  clearRetailerCooldown,
  deleteUser,
  getStats,
  importProductsCsv,
  downloadCsvTemplate,
};

