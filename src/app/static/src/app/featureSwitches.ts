const urlParams = new URLSearchParams(window.location.search);
const modelBugReport = !urlParams.get('modelBugReport');
const modelCalibratePlot = !urlParams.get('modelCalibratePlot');

export const switches = {
    modelBugReport,
    modelCalibratePlot
};
