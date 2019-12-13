import i18next from "i18next";
import {Store} from "vuex";
import {TranslatableState} from "../root";
import {DirectiveOptions} from "vue";
import {Language} from "../store/translations/locales";

export default <S extends TranslatableState>(store: Store<S>): DirectiveOptions => ({
    bind(el, binding, vnode) {

        const ele = el as any;

        ele.__key = binding.value;
        ele.__translationAttr = binding.arg;

        ele.__translateText = (lng: Language) => {
            const attribute = ele.__translationAttr;
            if (!ele.__key) return;
            if (attribute) {
                el.setAttribute(attribute, i18next.t(ele.__key, {lng}));
            } else {
                el.innerText = i18next.t(ele.__key, {lng});
            }
        };

        ele.__translateText(store.state.language);

        ele.__lang_unwatch__ = store.watch(state => state.language, lng => {
            ele.__translateText(lng)
        })
    },

    update(el, binding) {
        const ele = el as any;
        ele.__key = binding.value;
        ele.__translationAttr = binding.arg;
        ele.__translateText(store.state.language)
    },

    unbind(el) {
        (el as any).__lang_unwatch__ && (el as any).__lang_unwatch__()
    }
});
