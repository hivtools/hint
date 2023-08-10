<template>
    <div v-if="loggedIn" class="mb-5">
        <adr-key></adr-key>
        <div v-if="key">
            <select-dataset></select-dataset>
            <div class="pt-3" id="adr-capacity" v-if="selectedDataset">
                <span class="font-weight-bold align-self-stretch" v-translate="'adrAccessLevel'"></span>
                <span v-tooltip="handleUploadPermission(hasUploadPermission, true)">
                    <span class="text-danger ml-1">{{ handleUploadPermission(hasUploadPermission, false) }}</span>
                </span>
            </div>
        </div>
    </div>
</template>
<script lang="ts">
    import {mapActionByName, mapStateProp, mapGetterByName} from "../../utils";
    import AdrKey from "./ADRKey.vue";
    import SelectDataset from "./SelectDataset.vue";
    import {ADRState} from "../../store/adr/adr";
    import i18next from "i18next";
    import {RootState} from "../../root";
    import {Language} from "../../store/translations/locales";
    import {BaselineState} from "../../store/baseline/baseline";
    import {Dataset} from "../../types";
    import {defineComponent} from "vue";

    const namespace = "adr";

    export default defineComponent({
        components: {
            "adr-key": AdrKey,
            "select-dataset": SelectDataset
        },
        computed: {
            isGuest: mapGetterByName(null, "isGuest"),
            loggedIn(): boolean {
                return !this.isGuest
            },
            key: mapStateProp<ADRState, string | null>(namespace,
                (state: ADRState) => state.key),

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
            getDatasets: mapActionByName(namespace, 'getDatasets'),
            fetchADRKey: mapActionByName(namespace, "fetchKey"),
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
        beforeMount() {
            if (this.loggedIn) {
                this.fetchADRKey();
            }
        },
        watch: {
            key() {
                this.getDatasets();
            },
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
