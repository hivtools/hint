import { defineComponent } from "vue";
import {mapStatePropByName} from "../../utils";
import {Project} from "../../types";
import { defineComponentVue2 } from "../../defineComponentVue2/defineComponentVue2";

interface Data {
    newProjectName: string
}

interface Computed {
    projects: Project[],
}

interface Methods {
    invalidName: (projectName: string) => boolean
}

export default defineComponent({
    data() {
        return {
            newProjectName: ""
        }
    },
    computed: {
        projects: mapStatePropByName<Project[]>("projects", "previousProjects")
    },
    methods: {
        invalidName(projectName: string) {
            return this.projects.map(p => p.name).indexOf(projectName) > -1
        }
    }
});
