const munkres = require('munkres-js');

function performMatching(costMatrix) {
  console.log("Performing Hungarian algorithm for optimal field matching...");
  const m = new munkres.Munkres();
  return m.compute(costMatrix);
}

module.exports = performMatching;
