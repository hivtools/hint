const urlParams = new URLSearchParams(window.location.search);
const adrPushInputs = urlParams.get('adrPushInputs');
const modelCalibratePlot = urlParams.get('modelCalibratePlot');

export const switches = {
    adrPushInputs,
    modelCalibratePlot
};
