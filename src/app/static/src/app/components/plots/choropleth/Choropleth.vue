<template>
    <div>
        <h1>Choropleth</h1>
        {{ plotData }}
    </div>

</template>

<script lang="ts">
import {defineComponent, ref} from "vue";
import {useStore} from "vuex";
import {RootState} from "../../../root";
import {PlotData} from "../../../store/plotData/plotData";

export default defineComponent({
    setup() {
        const store = useStore<RootState>();
        const plotData = ref<PlotData>(store.state.plotData.choropleth)
        return {plotData}
    }

})
</script>
