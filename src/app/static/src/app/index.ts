import {createApp} from "vue";
import {store} from "./main"
import {router} from "./router"
import translate from "./directives/translate";
import FloatingVue from "floating-vue";
import Hint from "./components/Hint.vue"
import 'floating-vue/dist/style.css';
import "../scss/style.scss";
import "bootstrap/scss/bootstrap-grid.scss";
import "@reside-ic/vue-nested-multiselect/style.css";

const mountEl = document.querySelector("#app");

// Some components (for example the plots) load from separate files when the user first opens them.
// After a deploy, the server has only the files of the new build. A page that was open before the deploy
// then cannot load these files, and Vite fires vite:preloadError. Reload the page to get the new build.
// The app keeps its state in local storage, so the user does not lose work. Reload at most once in 10 seconds,
// so that a file that is missing for a different reason does not cause a reload loop.
window.addEventListener("vite:preloadError", (event) => {
    const lastReload = Number(sessionStorage.getItem("preloadErrorReload") || 0);
    if (Date.now() - lastReload > 10000) {
        event.preventDefault();
        sessionStorage.setItem("preloadErrorReload", String(Date.now()));
        window.location.reload();
    }
});

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

const getApp = () => {
    if (mountEl) {
        const app = createApp(Hint, {...(mountEl as HTMLDivElement).dataset});
        app.use(store);
        app.use(router);

        app.use(FloatingVue, options);

        app.directive("translate", translate(store));
        app.config.globalProperties.$store = store;

        app.mount('#app');

        return app
    } else {
        return {}
    }
}

export default getApp();
