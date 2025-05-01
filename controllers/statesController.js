//---------------------Imports -------------------------------------------------
//Import the statesData Middleware --- Delete file if I do not use later for clean up
const statesData = require("../middleware/statesData");

//Import the states Schema model
const State = require("../model/States");

//Import merged data set
const mergedData = require("../model/mergedData");

//---------------------GET -------------------------------------------------

//Get All States function
//Currently not in use leaving it in case i need it.--
const getAllStates = async (req, res) => {
  try {
    // Access the merged data from request object
    const states = await mergedData();

    //All state data returned
    res.status(200).json(states);
  } catch (err) {
    console.error(err);
  }
};

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

const getState = async (req, res) => {
  try {
    //All data for the state URL parameter
    const states = await mergedData();

    const stateCode = req.params.state?.toUpperCase();
    const state = states.find((s) => s.code === stateCode);

    res.json(state);
  } catch (err) {
    console.log(err);
  }
};

const getStateInfo = async (req, res) => {
  try {
    //build switch for the rest of the responses

    //All data for the state URL parameter
    const states = await mergedData();

    // Extract additional parameter from URL
    const stateCode = req.params.state?.toUpperCase();
    const state = states.find((s) => s.code === stateCode);

    // Extract additional parameter from URL
    const parameter = req.params.parameter?.toLowerCase();

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
        return res.status(200).json({ funfacts: randomFact });
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
          population: state.population.toString(),
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

module.exports = {
  getStates,
  getState,
  getStateInfo,
};
