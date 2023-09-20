import { defineComponent } from "vue";
import {mapStatePropByName} from "../../utils";
import {Project} from "../../types";

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
            return this.projects.map((p: Project) => p.name).indexOf(projectName) > -1
        }
    }
});
