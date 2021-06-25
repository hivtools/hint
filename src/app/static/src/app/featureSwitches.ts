const urlParams = new URLSearchParams(window.location.search);
const modelBugReport = !urlParams.get('modelBugReport');
const adrPushInputs = urlParams.get('adrPushInputs');
const modelCalibratePlot = !urlParams.get('modelCalibratePlot');

export const switches = {
    modelBugReport,
    adrPushInputs,
    modelCalibratePlot
};
