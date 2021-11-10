<template>
  <div id="app">
    <Header v-show="$route.name !== 'Home'"></Header>
    <router-view />
  </div>
</template>

<script>
import Header from "./components/Header";
import { mapActions } from "vuex";
export default {
  components: {
    Header
  },
  methods: {
    ...mapActions(["metaMaskInit", "walletConnectInit"])
  },
  mounted() {
    const wallet = localStorage.getItem("wallet");
    if (wallet === "MetaMask") {
      this.metaMaskInit();
    } else if (wallet === "WalletConnect") {
      this.walletConnectInit();
    }
  }
};
</script>

<style lang="scss" scoped>
#app {
  min-height: 100vh;
  width: 100%;
}
</style>
