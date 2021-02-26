const urlParams = new URLSearchParams(window.location.search);
const modelBugReport = !urlParams.get('modelBugReport');
export const switches = {
    modelBugReport: modelBugReport
};
