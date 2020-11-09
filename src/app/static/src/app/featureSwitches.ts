const urlParams = new URLSearchParams(window.location.search);
const shareProject = !urlParams.get('shareProject');
const promoteProject = !urlParams.get('promoteProject');
const renameProject = !urlParams.get('renameProject');
export const switches = {
    shareProject: shareProject,
    promoteProject: promoteProject,
    renameProject: renameProject
}
