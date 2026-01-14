const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const { getOrSetCache } = require('../utils/cacheUtils');

// 🔹 1. OVERVIEW STATS
exports.getOverview = async (req, res) => {
  try {
    const data = await getOrSetCache(
      'analytics:overview',
      300, // 5 minutes
      async () => {
        const totalUsers = await User.countDocuments();
        const totalOrders = await Order.countDocuments();
        const totalProducts = await Product.countDocuments();
        const lowStock = await Product.countDocuments({ stock: { $lt: 10 } });

        const revenueAgg = await Order.aggregate([
          { $match: { deliveryStatus: "delivered" } },
          { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } },
        ]);

        return {
          totalUsers,
          totalOrders,
          totalProducts,
          lowStock,
          totalRevenue: revenueAgg.length ? revenueAgg[0].totalRevenue : 0,
        };
      },
      true
    );

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🔹 2. REVENUE BY DAY (for chart)
exports.getRevenueStats = async (req, res) => {
  try {
    const revenue = await getOrSetCache(
      'analytics:revenue',
      300, // 5 minutes
      async () => {
        return await Order.aggregate([
          { $match: { deliveryStatus: "delivered" } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              total: { $sum: "$totalAmount" },
            },
          },
          { $sort: { "_id": 1 } },
        ]);
      },
      true
    );

    res.json({ success: true, data: revenue });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🔹 3. ORDER STATUS DISTRIBUTION
exports.getOrderStats = async (req, res) => {
  try {
    const stats = await getOrSetCache(
      'analytics:orders',
      120, // 2 minutes
      async () => {
        return await Order.aggregate([
          {
            $group: {
              _id: "$deliveryStatus",
              count: { $sum: 1 },
            },
          },
        ]);
      },
      true
    );

    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🔹 4. TOP SELLING PRODUCTS
exports.getTopProducts = async (req, res) => {
  try {
    const populated = await getOrSetCache(
      'analytics:top-products',
      300, // 5 minutes
      async () => {
        const top = await Order.aggregate([
          { $unwind: "$items" },
          {
            $group: {
              _id: "$items.product",
              totalSold: { $sum: "$items.qty" },
            },
          },
          { $sort: { totalSold: -1 } },
          { $limit: 10 },
        ]);

        return await Product.populate(top, { path: "_id", select: "name images price" });
      },
      true
    );

    res.json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🔹 5. MONTHLY USER GROWTH
exports.getUserGrowth = async (req, res) => {
  try {
    const users = await getOrSetCache(
      'analytics:user-growth',
      300, // 5 minutes
      async () => {
        return await User.aggregate([
          {
            $group: {
              _id: {
                month: { $month: "$createdAt" },
                year: { $year: "$createdAt" },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { "_id.year": 1, "_id.month": 1 } },
        ]);
      },
      true
    );

    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🔹 6. LOW STOCK ALERTS
exports.getLowStock = async (req, res) => {
  try {
    const products = await getOrSetCache(
      'analytics:low-stock',
      120, // 2 minutes
      async () => {
        return await Product.find({ stock: { $lt: 10 } })
          .select("name stock images")
          .lean();
      },
      true
    );

    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
