<template>
    <l-control position="topleft">
        <div class="leaflet-control-zoom leaflet-bar">
            <a @click.prevent="$emit('reset-view')" 
                class="leaflet-control-zoom-in" 
                href="#" :title="tooltipContent('resetView')" 
                role="button" 
                :aria-label="tooltipContent('resetView')">
                <refresh-cw-icon size="20"></refresh-cw-icon>
            </a>
        </div>                    
    </l-control>
</template>

<script lang="ts">
    import Vue from "vue";
    import {LControl} from 'vue2-leaflet';
    import {mapStateProp} from "../../utils";
    import {RootState} from "../../root";
    import {RefreshCwIcon} from "vue-feather-icons";
    import i18next from "i18next";
    import {Language} from "../../store/translations/locales";

    interface Computed {
        currentLanguage: Language
    }

    interface Methods {
        tooltipContent: (tooltipValue: string) => string
    }

    export default Vue.extend<{}, Methods, Computed>({
        components: {
            RefreshCwIcon,
            LControl
        },
        computed: {
            currentLanguage: mapStateProp<RootState, Language>(
                null,
                (state: RootState) => state.language
            )
        },
        methods: {
            tooltipContent(tooltipValue: string) {
                return i18next.t(tooltipValue, {
                    lng: this.currentLanguage,
                });
            }
        }
    });
</script>
