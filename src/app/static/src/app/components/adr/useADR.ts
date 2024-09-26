import {useStore} from "vuex";
import {computed, onBeforeMount, onMounted} from "vue";

export const useADR = () => {
    const store = useStore();

    const isGuest = computed<boolean>(() => {
        return store.getters["isGuest"]
    });
    const ssoLogin = computed<boolean>(() => {
        return store.state.adr.ssoLogin
    });
    const key = computed<string | null>(() => {
        return store.state.adr.key
    });

    onBeforeMount(async () => {
        if (!isGuest.value && !ssoLogin.value) {
            await store.dispatch("adr/fetchKey");
        }
    });

    onMounted(async () => {
        if (!isGuest.value) {
            await store.dispatch("adr/ssoLoginMethod");
        }
    });

    return {
        isGuest,
        ssoLogin,
        key
    }
}
