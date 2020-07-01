<template>
    <!-- <table>
         <tr>
             <th v-for="(v, k, i) in tabledata[0]">{{ k }}</th>
        </tr>
        <tr v-for="x in tabledata">
            <td v-for="z in x">{{ z }}</td>
        </tr>
    </table> -->
    <h3>This the new table</h3>
</template>

<script lang="ts">
import Vue from "vue";

interface Props {
        tabledata: any[]
    }

const props = {
    tabledata: {
        type: Array
    }
}

// export default Vue.extend<Props>({
export default ({
    name: "table-view",
    // data(): Data {
    data() {
      return {
        //   showTrace: false
      }
    }
});
</script>