const Notification = require("../models/Notification");
const STATUSES = ["PENDING", "IN_PROGRESS", "RESOLVED", "REJECTED"];

exports.listMine = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = { userId: req.user.id };
    if (req.query.unreadOnly === "true") filter.isRead = false;
    if (req.query.status && STATUSES.includes(req.query.status)) {
      filter["data.status"] = req.query.status;
    }

    const [items, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: "reportId",
          select: "category status districtId",
          populate: { path: "districtId", select: "name" },
        })
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ userId: req.user.id, isRead: false }),
    ]);

    res.json({
      items,
      total,
      unreadCount,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.markRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, userId: req.user.id });
    if (!notification) return res.status(404).json({ message: "Notification not found" });

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();
    }

    const unreadCount = await Notification.countDocuments({ userId: req.user.id, isRead: false });
    res.json({ message: "Notification marked as read", unreadCount });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );
    res.json({ message: "All notifications marked as read", unreadCount: 0 });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
