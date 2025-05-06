//---------------------Imports -------------------------------------------------
//Import the statesData Middleware --- Delete file if I do not use later for clean up
const statesDataFileDB = require("../model/statesData");

//Import the states Schema model
const statesMongoDB = require("../model/States");

//Import merged data set
const mergedData = require("../model/mergedData");

//---------------------GET -------------------------------------------------

//Get All States function
const getStates = async (req, res) => {
  try {
    const states = await mergedData();

    // Using optional chaining, check if the query is lowercase; if not, convert it to lowercase
    const isContig = req.query.contig?.toLowerCase() === "true";
    const isNonContig = req.query.contig?.toLowerCase() === "false";

    if (isContig) {
      const contig = states.filter(
        (data) => data.code !== "AK" && data.code !== "HI"
      );
      // All state data for contiguous states (Not AK or HI)
      return res.status(200).json(contig);
    } else if (isNonContig) {
      const nonContig = states.filter(
        (data) => data.code === "AK" || data.code === "HI"
      );
      // All state data for non-contiguous states (AK, HI)
      return res.status(200).json(nonContig);
    } else {
      // If contig isn't "true", return all states
      return res.status(200).json(states);
    }
  } catch (err) {
    console.error(err);
  }
};

//Get single state
const getState = async (req, res) => {
  try {
    //Import merge data
    const states = await mergedData();

    //Extract the parameter form the URL
    const stateCode = req.params.state?.toUpperCase();

    //Retrieve the single state from the merged data
    let state = states.find((s) => s.code === stateCode);

    //If merged dat does not have funfacts change state variable to Json information
    if (!state.funfacts || state.funfacts.length === 0) {
      state = statesDataFileDB.states.find((s) => s.code === stateCode);
    }
    //Send back state
    res.json(state);
  } catch (err) {
    console.log(err);
  }
};

//Get state info with specific parameter
const getStateInfo = async (req, res) => {
  try {
    //All data for the state URL parameter
    const states = await mergedData();

    // Extract parameter from URL
    const stateCode = req.params.state?.toUpperCase();
    const state = states.find((s) => s.code === stateCode);

    // Extract additional parameter from URL
    const parameter = req.params.parameter?.toLowerCase();

    //Check parameter
    switch (parameter) {
      case "funfact":
        if (!state.funfacts || state.funfacts.length === 0) {
          return res
            .status(404)
            .json({ message: `No Fun Facts found for ${state.state}` });
        }
        //Get a random fun fact from the array
        const randomFact =
          state.funfacts[Math.floor(Math.random() * state.funfacts.length)];
        return res.status(200).json({ funfact: randomFact });
      case "capital":
        return res
          .status(200)
          .json({ state: state.state, capital: state.capital_city });
      case "nickname":
        return res
          .status(200)
          .json({ state: state.state, nickname: state.nickname });
      case "population":
        return res.status(200).json({
          state: state.state,
          //Convert the population number into a comma-separated string based on standard formatting rules. Using the function toLocaleString()
          population: state.population.toLocaleString(),
          //Alternate method for to insert commas into your string
          //population: state.population.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","),
        });
      case "admission":
        return res
          .status(200)
          .json({ state: state.state, admitted: state.admission_date });
      default:
        return res.status(400).json({ message: "Invalid parameter" });
    }
  } catch (err) {
    console.log(err);
  }
};

//--------------------- POST -------------------------------------------------

//Create a new funfact in state array
const createStateFunfact = async (req, res) => {
  try {
    // Extract parameter from URL
    const stateCode = req.params.state?.toUpperCase();

    //Extract body parameter
    const newFunFacts = req?.body?.funfacts;

    //check to see that the array is not empty
    if (!newFunFacts || newFunFacts.length === 0) {
      return res
        .status(400)
        .json({ message: "State fun facts value required" });
    }

    // Verify you have received this "funfacts" data and verify the data is provided as an array and verity that the array is not empty
    if (!Array.isArray(newFunFacts)) {
      return res
        .status(400)
        .json({ message: "State fun facts value must be an array" });
    }

    //Find state in MongoDB
    const state = await statesMongoDB.findOne({ stateCode }).exec();

    // Check to see if state exist, if it does not exist use the newFunFacts, if it does exist Filter out fun facts already in the database
    const filteredFacts = !state
      ? newFunFacts
      : newFunFacts.filter((fact) => !state.funfacts.includes(fact));

    //If there are no filtered facts that means there is no new fact to add
    if (filteredFacts.length === 0) {
      return res.status(409).json({
        message: "All submitted fun facts already exist. Please add a new fact",
      });
    }

    // Create state or update funfact
    await statesMongoDB.updateOne(
      { stateCode },
      { $push: { funfacts: { $each: filteredFacts } } }, //Push new funfact on to array
      {
        upsert: true, //If set to true, creates a new document when no document matches the query criteria.
      }
    );

    // Retrieve the updated document
    const updatedDocument = await statesMongoDB.findOne({ stateCode }).exec();

    return res.status(200).json(updatedDocument);
  } catch (err) {
    console.error(err);
  }
};

