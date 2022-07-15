import Vue from "vue";
import {mapStatePropByName} from "../../utils";
import {Project} from "../../types";

interface Data {
    newProjectName: string
}

interface Computed {
    projects: Project[],
}

interface Methods {
    invalidName: (projectName: string) => boolean
}

export default Vue.extend<Data, Methods, Computed, unknown>({
    data() {
        return {
            newProjectName: ""
        }
    },
    computed: {
        projects: mapStatePropByName<Project[]>("projects", "previousProjects")
    },
    methods: {
        invalidName(projectName) {
            return this.projects.map(p => p.name).indexOf(projectName) > -1
        }
    }
});
