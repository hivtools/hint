import i18next from "i18next";
import {Store} from "vuex";
import {TranslatableState} from "../root";
import {DirectiveOptions} from "vue";

export default <S extends TranslatableState>(store: Store<S>): DirectiveOptions => ({
    bind(el, binding, vnode) {

        const attribute = binding.arg!!;
        el.setAttribute(attribute, i18next.t(binding.value, {lng: store.state.language}));

        (el as any).__lang_unwatch__ = store.watch(state => state.language, language => {
            console.log("lang change", language)
            el.setAttribute(attribute, i18next.t(binding.value, {lng: language}));
        })
    },

    unbind(el) {
        (el as any).__lang_unwatch__ && (el as any).__lang_unwatch__()
    }
});