//--------------------- Patch -------------------------------------------------

//Update a funfact in state array
const updateStateFunfact = async (req, res) => {
  try {
    // Extract parameter from URL
    const stateCode = req.params.state?.toUpperCase();

    //Extract body parameter, you should subtract 1 to adjust for the data array
    const index = req?.body?.index - 1;

    //Extract body parameter
    const funFactUpdate = req?.body?.funfact;

    // Verify you have received the index and  the funfact data and verify that index is starting at 1 not 0
    if (isNaN(index) || index < 0) {
      return res.status(400).json({
        message: "State fun fact index value required",
      });
    }

    //Verify the request body should have a funfact property
    if (!funFactUpdate) {
      return res.status(400).json({ message: "State fun fact value required" });
    }

    //Find state in MongoDB
    const state = await statesMongoDB.findOne({ stateCode }).exec();

    //Bring in all states to extract state names
    const states = await mergedData();
    const stateName = states.find((s) => s.code === stateCode);

    //Check to see if the array is empty
    if (!state || !state.funfacts || state.funfacts.length === 0) {
      return res.status(400).json({
        message: `No Fun Facts found for ${stateName.state}`,
      });
    }

    //Check to see if the index is out side of the array
    if (state.funfacts.length <= index) {
      return res.status(400).json({
        message: `No Fun Fact found at that index for ${stateName.state}`,
      });
    }

    // update funfact
    await statesMongoDB.updateOne(
      { stateCode },
      { $set: { [`funfacts.${index}`]: funFactUpdate } } //Update index
    );

    // Retrieve the updated document
    const updatedDocument = await statesMongoDB.findOne({ stateCode }).exec();

    return res.status(200).json(updatedDocument);
  } catch (err) {
    console.log(err);
  }
};
//--------------------- DELETE -------------------------------------------------
//Delete funfact in state array
const deleteStateFunfact = async (req, res) => {
  // Extract parameter from URL
  const stateCode = req.params.state?.toUpperCase();

  //Extract body parameter, you should subtract 1 to adjust for the data array
  const index = req?.body?.index - 1;

  // Verify you have received the index and  the funfact data and verify that index is starting at 1 not 0
  if (isNaN(index) || index < 0) {
    return res.status(400).json({
      message: "State fun fact index value required",
    });
  }

  //Find state in MongoDB
  const state = await statesMongoDB.findOne({ stateCode }).exec();

  //Bring in all states to extract state names
  const states = await mergedData();
  const stateName = states.find((s) => s.code === stateCode);

  //Check to see if the index is with in the array
  if (!state || !state.funfacts) {
    return res.status(400).json({
      message: `No Fun Facts found for ${stateName.state}`,
    });
  }

  //Check to see if the index is with in the array
  if (state.funfacts.length <= index) {
    return res.status(400).json({
      message: `No Fun Fact found at that index for ${stateName.state}`,
    });
  }

  //You may find filtering an element from an existing array to be the best approach here. In this example underline (_) represents the element but since we are not using the element we are just adding underscore
  //You do not want to simply delete an element and leave an undefined value in the array.
  const upDatedFunFacts = state.funfacts.filter(
    (_, funFactsIndex) => funFactsIndex !== index
  );

  // update funfact
  await statesMongoDB.updateOne(
    { stateCode },
    { $set: { funfacts: upDatedFunFacts } } //Remove index
  );

  // Retrieve the updated document
  const updatedDocument = await statesMongoDB.findOne({ stateCode }).exec();

  return res.status(200).json(updatedDocument);
};

module.exports = {
  getStates,
  getState,
  getStateInfo,
  createStateFunfact,
  updateStateFunfact,
  deleteStateFunfact,
};
