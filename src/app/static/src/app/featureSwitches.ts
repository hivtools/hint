const urlParams = new URLSearchParams(window.location.search);
const modelBugReport = !urlParams.get('modelBugReport');
const adrPushInputs = urlParams.get('adrPushInputs');
export const switches = {
    modelBugReport,
    adrPushInputs
};
