const urlParams = new URLSearchParams(window.location.search);
const shareProject = !!urlParams.get('shareProject');
const copyProject = !!urlParams.get('copyProject');
export const switches = {
    shareProject: shareProject,
    copyProject: copyProject
}
