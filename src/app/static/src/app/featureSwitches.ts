const urlParams = new URLSearchParams(globalThis.location?.search);
const modelBugReport = !urlParams.get('modelBugReport');
const modelCalibratePlot = !urlParams.get('modelCalibratePlot');
const comparisonOutput = !urlParams.get('comparisonOutput');

export const switches = {
    modelBugReport,
    modelCalibratePlot,
    comparisonOutput
};
