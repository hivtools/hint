<template>
    <div v-if="!isGuest" class="mb-5">
        <adr-dataset></adr-dataset>
        <div class="pt-3" id="adr-capacity" v-if="selectedDataset">
            <span class="font-weight-bold align-self-stretch" v-translate="'adrAccessLevel'"></span>
            <span v-tooltip="handleUploadPermission(hasUploadPermission, true)">
                <span class="text-danger ml-1">{{ handleUploadPermission(hasUploadPermission, false) }}</span>
            </span>
        </div>
    </div>
</template>
<script lang="ts">
import {mapActionByName, mapStateProp} from "../../utils";
import AdrDataset from "./ADRInputDataset.vue";
import type {ADRState} from "../../store/adr/adr";
import i18next from "i18next";
import type {RootState} from "../../root";
import type {Language} from "../../store/translations/locales";
import type {BaselineState} from "../../store/baseline/baseline";
import type {Dataset} from "../../types";
import {defineComponent} from "vue";
import {useADR} from "./useADR";

const namespace = "adr";

export default defineComponent({
    components: {
        "adr-dataset": AdrDataset
    },
    setup() {
        return useADR();
    },
    computed: {
        hasUploadPermission: mapStateProp<ADRState, boolean>(namespace,
                                                             (state: ADRState) => state.userCanUpload),

        currentLanguage: mapStateProp<RootState, Language>(
            null,
            (state: RootState) => state.language
        ),
        selectedDataset: mapStateProp<BaselineState, Dataset | null>("baseline",
                                                                     (state: BaselineState) => state.selectedDataset)
    },
    methods: {
        getUserCanUpload: mapActionByName(namespace, 'getUserCanUpload'),
        handleUploadPermission: function (isADRWriter: boolean, isTooltip: boolean) {
            let displayText = null;
            switch (isADRWriter) {
                case true:
                    if (isTooltip) {
                        displayText = this.getTranslation("adrReadWriteTooltip")
                    } else {
                        displayText = this.getTranslation("adrReadWrite")
                    }
                    break
                case false:
                    if (isTooltip) {
                        displayText = this.getTranslation("adrReadTooltip")
                    } else {
                        displayText = this.getTranslation("adrRead")
                    }
            }
            return displayText
        },
        getTranslation(key: string) {
            return i18next.t(key, {
                lng: this.currentLanguage,
            });
        }
    },
    watch: {
        selectedDataset() {
            this.getUserCanUpload()
        }
    },
    mounted() {
        if(this.selectedDataset) {
            this.getUserCanUpload();
        }
    }
})
</script>
