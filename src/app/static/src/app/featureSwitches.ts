// this used to be window.location.search, however the global window object
// only occurs in a browser environment, inside playwright tests we are in
// the node environment. because of this inconsistency globalThis was
// introduces, this acts as whatever the global object is in the environment
// so in node environment this is "global" and in the browser it is "window" 
const urlParams = new URLSearchParams(globalThis.location?.search);
const modelBugReport = !urlParams.get('modelBugReport');
const modelCalibratePlot = !urlParams.get('modelCalibratePlot');
const comparisonOutput = !urlParams.get('comparisonOutput');

export const switches = {
    modelBugReport,
    modelCalibratePlot,
    comparisonOutput
};
