import {createApp} from "vue";
import {store, storePassword} from "./main"
import {router} from "./router"
import translate from "./directives/translate";
import FloatingVue from "floating-vue";
import Hint from "./components/Hint.vue"
import 'floating-vue/dist/style.css';
import "../scss/style.scss";
import "bootstrap/scss/bootstrap-grid.scss";
import "@reside-ic/vue-nested-multiselect/style.css";

// tooltip options
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

const app = createApp(Hint);
app.use(store);
app.use(router);

app.use(FloatingVue, options);

app.directive("translate", translate(store));

app.mount('#app');

export default app
