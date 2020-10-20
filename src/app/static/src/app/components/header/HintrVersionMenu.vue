<template>
  <drop-down :text="`v${hintrVersions.naomi}`" :right="true" style="flex: none">
    <span class="dropdown-item"> naomi    : v{{ hintrVersions.naomi }} </span>
    <span class="dropdown-item"> hintr    : v{{ hintrVersions.hintr }} </span>
    <span class="dropdown-item"> rrq      : v{{ hintrVersions.rrq }} </span>
    <span class="dropdown-item"> traduire : v{{ hintrVersions.traduire }}</span>
  </drop-down>
</template>

<script lang="ts">
import Vue from "vue";
import { ActionMethod, mapActions } from "vuex";
import { HintrVersionResponse } from "../../generated";
import { RootState } from "../../root";
import { mapActionByName, mapStateProp } from "../../utils";
import DropDown from "./DropDown.vue";

interface Computed {
  hintrVersions: HintrVersionResponse;
}

interface Methods {
  showHintrVersion: () => void;
}

const namespace = "hintrVersion";
export default Vue.extend<{}, Methods, Computed, {}>({

  computed: {
    hintrVersions: mapStateProp<RootState, HintrVersionResponse>(
      null,
      (state: RootState) => state.hintrVersion.hintrVersion
    ),
  },

  methods: {
    showHintrVersion: mapActionByName(namespace, "getHintrVersion"),
  },

  mounted() {
    this.showHintrVersion();
  },

  components: {
    DropDown,
  },
});
</script>