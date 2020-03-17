import {ColourScaleType} from "../../store/colourScales/colourScales";
<template>
    <div v-if="show" class="p-3">
        <div class="form-check">
            <label class="form-check-label">
                <input class="form-check-input" type="radio" name="scaleType" :value="ColourScaleType.Default" v-model="colourScale.type" @change="update">
                Default
            </label>
        </div>
        <div class="form-group">
            <div class="form-check">
                <label class="form-check-label">
                    <input class="form-check-input" type="radio" name="scaleType" :value="ColourScaleType.Custom" v-model="colourScale.type" @change="update">
                    Custom
                </label>
            </div>
            <div class="ml-2">
                <div class="form-group">
                    <label for="custom-min-input">Min</label>
                    <input id="custom-min-input" type="number" v-model="colourScale.customMin" @change="update" :disabled="disableCustom">
                </div>
                <div class="form-group">
                    <label for="custom-max-input">Max</label>
                    <input id="custom-max-input" type="number" v-model="colourScale.customMax" @change="update" :disabled="disableCustom">
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {ColourScaleSettings, ColourScaleType} from "../../store/colourScales/colourScales";

    interface Props {
        show: Boolean,
        colourScale: ColourScaleSettings
    }

    interface Computed {
        disableCustom: Boolean
    }

    export default Vue.extend<{}, {}, {}, Props>({
        name: "MapAdjustScale",
        props: {
           show: Boolean,
           colourScale: Object,
        },
        data(): any {
            return {
                ColourScaleType
            };
        },
        computed: {
            disableCustom() {
                const result = this.colourScale.type != ColourScaleType.Custom;
                return result;
            }
        },
        methods: {
            update: function(){
                this.$emit("update", this.colourScale)
            }
        }
    });
</script>
