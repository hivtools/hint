import i18next from "i18next";
import {Store} from "vuex";
import {TranslatableState} from "../root";
import {DirectiveOptions} from "vue";
import {Language} from "../store/translations/locales";

export default <S extends TranslatableState>(store: Store<S>): DirectiveOptions => ({
    bind(el, binding, vnode) {

        (el as any).__key = el.innerText.trim();

        const translateText = (lng: Language) => {
            const attribute = binding.arg;
            if (attribute) {
                el.setAttribute(attribute, i18next.t(binding.value, {lng}));
            } else {
                el.innerText = i18next.t((el as any).__key, {lng});
            }
        };

        translateText(store.state.language);

        (el as any).__lang_unwatch__ = store.watch(state => state.language, lng => {
            translateText(lng)
        })
    },

    unbind(el) {
        (el as any).__lang_unwatch__ && (el as any).__lang_unwatch__()
    }
});
