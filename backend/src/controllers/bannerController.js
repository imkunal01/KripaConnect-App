const Banner = require("../models/Banner");
const { uploadBuffer, deleteById } = require("../services/cloudinaryService");

function normalizeBannerPayload(body = {}) {
  const payload = {};
  const textFields = ["title", "subtitle", "badge", "ctaLabel", "status"];

  textFields.forEach(field => {
    if (body[field] !== undefined) payload[field] = String(body[field]).trim();
  });

  if (body.product !== undefined) {
    payload.product = body.product || undefined;
  }

  if (body.sortOrder !== undefined && body.sortOrder !== "") {
    payload.sortOrder = Number(body.sortOrder);
  }

  ["startsAt", "endsAt"].forEach(field => {
    if (body[field] !== undefined) {
      payload[field] = body[field] ? new Date(body[field]) : undefined;
    }
  });

  return payload;
}

function isLive(banner, now = new Date()) {
  if (banner.status !== "active") return false;
  if (banner.startsAt && new Date(banner.startsAt) > now) return false;
  if (banner.endsAt && new Date(banner.endsAt) < now) return false;
  return true;
}

async function listPublicBanners(req, res) {
  try {
    const now = new Date();
    const banners = await Banner.find({ status: "active" })
      .populate("product", "name slug price retailer_price price_bulk images stock tags active")
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    res.json(
      banners
        .filter(banner => isLive(banner, now) && (!banner.product || banner.product.active !== false))
        .slice(0, 8)
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function listBannersAdmin(req, res) {
  try {
    const banners = await Banner.find({})
      .populate("product", "name slug price images active")
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();
    res.json(banners);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function createBannerAdmin(req, res) {
  try {
    const payload = normalizeBannerPayload(req.body);
    if (!payload.title) {
      return res.status(400).json({ message: "Banner title is required" });
    }

    if (req.file) {
      payload.image = await uploadBuffer(req.file.buffer);
    }

    const banner = await Banner.create(payload);
    res.status(201).json(banner);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function updateBannerAdmin(req, res) {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ message: "Banner not found" });

    const payload = normalizeBannerPayload(req.body);
    Object.entries(payload).forEach(([key, value]) => {
      banner[key] = value;
    });

    if (req.file) {
      if (banner.image?.public_id) {
        try {
          await deleteById(banner.image.public_id);
        } catch (e) {
          console.warn("Banner image delete failed:", e.message);
        }
      }
      banner.image = await uploadBuffer(req.file.buffer);
    }

    await banner.save();
    res.json(banner);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function deleteBannerAdmin(req, res) {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ message: "Banner not found" });

    if (banner.image?.public_id) {
      try {
        await deleteById(banner.image.public_id);
      } catch (e) {
        console.warn("Banner image delete failed:", e.message);
      }
    }

    await banner.deleteOne();
    res.json({ message: "Banner deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  listPublicBanners,
  listBannersAdmin,
  createBannerAdmin,
  updateBannerAdmin,
  deleteBannerAdmin,
};
