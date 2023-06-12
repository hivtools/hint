import {createApp} from "vue";
import {store} from "./main"
import {router} from "./router"
import Hint from "./components/Hint.vue"
import translate from "./directives/translate";
import FloatingVue from "floating-vue";
import 'floating-vue/dist/style.css';
import '../scss/style.scss';

const app = createApp(Hint);

// TODO dis-disable warnings after most of the warnings have been fixed
// TODO comment this warn handler out if you dare
app.config.warnHandler = () => null;

app.use(store);
app.use(router);
app.use(FloatingVue);

app.directive("translate", translate(store));
app.config.globalProperties.$store = store;

app.mount('#app');

export default app;
