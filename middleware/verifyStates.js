//Import merged data set
const mergedData = require("../model/mergedData");

//Create middleware for verifyRoles
const verifyStates = () => {
  try {
    //middleware function
    return async (req, res, next) => {
      //You will need to pull in the state codes from the mergedData.js
      const states = await mergedData();

      //Instead of all of the states data, just make a states code array - I recommend using the array map() method to do this.
      const codesArray = states.map((state) => state.code); // Create array of state codes

      //Permit lowercase, uppercase, and mixed versions of the state abbreviations to be accepted for the :state parameter.
      // Using optional chaining, check if the query is lowercase; if not, convert it to uppercase
      const stateCode = req.params.state?.toUpperCase(); // Convert parameter to uppercase

      //Search your newly created states code array to see if the state parameter received is in there.
      if (!codesArray.includes(stateCode)) {
        return res
          .status(400)
          .json({ message: "Invalid state abbreviation parameter" });
      }

      next();
    };
  } catch (err) {
    console.log(err);
  }
};

module.exports = verifyStates;
