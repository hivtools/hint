<template>
    <div id="selectRelease" v-if="datasetId && releases.length">
        <div class="pt-2">
            <input
                type="radio"
                id="useLatest"
                value="useLatest"
                v-model="choiceADR"
            />
            <label for="useLatest" v-translate="'useLatest'" class="pr-1"></label>
            <span class="icon-small" v-tooltip="translate('datasetTooltip')">
                <help-circle-icon></help-circle-icon>
            </span>
            <br />
        </div>
        <div>
            <input
                type="radio"
                id="useRelease"
                value="useRelease"
                v-model="choiceADR"
            />
            <label
                for="useRelease"
                v-translate="'useRelease'"
                class="pr-1"
            ></label>
            <span class="icon-small" v-tooltip="translate('releaseTooltip')">
                <help-circle-icon></help-circle-icon>
            </span>
            <br />
        </div>

        <label
            for="releaseSelector"
            class="font-weight-bold"
            v-translate="'releases'"
        ></label>
        <tree-select
            id="releaseSelector"
            :multiple="false"
            :searchable="true"
            :options="releaseOptions"
            :placeholder="translate('select')"
            :disabled="!useRelease"
            v-model="releaseId"
        >
            <label
                slot="option-label"
                slot-scope="{ node }"
                v-html="node.raw.customLabel"
            >
            </label>
        </tree-select>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import { mapActionByName, mapStateProp, mapMutationByName } from "../../utils";
    import TreeSelect from "@riophae/vue-treeselect";
    import { ADRState } from "../../store/adr/adr";
    import { HelpCircleIcon } from "vue-feather-icons";
    import { VTooltip } from "v-tooltip";
    import i18next from "i18next";
    import { Language } from "../../store/translations/locales";
    import { RootState } from "../../root";
    import {ADRMutation} from "../../store/adr/mutations";
    import { Release, Dataset } from "../../types";
    import { BaselineState } from "../../store/baseline/baseline";

    interface Data {
        releaseId: string | undefined;
        choiceADR: "useLatest" | "useRelease";
    }

    interface Methods {
        getReleases: (id: string) => void;
        clearReleases: () => void;
        translate(text: string): string;
    }

    interface Computed {
        releases: Release[];
        initialRelease: string | undefined;
        // releaseName: string | null;
        valid: boolean;
        releaseOptions: any[];
        useRelease: boolean;
        currentLanguage: Language;
    }

    interface Props {
        datasetId: string | null;
    }

    const namespace = "adr";

    export default Vue.extend<Data, Methods, Computed, Props>({
        components: {
            TreeSelect,
            HelpCircleIcon,
        },
        props: {
            datasetId: String,
        },
        data() {
            return {
                releaseId: undefined,
                choiceADR: "useLatest",
            };
        },
        computed: {
            releases: mapStateProp<ADRState, any[]>(
                namespace,
                (state: ADRState) => state.releases
            ),
            initialRelease: mapStateProp<BaselineState, string | undefined>(
                "baseline",
                (state: BaselineState) => state.selectedDataset?.release
            ),
            valid() {
                return (this.choiceADR === "useLatest") || !!this.releaseId;
            },
            releaseOptions() {
                return this.releases.map((d) => ({
                    id: d.id,
                    label: d.name,
                customLabel: `${d.name}
                    <div class="text-muted small" style="margin-top:-5px; line-height: 0.8rem">
                        ${d.notes ? d.notes + "<br/>" : ""}
                    </div>`,
                }));
            },
            // releaseName(){
            //     // console.log('everything', this.releaseId, this.releases.length, this.releases.find( release => release.id === this.releaseId))
            //     if (this.releaseId && this.releases.length){
            //         return this.releases.find( release => release.id === this.releaseId).name
            //     } else {
            //         return null
            //     }
            // },
            useRelease() {
                return this.choiceADR === "useRelease";
            },
            currentLanguage: mapStateProp<RootState, Language>(
                null,
                (state: RootState) => state.language
            ),
        },
        methods: {
            getReleases: mapActionByName(namespace, "getReleases"),
            translate(text) {
                return i18next.t(text, { lng: this.currentLanguage });
            },
            clearReleases: mapMutationByName(namespace, ADRMutation.ClearReleases)
        },
        watch: {
            datasetId(id) {
                this.choiceADR = "useLatest";
                this.clearReleases()
                if (id) {
                    this.getReleases(id);
                }
            },
            choiceADR(choice) {
                if (choice === "useLatest") {
                    this.releaseId = undefined;
                }
            },
            releaseId() {
                this.$emit("selected-dataset-release", this.releaseId);
            },
            valid() {
                this.$emit("valid", this.valid);
            },
        },
        mounted(){
            this.$emit("selected-dataset-release", this.releaseId);
            this.$emit("valid", this.valid);
            if (this.initialRelease && this.releases.length){
                this.choiceADR = "useRelease"
                this.releaseId = this.initialRelease;
            }
            console.log('releaseId', this.releaseId)
        },
        directives: {
            tooltip: VTooltip,
        },
    });
</script>