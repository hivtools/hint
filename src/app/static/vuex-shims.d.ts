// static/vuex-shims.d.ts
import type {Store} from "vuex";
import type {RootState} from "./src/app/root";

declare module 'vue' {
    interface ComponentCustomProperties {
        $store: Store<RootState>;
    }
}
