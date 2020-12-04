const urlParams = new URLSearchParams(window.location.search);
const shareProject = !urlParams.get('shareProject');
const promoteProject = !urlParams.get('promoteProject');
const renameProject = !urlParams.get('renameProject');
const modelBugReport = !urlParams.get('modelBugReport');
export const switches = {
    shareProject: shareProject,
    promoteProject: promoteProject,
    renameProject: renameProject,
    modelBugReport: modelBugReport
}
