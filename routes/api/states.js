const express = require("express");
const router = express.Router();
const statesController = require("../../controllers/statesController");
const verifyStates = require("../../middleware/verifyStates");

router.route("/").get(statesController.getStates);
router.route("/:state").get(verifyStates(), statesController.getState);
router
  .route("/:state/:parameter")
  .get(verifyStates(), statesController.getStateInfo);

router
  .route("/:state/funfact")
  .post(verifyStates(), statesController.createStateFunfact);

module.exports = router;
