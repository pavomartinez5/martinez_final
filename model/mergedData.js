//Import statesData.json

const statesData = {
  states: require("./statesData.json"),
  setStates: function (data) {
    this.states = data;
  },
};

//Import the states Schema model
const State = require("./States");

const mergeData = async () => {
  try {
    // Fetch data from the MongoDB Schema Data
    const statesDB = await State.find();

    // Create new merged array using map populated with the results of statesData.json file data and  the MongoDB Schema Data
    const mergedStates = statesData.states.map((state) => {
      // Find matching state in statesDB based on 'code' and 'stateCode'
      const dbState = statesDB.find((db) => db.stateCode === state.code);

      return {
        //Use the spread operator to merge the two arrays spread operator (...)
        ...state,
        //Use ternary statement if dbState exist insert dbState.funfacts into funfacts: else insert [] into funfacts
        funfacts: dbState ? dbState.funfacts : [],
      };
    });

    return mergedStates;
  } catch (err) {
    console.error(err);
  }
};

module.exports = mergeData;
