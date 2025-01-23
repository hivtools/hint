<template>
    <div id="page-controls" class="text-center">
        <button id="previous-page"
                class="btn btn-sm me-2 btn-red"
                v-translate:aria-label="'previousPage'"
                :disabled="pageNumber === 1"
                @click="pageUpdate(pageNumber - 1)">
            <vue-feather type="chevron-left" size="20" class="pagination-icon"></vue-feather>
        </button>
        <span id="page-number-start" class="page-text me-1" v-translate="'page'"/>
        <number-input id="page-number-input"
                      class="me-1"
                      :value="pageNumber"
                      @set-value="pageUpdate"
                      type="number"
                      name="page-number-input"
                      :min="1"
                      :max="totalPages"
                      :step="1"/>
        <span id="page-number-end" class="page-text">
            {{ totalPagesText }}
        </span>
        <button id="next-page"
                class="btn btn-sm ms-2 btn-red"
                v-translate:aria-label="'nextPage'"
                :disabled="totalPages === pageNumber"
                @click="pageUpdate(pageNumber + 1)">
            <vue-feather type="chevron-right" size="20" class="pagination-icon"></vue-feather>
        </button>
    </div>
</template>

<script lang="ts">
import i18next from "i18next";
import {computed, defineComponent} from "vue";
import VueFeather from "vue-feather";
import { useStore } from "vuex";
import { RootState } from "../../../root";
import NumberInput from "../../common/NumberInput.vue";

export default defineComponent({
    emits: ["set-page"],
    components: {
        NumberInput,
        VueFeather
    },
    props: {
        pageNumber: {
            type: Number,
            required: true
        },
        totalPages: {
            type: Number,
            required: true
        }
    },
    setup(props, { emit }) {
        const store = useStore<RootState>();
        const totalPagesText = computed(() => {
            return i18next.t("pageTotal", {
                totalPages: props.totalPages,
                lng: store.state.language
            })
        })
        const pageUpdate = (newValue: number) => {
            emit("set-page", newValue)
        }
        return { totalPagesText, pageUpdate };
    }
})
</script>

<style scoped>
.pagination-icon {
    vertical-align: sub;
}

.btn-red, .btn-red:hover, .btn-red:disabled, .btn-red:focus, .btn-red:active {
    border-color: transparent;
}

.btn-red:focus, .btn-red:active {
    box-shadow: none;
    background-color: #e31837;
}

.btn-red:disabled {
    background-color: darkgray;
}

.page-text {
    color: #636668;
}
</style>
