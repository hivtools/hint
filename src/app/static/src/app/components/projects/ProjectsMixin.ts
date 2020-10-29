import Vue from "vue";
import {mapStatePropByName} from "../../utils";
import {Project} from "../../types";

interface Data {
    newProjectName: string
}

interface Computed {
    projects: Project[],
    invalidName: boolean
}

export default Vue.extend<Data, unknown, Computed, unknown>({
    data() {
        return {
            newProjectName: ""
        }
    },
    computed: {
        projects: mapStatePropByName<Project[]>("projects", "previousProjects"),
        invalidName() {
            return this.projects.map(p => p.name).indexOf(this.newProjectName) > -1
        }
    }
});
