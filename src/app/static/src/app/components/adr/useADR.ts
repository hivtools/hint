import {useStore} from "vuex";
import {computed} from "vue";

export const useADR = () => {
    const store = useStore();

    const isGuest = computed<boolean>(() => {
        return store.getters["isGuest"]
    });

    return {
        isGuest
    }
}
