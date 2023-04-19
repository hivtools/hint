import { createApp } from "vue";
import Vuex, {mapActions, mapState} from "vuex";
import registerTranslations from "./store/translations/registerTranslations";
import {DataExplorationState, storeOptions} from "./store/dataExploration/dataExploration";
import Errors from "./components/Errors.vue";
import {Language} from "./store/translations/locales";
import DataExploration from "./components/dataExploration/DataExploration.vue";
import DataExplorationHeader from "./components/header/DataExplorationHeader.vue";
// import {Route} from "vue-router/types/router";
// import {router} from "./router";
import Accessibility from "./components/Accessibility.vue";

// Vue.use(Vuex);
// Vue.use(VueRouter);

export const store = new Vuex.Store<DataExplorationState>(storeOptions);
registerTranslations(store);

// export const beforeEnter = (to: Route, from: Route, next: NavigationGuardNext) => {
//     if (store.state.currentUser === "guest" && !sessionStorage.getItem("asGuest")) {
//         window.location.assign("/login?redirectTo=explore");
//     } else {
//         next();
//     }
// }

export const routes2 = [
    {
        path: "/callback/explore",
        component: DataExploration,
        // beforeEnter
    },
    {path: "/accessibility", component: Accessibility}
];

export const dataExplorationApp = createApp({
    el: "#app",
    store,
    // router,
    components: {
        DataExplorationHeader,
        Errors,
        DataExploration
    },
    computed: mapState<DataExplorationState>({
        language: (state: DataExplorationState) => state.language
    }),
    methods: {
        ...mapActions({loadBaseline: 'baseline/getBaselineData'}),
        ...mapActions({loadSurveyAndProgram: 'surveyAndProgram/getSurveyAndProgramData'}),
        ...mapActions({getADRSchemas: 'adr/getSchemas'}),
        ...mapActions({getGenericChartMetadata: 'genericChart/getGenericChartMetadata'})
    },
    beforeMount: function () {
        this.loadBaseline();
        this.loadSurveyAndProgram();
        this.getADRSchemas();
        this.getGenericChartMetadata();
    },
    watch: {
        language(newVal: Language) {
            document.documentElement.lang = newVal
        }
    }
});
