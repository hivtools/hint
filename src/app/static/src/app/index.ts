import {createApp} from "vue";
import {store} from "./main"
import {router} from "./router"
import Hint from "./components/Hint.vue"
import translate from "./directives/translate";
import FloatingVue from "floating-vue";
import 'floating-vue/dist/style.css';
import "../scss/style.scss";

const mountEl = document.querySelector("#app");
const app = createApp(Hint, {...(mountEl as HTMLDivElement).dataset});

// TODO dis-disable warnings after most of the warnings have been fixed
// TODO comment this warn handler out if you dare
app.config.warnHandler = () => null;

app.use(store);
app.use(router);

const options = {
    // Set float distance so that the arrow does not overlap
    // the tooltip icon. This was causing multiple mouse
    // events to be triggered causing the tooltip to flicker
    distance: 12,
    themes: {
        'tooltip': {
            html: true,
            delay: {
                show: 0,
                hide: 0,
            },
        },
    }
}

app.use(FloatingVue, options);

app.directive("translate", translate(store));
app.config.globalProperties.$store = store;

app.mount('#app');

export default app;
