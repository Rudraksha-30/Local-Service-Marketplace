const router = require("express").Router();
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const { protect, authorize } = require("../middleware/auth");
const { STATUS } = require("../services/bookingStateMachine");
const ctrl = require("../controllers/booking.controller");
const messageCtrl = require("../controllers/message.controller");
const disputeCtrl = require("../controllers/dispute.controller");
const reviewCtrl = require("../controllers/review.controller");
const bookingUpload = require("../middleware/bookingUpload");
const fs = require("fs");
const path = require("path");
const Booking = require("../models/Booking");

router.use(protect);

router.post(
  "/",
  authorize("customer"),
  bookingUpload.array("attachments", 5),
  [
    body("providerId").isMongoId().withMessage("providerId must be a valid id"),
    body("category")
      .isString()
      .trim()
      .notEmpty()
      .withMessage("category is required"),
    body("scheduledStart")
      .isISO8601()
      .withMessage("scheduledStart must be an ISO date-time"),
    body("durationMinutes").optional().isInt({ min: 15, max: 480 }).toInt(),
    body("notes").optional().isString().isLength({ max: 500 }),
    body("address").optional().isString().isLength({ max: 200 }),
  ],
  validate,
  ctrl.createBooking,
);

router.get("/", authorize("customer", "provider"), ctrl.listMyBookings);
router.get("/:id", ctrl.getBooking);

router.delete(
  "/:id/attachments/:filename",
  authorize("customer"),
  ctrl.deleteAttachment,
);

router.get("/:id/attachments/:filename", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const uid = req.user._id.toString();
    const isParty = [booking.customer, booking.provider].some(
      (id) => id.toString() === uid,
    );

    if (!isParty && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const attachment = booking.attachments.find(
      (file) => file.filename === req.params.filename,
    );

    if (!attachment) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    const filePath = path.join(__dirname, "../../", attachment.storagePath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found on server" });
    }

    res.type(attachment.mimeType);
    res.sendFile(path.resolve(filePath));
  } catch (error) {
    res.status(500).json({ message: "Unable to retrieve attachment" });
  }
});

router.patch(
  "/:id/status",
  authorize("customer", "provider"),
  [
    body("status").isIn(Object.values(STATUS)).withMessage("Unknown status"),
    body("reason").optional().isString().isLength({ max: 300 }),
  ],
  validate,
  ctrl.updateStatus,
);

// Chat thread for this booking (FR-22)
router.get(
  "/:id/messages",
  authorize("customer", "provider"),
  messageCtrl.list,
);

router.post(
  "/:id/messages",
  authorize("customer", "provider"),
  [
    body("text")
      .isString()
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage("Message must be 1 to 1000 characters"),
  ],
  validate,
  messageCtrl.send,
);

router.patch(
  "/:id/messages/:messageId",
  authorize("customer", "provider"),
  [
    body("text")
      .isString()
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage("Message must be 1 to 1000 characters"),
  ],
  validate,
  messageCtrl.edit,
);

router.delete(
  "/:id/messages/:messageId",
  authorize("customer", "provider"),
  messageCtrl.remove,
);

// Review and disputes attached to this booking
router.get(
  "/:bookingId/review",
  authorize("customer", "provider"),
  reviewCtrl.getForBooking,
);

router.patch(
  '/:bookingId/review',
  authorize('customer'),
  [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().isString().isLength({ max: 1000 }),
  ],
  validate,
  reviewCtrl.updateReview
);
router.get("/:bookingId/disputes", disputeCtrl.listForBooking);

module.exports = router;
