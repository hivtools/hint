import i18next from "i18next";
import {Store} from "vuex";
import {DirectiveOptions, VNode} from "vue";
import {Language} from "../store/translations/locales";
import {DirectiveBinding} from "vue/types/options";
import {TranslatableState} from "../types";
import {localStorageManager} from "../localStorageManager";

export default <S>(store: Store<S>): DirectiveOptions => {

    function _validateBinding(binding: DirectiveBinding, vnode: VNode): boolean {
        if (!binding.value) {
            console.warn("v-translate directive declared without a value", {tag: vnode.tag, data: vnode.data});
            return false;
        }
        return true;
    }

    function _translateText(lng: Language, el: HTMLElement, binding: DirectiveBinding) {
        const attribute = binding.arg;
        let translatedText = i18next.t(binding.value, {lng});
        if (binding.modifiers.lowercase) {
            translatedText = translatedText.toLowerCase()
        }
        if (attribute) {
            el.setAttribute(attribute, translatedText);
        } else {
            el.innerHTML = translatedText;
        }
    }

    function _addWatcher(el: HTMLElement, binding: DirectiveBinding) {
        const ele = el as any;
        ele.__lang_unwatch__ = ele.__lang_unwatch__ || {};

        // Function to update the element's text content based on language
        const updateTextContent = (lng: Language) => {
            _translateText(lng, el, binding);
        };

        const languageWatcher = () => {
            const storedLanguage = localStorageManager.getLanguageState();
            if (storedLanguage) {
                updateTextContent(storedLanguage);
            }
        };

        if (binding.arg) {
            // this is an attribute binding
            ele.__lang_unwatch__[binding.arg] = languageWatcher;
        } else {
            // this is a default, i.e. innerHTML, binding
            ele.__lang_unwatch__['innerHTML'] = languageWatcher;
        }
    }

    function _removeWatcher(el: HTMLElement, binding: DirectiveBinding) {
        const ele = el as any;

        if (binding.arg) {
            // this is an attribute binding
            ele.__lang_unwatch__[binding.arg]()
        } else {
            // this is a default, i.e. innerHTML, binding
            ele.__lang_unwatch__["innerHTML"]()
        }
    }

    return {
        bind(el, binding, vnode: VNode) {
            if (!_validateBinding(binding, vnode)) return;
            const storedLanguage = localStorageManager.getLanguageState();
            _translateText(storedLanguage, el, binding);
            _addWatcher(el, binding);
        },
        update(el, binding, vnode) {
            if (!_validateBinding(binding, vnode)) return;

            // first remove the existing watcher for this directive instance
            // since it has the previous value of the binding cached
            _removeWatcher(el, binding);

            // now re-add them with the new binding properties
            const storedLanguage = localStorageManager.getLanguageState();
            _translateText(storedLanguage, el, binding);
            _addWatcher(el, binding);
        },
        unbind(el, binding) {
            _removeWatcher(el, binding);
        }
    }
}
