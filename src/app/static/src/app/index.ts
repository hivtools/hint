import {createApp} from "vue";
import {createStore} from "./main"
import {guardAgainstGuests, router} from "./router"
import {getMe} from "./me";
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

// Shown when the app cannot find out who the user is. The visitor is not taken to be a guest: a logged in user who
// was shown the guest app could lose their work.
const showStartError = (mountEl: Element) => {
    const message = document.createElement("p");
    message.id = "start-error";
    message.className = "text-center mt-5";
    message.textContent = "Naomi could not start. Please check your connection and reload the page.";
    mountEl.replaceChildren(message);
};

export const startApp = async () => {
    const mountEl = document.querySelector("#app");
    if (!mountEl) {
        return null;
    }

    let me;
    try {
        me = await getMe();
    } catch (error) {
        console.error(error);
        showStartError(mountEl);
        return null;
    }

    document.title = me.title;
    const store = createStore(me.user);
    guardAgainstGuests(store);

    const app = createApp(Hint, {title: me.title, user: me.user});
    app.use(store);
    app.use(router);

    app.use(FloatingVue, options);

    app.directive("translate", translate(store));
    app.config.globalProperties.$store = store;

    app.mount('#app');

    return app
}

export default startApp();
