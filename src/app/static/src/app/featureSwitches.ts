const urlParams = new URLSearchParams(window.location.search);
const shareProject = !!urlParams.get('shareProject');
const promoteProject = !!urlParams.get('promoteProject');
export const switches = {
    shareProject: shareProject,
    promoteProject: promoteProject
}
