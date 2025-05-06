// Set data for statesData.json file
const statesData = {
  states: require("./statesData.json"),
  setStates: function (data) {
    this.states = data;
  },
};

module.exports = statesData;
